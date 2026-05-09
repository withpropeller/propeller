import mongoose, { Model, SaveOptions, HydratedDocument, PopulateOptions } from 'mongoose';
import { Utils } from '@core/helpers';
import {
    APIPagingData,
    APIPagingDto,
    MongoAPIPaging,
    MongoAPIPagingOptions,
    MongoAPIQueryOptions,
} from '@common/api-paging';
import { ExecutionOptions } from '@common/interfaces';
import { MongoException, MongoExceptionConflict } from './mongo.exception';
import { BasicHash } from '@core/crypto/basic-hash';
import { ATLAS_ERROR_CODE, MONGO_UNIQUE_CONSTRAINT_CODE, ensureObjectId } from './mongo.utils';

export interface DocTimestamp {
    createdAt: Date;
    updatedAt: Date;
}

export interface LedgerMetadata {
    meta?: Record<string, any>;
}

export abstract class LedgerRepository<T> {
    private readonly modelName: string;

    protected constructor(
        protected readonly model: Model<HydratedDocument<T>>,
        protected readonly options: MongoAPIPagingOptions = {},
    ) {
        this.modelName =
            'modelName' in this.model.collection
                ? (this.model.collection.modelName as string)
                : this.model.collection.name;
    }

    createPartial(details: Partial<T>): HydratedDocument<T> {
        return new this.model(Utils.removeNilValues(details));
    }

    async count(conditions = {}): Promise<number> {
        return await this.model.countDocuments(conditions);
    }

    async findOne(conditions = {}, options: MongoAPIQueryOptions = {}): Promise<HydratedDocument<T>> {
        return this.findOneWithOptions({ ...options, conditions });
    }

    async findOneWithOptions(options: MongoAPIQueryOptions): Promise<HydratedDocument<T>> {
        const populate = MongoAPIPaging.getExpandConstraints(
            options.expand as any,
            options.excludeExpand,
            options.populate,
        );
        const select = MongoAPIPaging.parseSelect(options.select, this.options);
        const sort = MongoAPIPaging.parseSort(options.sort);
        const entity = await this.model.findOne(options.conditions ?? {}, select, { populate, sort });

        if (!entity && !options.failSilently) {
            throw MongoException.EntityNotFound(this.modelName);
        }

        const activeState = typeof options.safe == 'string' ? options.safe : 'active';
        if (options.safe && !Utils.safeStringEqual((entity as any).status, activeState)) {
            if (options.safeException) {
                throw options.safeException;
            }
            throw MongoException.EntityNotInActiveState(this.modelName, activeState);
        }

        return entity;
    }

    async findById(
        id: string | mongoose.Types.ObjectId,
        options: MongoAPIQueryOptions = {},
    ): Promise<HydratedDocument<T>> {
        const populate = MongoAPIPaging.getExpandConstraints(
            options.expand as any,
            options.excludeExpand,
            options.populate,
        );
        const select = MongoAPIPaging.parseSelect(options.select, this.options);
        const entity = await this.model.findById(id, select, { populate, session: options.session });

        if (!entity && !options.failSilently) {
            throw MongoException.EntityNotFound(this.modelName);
        }

        const activeState = typeof options.safe == 'string' ? options.safe : 'active';
        if (options.safe && !Utils.safeStringEqual((entity as any).status, activeState)) {
            if (options.safeException) {
                throw options.safeException;
            }
            throw MongoException.EntityNotInActiveState(this.modelName, activeState);
        }

        return entity;
    }

    async findWithOptions(options: MongoAPIQueryOptions): Promise<HydratedDocument<T>[]> {
        const populate = MongoAPIPaging.getExpandConstraints(
            options.expand as any,
            options.excludeExpand,
            options.populate,
        );
        const select = MongoAPIPaging.parseSelect(options.select, this.options);
        const sort = MongoAPIPaging.parseSort(options.sort);
        return this.model.find(options.conditions ?? {}, select, { populate, sort });
    }

    async find(
        conditions = {},
        select?: string | string[],
        sort?: any,
        populate?: PopulateOptions,
    ): Promise<HydratedDocument<T>[]> {
        return this.model.find(conditions, select, { populate, sort });
    }

    /**
     * @deprecated use findOneWithOptions instead
     * @param conditions
     * @param populateStr
     * @param failSilently
     * @param select
     * @returns
     */
    async findOneAndPopulate(
        conditions = {},
        populateStr: string | string[] | PopulateOptions | PopulateOptions[],
        failSilently = false,
        selectStr?: string,
    ): Promise<HydratedDocument<T>> {
        const populate = MongoAPIPaging.getExpandConstraints(populateStr as any, [], []);
        const select = MongoAPIPaging.parseSelect(selectStr, this.options);
        const entity = await this.model.findOne(conditions, select, {
            populate,
        });
        if (!entity && !failSilently) {
            throw MongoException.EntityNotFound(this.modelName);
        }

        return entity;
    }

    async safeFindOneAndPopulate(
        conditions = {},
        populate: string | string[] | PopulateOptions | PopulateOptions[],
        activeString = 'ACTIVE',
        failSilently = false,
        select?: string,
    ) {
        const entity = await this.findOneAndPopulate(conditions, populate, failSilently, select);
        if ((entity as any).status !== activeString) {
            throw MongoException.EntityNotInActiveState(this.modelName, activeString);
        }
        return entity;
    }

    async save(entity: HydratedDocument<T>, options?: SaveOptions & ExecutionOptions): Promise<HydratedDocument<T>> {
        if (options?.dryRun) {
            return entity;
        }
        return entity.save(options) as Promise<HydratedDocument<T>>;
    }

    //TODO: change to aggregate function to get count in only one call
    async findByQuery(
        query: APIPagingDto,
        defaultConditions = {},
        excludeExpand?: string[],
        populateWithModel?: PopulateOptions[],
    ): Promise<APIPagingData<T>> {
        let results;
        let count;

        const { select, conditions, limit, sort, populate, reverseList } = MongoAPIPaging.getPagingConstraints(
            query,
            defaultConditions,
            excludeExpand,
            populateWithModel,
            this.options,
        );

        results = await this.model
            .find(conditions)
            .select(select)
            .populate(populate)
            .sort(sort)
            .limit(limit + 1)
            .exec();

        const hasMore = results.length > limit;
        if (results.length > limit) results.pop();

        if (query.countTotal) {
            // eslint-disable-next-line
            const { _id, ...withoutLastIdConditions } = conditions;
            count = await this.model.countDocuments(withoutLastIdConditions);
        }

        if (reverseList) {
            results = results.reverse();
        }

        return {
            data: results,
            metadata: {
                hasMore,
                totalCount: count,
            },
        };
    }

    //TODO: change to aggregate function to get count in only one call
    async findByQueryAggregate(query: APIPagingDto, defaultConditions = {}): Promise<T[]> {
        const { conditions, limit } = MongoAPIPaging.getPagingConstraints(query, defaultConditions);

        const pipeline = [
            {
                $match: conditions,
                //$project: { 'exclude.some.field': 0 },
            },
            {
                $facet: {
                    data: [{ $limit: limit }],
                    count: [{ $count: 'count' }],
                },
            },
        ];

        const arr = await this.aggregate(pipeline);
        return arr[0];
    }

    aggregate(pipeline?: any[], options?: Record<string, unknown>) {
        return this.model.aggregate(pipeline, options).exec();
    }

    private async findOneAndUpdate(
        criteria: Record<string, unknown>,
        update: Partial<T> | any,
        options?: SaveOptions & ExecutionOptions,
    ) {
        try {
            if (options?.dryRun) {
                return this.model.findOne(criteria as any);
            }
            return await this.model.findOneAndUpdate(criteria as any, update as any, { new: true, ...options });
        } catch (err: any) {
            if (err && err.code === MONGO_UNIQUE_CONSTRAINT_CODE) {
                throw MongoException.Conflict.setMessage('Unique constraint');
            }
            throw err;
        }
    }

    async updateOne(criteria: Record<string, unknown>, update: Partial<T>, options?: SaveOptions & ExecutionOptions) {
        try {
            return await this.model.updateOne(criteria as any, update as any, options);
        } catch (err: any) {
            if (err && err.code === MONGO_UNIQUE_CONSTRAINT_CODE) {
                throw MongoException.Conflict.setMessage('Unique constraint');
            }
            throw err;
        }
    }

    async ledgerInsert(
        doc: Partial<T & DocTimestamp>,
        options?: ExecutionOptions & LedgerMetadata,
    ): Promise<HydratedDocument<T>> {
        if (options?.dryRun) {
            return this.createPartial(doc);
        }

        doc = Utils.removeNilValues(doc);
        const historyCollection = this.model.collection.name + '_history';
        const entityId = new mongoose.Types.ObjectId();

        // build doc _meta
        const additionalMeta = Utils.removeNilValues(options?.meta ?? {});
        doc['_meta'] = {
            nonce: Utils.generateRandomBytes(32),
            op: 'insert',
            origId: entityId,
            prevHash: '',
            seqNo: 1,
            txTime: new Date(),
            ...additionalMeta,
        };

        const session = await this.model.startSession();
        try {
            session.startTransaction();
            const entity = await this.save(new this.model({ _id: entityId, ...doc }), { session });

            const computed = this.getEntityComputedHash(entity);
            computed.plain['_meta']['hash'] = computed.hash;

            await this.model.db.collection(historyCollection).insertOne(computed.plain, { session });
            await this.updateOne({ _id: entityId }, { $set: { '_meta.hash': computed.hash } } as any, {
                session,
                timestamps: false,
            });
            await session.commitTransaction();
            return entity;
        } catch (err: any) {
            await session.abortTransaction();
            if (err && err.code === MONGO_UNIQUE_CONSTRAINT_CODE) {
                throw new MongoExceptionConflict();
            }
            if (err && err.code === ATLAS_ERROR_CODE) {
                throw MongoException.AtlasError;
            }

            throw MongoException.LedgerError.setError(err);
        } finally {
            session.endSession();
        }
    }

    async ledgerUpdateById(
        entityId: string | mongoose.Types.ObjectId,
        update: Partial<T> | any,
        options?: ExecutionOptions & LedgerMetadata,
    ): Promise<void> {
        if (options?.dryRun) {
            return;
        }
        const historyCollection = this.model.collection.name + '_history';
        update['$set'] = {
            ...update['$set'],
            '_meta.nonce': Utils.generateRandomBytes(32),
            '_meta.op': 'update',
            '_meta.txTime': new Date(),
        };

        update['$inc'] = {
            ...update['$inc'],
            '_meta.seqNo': 1,
        };

        const additionalMeta = Utils.removeNilValues(options?.meta ?? {});
        for (const key in additionalMeta) {
            update['$set'][`_meta.${key}`] = additionalMeta[key];
        }

        const session = await this.model.startSession();
        try {
            session.startTransaction();

            const doc = await this.findOneAndUpdate({ _id: entityId }, update, { session });
            if (!doc) {
                throw MongoException.EntityNotFound(this.modelName);
            }

            // build doc to plain object
            doc['_meta']['prevHash'] = doc['_meta']['hash'];
            const computed = this.getEntityComputedHash(doc);

            computed.plain['_meta']['hash'] = computed.hash;

            await this.model.db.collection(historyCollection).insertOne(computed.plain, { session });
            await this.updateOne(
                { _id: entityId },
                { $set: { '_meta.hash': computed.hash, '_meta.prevHash': doc['_meta']['hash'] } } as any,
                { session, timestamps: false },
            );

            await session.commitTransaction();
        } catch (err) {
            await session.abortTransaction();
            throw MongoException.LedgerError.setError(err);
        } finally {
            session.endSession();
        }
    }

    async ledgerDeleteById(
        entityId: string | mongoose.Types.ObjectId,
        options?: SaveOptions & ExecutionOptions & LedgerMetadata,
    ): Promise<void> {
        const historyCollection = this.model.collection.name + '_history';

        const session = await this.model.startSession();
        try {
            session.startTransaction();
            const doc = await this.findById(entityId, { session });
            if (!doc) {
                throw MongoException.EntityNotFound(this.modelName);
            }

            // build doc to plain object
            doc['_meta']['nonce'] = Utils.generateRandomBytes(32);
            doc['_meta']['op'] = 'delete';
            doc['_meta']['prevHash'] = doc['_meta']['hash'];
            doc['_meta']['seqNo'] += 1;
            doc['_meta']['txTime'] = new Date();

            const additionalMeta = Utils.removeNilValues(options?.meta ?? {});
            for (const key in additionalMeta) {
                doc['_meta'][key] = additionalMeta[key];
            }

            const computed = this.getEntityComputedHash(doc);
            computed.plain['_meta']['hash'] = computed.hash;

            const deleted = await this.model.deleteOne({ _id: entityId }, { session }).exec();
            if (deleted.deletedCount === 0) {
                throw MongoException.EntityNotFound(this.modelName);
            }
            await this.model.db.collection(historyCollection).insertOne(computed.plain, { session, ...options });

            await session.commitTransaction();
        } catch (err) {
            await session.abortTransaction();
            throw MongoException.LedgerError.setError(err);
        } finally {
            session.endSession();
        }
    }

    async ledgerVerifyById(entityId: string | mongoose.Types.ObjectId, limit?: number): Promise<boolean> {
        entityId = ensureObjectId(entityId);
        const historyCollection = this.model.collection.name + '_history';
        let prevHash = undefined;
        let mainEntityComputed = undefined;
        let historyFound = false;

        const mainEntity = await this.findById(entityId, { failSilently: true });
        if (mainEntity) {
            mainEntityComputed = this.getEntityComputedHash(mainEntity);
            if (mainEntityComputed.hash !== mainEntity['_meta']['hash']) {
                return false;
            }
        }

        const cursor = this.model.db
            .collection(historyCollection)
            .find({ '_meta.origId': entityId })
            .sort({ '_meta.seqNo': 1 });

        if (limit) {
            cursor.limit(limit);
        }

        for await (const doc of cursor) {
            historyFound = true;
            const computed = this.getEntityComputedHash(doc);
            const hash = doc['_meta']['hash'];
            const docPrevHash = doc['_meta']['prevHash'];
            if (!prevHash) {
                prevHash = docPrevHash;
            }

            if (hash !== computed.hash) {
                return false;
            }

            if (prevHash !== docPrevHash) {
                return false;
            }

            prevHash = hash;
        }

        if (mainEntityComputed) {
            return prevHash === mainEntityComputed.hash;
        }

        return historyFound;
    }

    private getEntityComputedHash(entity: any): { plain: Record<string, string>; hash: string; staticHash: string } {
        if (!entity) {
            throw TypeError('entity cannot be null');
        }
        const obj = 'toObject' in entity && typeof entity.toObject === 'function' ? entity.toObject() : entity;
        const plain = Utils.pickKeys<Record<any, any>>(obj, '-_id -__v -_meta.hash');
        const hash = BasicHash.hashObject(plain, 'base64');
        const staticPlain = Utils.pickKeys<Record<any, any>>(plain, '_meta.nonce');
        const staticHash = BasicHash.hashObject(staticPlain, 'base64');
        return { plain, hash, staticHash };
    }
}

export const LedgerRepositoryFactory = <T>(
    model: Model<HydratedDocument<T>>,
    options?: MongoAPIPagingOptions,
): LedgerRepository<T> => {
    class Foo extends LedgerRepository<T> {
        constructor() {
            super(model, options);
        }
    }

    return new Foo();
};
