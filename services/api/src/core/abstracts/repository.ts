import {
    Model,
    InsertManyOptions,
    SaveOptions,
    QueryOptions,
    Types,
    HydratedDocument,
    PopulateOptions,
} from 'mongoose';
import { AppStatus, MONGO_UNIQUE_CONSTRAINT_CODE, Utils } from '@core/helpers';
import {
    APIPagingData,
    APIPagingDto,
    MongoAPIPaging,
    MongoAPIPagingOptions,
    MongoAPIQueryOptions,
} from '@common/api-paging';
import { AppException } from '@core/exceptions';
import { ExecutionOptions } from '@common/interfaces';

export abstract class Repository<T> {
    readonly collectionName: string;

    protected constructor(
        public readonly model: Model<HydratedDocument<T>>,
        protected readonly options: MongoAPIPagingOptions = {},
    ) {
        this.collectionName = Utils.toSentenceCase(this.model.collection.collectionName);
    }

    async createAndSave(details: Partial<T>, options?: SaveOptions & ExecutionOptions): Promise<HydratedDocument<T>> {
        try {
            const entity = this.createPartial(details);
            return await this.save(entity, options);
        } catch (err) {
            if (err && err.code === MONGO_UNIQUE_CONSTRAINT_CODE) {
                throw AppException.Conflict.setMessage('Unique constraint').setData({
                    keyValue: err['keyValue'],
                    keyPattern: err['keyPattern'],
                });
            }
            throw err;
        }
    }

    createPartial(details: Partial<T>): HydratedDocument<T> {
        return new this.model(Utils.removeNilValues(details));
    }

    async count(conditions = {}): Promise<number> {
        return await this.model.countDocuments(conditions);
    }

    async exists(conditions = {}): Promise<boolean> {
        const count = await this.model.countDocuments(conditions);
        return count > 0;
    }

    async findOneById(id: Types.ObjectId, failSilently = false): Promise<HydratedDocument<T>> {
        const entity = await this.model.findById(id).exec();
        if (!entity && !failSilently) {
            throw AppException.NotFound.setMessage(`${this.collectionName} not found`);
        }
        return entity;
    }

    async safeFindOneById(id: Types.ObjectId, activeString = 'ACTIVE') {
        const entity = await this.findOneById(id);
        if ((entity as any).status !== activeString) {
            throw AppException.BadRequest.setMessage(`${this.collectionName} not in ${activeString} state`);
        }
        return entity;
    }

    async findOne(conditions = {}, failSilently = false, select?: string): Promise<HydratedDocument<T>> {
        const entity = await this.model.findOne(conditions, select).exec();
        if (!entity && !failSilently) {
            throw AppException.NotFound.setMessage(`${this.collectionName} not found`);
        }
        return entity;
    }

    async findOneWithOptions(options: MongoAPIQueryOptions): Promise<HydratedDocument<T>> {
        const populate = MongoAPIPaging.getExpandConstraints(
            options.expand as any,
            options.excludeExpand,
            options.populate,
        );
        const select = MongoAPIPaging.parseSelect(options.select, this.options);
        const entity = await this.model.findOne(options.conditions ?? {}, select, { populate });

        if (!entity && !options.failSilently) {
            throw AppException.NotFound.setMessage(`${this.collectionName} not found`);
        }

        return entity;
    }

    async safeFindOne(conditions = {}, activeString = 'ACTIVE', failSilently = false, select?: string) {
        const entity = await this.findOne(conditions, failSilently, select);
        if ((entity as any).status !== activeString) {
            throw AppException.BadRequest.setMessage(`${this.collectionName} not in ${activeString} state`);
        }
        return entity;
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
            throw AppException.NotFound.setMessage(`${this.collectionName} not found`);
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
            throw AppException.BadRequest.setMessage(`${this.collectionName} not in ${activeString} state`);
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
        requiredConditions = {},
        defaultConditions = {},
        excludeExpand?: string[],
        populateWithModel?: PopulateOptions[],
    ): Promise<APIPagingData<T>> {
        let results;
        let count;

        const { select, conditions, limit, sort, populate, reverseList } = MongoAPIPaging.getPagingConstraints(
            query,
            requiredConditions,
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
            count = await this.model.find(withoutLastIdConditions).count().exec();
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
        const { select, conditions, limit, sort, populate } = MongoAPIPaging.getPagingConstraints(
            query,
            defaultConditions,
        );

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

    async updateById(id: Types.ObjectId, update: Partial<T> | any, options?: SaveOptions & ExecutionOptions) {
        if (options?.dryRun) {
            return;
        }
        return this.updateOne({ _id: id }, update as any, options);
    }

    async updateByObjectId(id: Types.ObjectId, update: Partial<T> | any, options?: QueryOptions) {
        return await this.updateOne({ _id: id }, update as any, options);
    }

    async updateOne(criteria: Record<string, unknown>, update: Partial<T>, options?: QueryOptions) {
        try {
            return await this.model.updateOne(criteria as any, update as any, options);
        } catch (err) {
            if (err && err.code === MONGO_UNIQUE_CONSTRAINT_CODE) {
                throw AppException.Conflict.setMessage('Unique constraint');
            }
            throw err;
        }
    }

    async updateMany(criteria: Record<string, unknown>, update: Partial<T>) {
        return await this.model.updateMany(criteria as any, update as any);
    }

    async findOneAndUpdateById(id: Types.ObjectId, update: Partial<T> | any, options?: ExecutionOptions) {
        return this.findOneAndUpdate({ _id: id }, update as any, options);
    }

    async findOneAndUpdate(
        criteria: Record<string, unknown>,
        update: Partial<T> | any,
        options?: ExecutionOptions & QueryOptions,
    ) {
        try {
            if (options?.dryRun) {
                return this.model.findOne(criteria as any);
            }
            return await this.model.findOneAndUpdate(criteria as any, update as any, { new: true, ...options });
        } catch (err) {
            if (err && err.code === MONGO_UNIQUE_CONSTRAINT_CODE) {
                throw AppException.Conflict.setMessage('Unique constraint');
            }
            throw err;
        }
    }

    async deleteById(publicId: Types.ObjectId, options?: ExecutionOptions) {
        if (options?.dryRun) {
            return;
        }
        return this.model.deleteOne({ _id: publicId } as any).exec();
    }

    async deleteOne(criteria: Record<string, unknown>) {
        return this.model.deleteOne(criteria as any).exec();
    }

    bulkInsert(docs: T[], options?: InsertManyOptions): Promise<HydratedDocument<T>[]> {
        if (!docs || docs.length === 0) {
            return;
        }

        return this.model.insertMany(docs, options);
    }

    bulkUpdate(docs: HydratedDocument<T>[], updateObj: Partial<T>) {
        if (!docs || docs.length === 0) {
            return;
        }

        const docIds = docs.map((v) => v._id);

        return this.model.bulkWrite([
            {
                updateMany: {
                    filter: { _id: { $in: docIds } } as any,
                    update: { $set: updateObj as any },
                },
            },
        ]);
    }

    aggregate(pipeline?: any[], options?: Record<string, unknown>) {
        return this.model.aggregate(pipeline, options).exec();
    }
}

export const RepositoryFactory = <T>(
    model: Model<HydratedDocument<T>>,
    options?: MongoAPIPagingOptions,
): Repository<T> => {
    class Foo extends Repository<T> {
        constructor() {
            super(model, options);
        }
    }

    return new Foo();
};

export function IsRepoConflictError(err: any, keyPattern?: string): boolean {
    if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
        if (!keyPattern) {
            return true;
        }
        const errData = err.getData();
        if (errData?.['keyPattern'] && errData['keyPattern'][keyPattern]) {
            return true;
        }
    }

    return false;
}
