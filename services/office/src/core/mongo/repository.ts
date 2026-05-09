import mongoose, {
    Model,
    InsertManyOptions,
    SaveOptions,
    QueryOptions,
    Types,
    HydratedDocument,
    PopulateOptions,
} from 'mongoose';
import { Utils } from '@core/helpers';
import {
    APIPagingData,
    APIPagingDto,
    MongoAPIPaging,
    MongoAPIPagingOptions,
    MongoAPIQueryOptions,
} from '@common/api-paging';
import { ExecutionOptions } from '@common/interfaces';
import { MongoException } from './mongo.exception';
import { ATLAS_ERROR_CODE, MONGO_UNIQUE_CONSTRAINT_CODE } from './mongo.utils';

export abstract class Repository<T> {
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

    async createAndSave(details: Partial<T>, options?: SaveOptions & ExecutionOptions): Promise<HydratedDocument<T>> {
        try {
            const entity = this.createPartial(details);
            return await this.save(entity, options);
        } catch (err: any) {
            if (err && err.code === MONGO_UNIQUE_CONSTRAINT_CODE) {
                throw MongoException.Conflict.setMessage('Unique constraint');
            }
            if (err && err.code === ATLAS_ERROR_CODE) {
                throw MongoException.AtlasError;
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
        const entity = await this.model.findOne(options.conditions ?? {}, select, { populate });

        if (!entity && !options.failSilently) {
            throw MongoException.NotFound.setMessage(`${this.modelName} not found`);
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

    async findById(id: Types.ObjectId, options: MongoAPIQueryOptions = {}): Promise<HydratedDocument<T>> {
        const populate = MongoAPIPaging.getExpandConstraints(
            options.expand as any,
            options.excludeExpand,
            options.populate,
        );
        const select = MongoAPIPaging.parseSelect(options.select, this.options);
        const entity = await this.model.findById(id, select, { populate, session: options.session });

        if (!entity && !options.failSilently) {
            throw MongoException.NotFound.setMessage(`${this.modelName} not found`);
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
        return this.model.find(options.conditions ?? {}, select, { populate, sort, limit: options.limit });
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
            throw MongoException.NotFound.setMessage(`${this.modelName} not found`);
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
            .limit(limit + 1) // +1 to check if there are more results
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

    async updateById(
        id: string | mongoose.Types.ObjectId,
        update: Partial<T> | any,
        options?: SaveOptions & ExecutionOptions,
    ) {
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
            return await this.model.updateOne(criteria as any, update as any, options as any);
        } catch (err: any) {
            if (err && err.code === MONGO_UNIQUE_CONSTRAINT_CODE) {
                throw MongoException.Conflict.setMessage('Unique constraint');
            }
            throw err;
        }
    }

    async updateMany(criteria: Record<string, unknown>, update: Partial<T>) {
        return await this.model.updateMany(criteria as any, update as any);
    }

    async findOneAndUpdate(criteria: Record<string, unknown>, update: Partial<T> | any, options?: ExecutionOptions) {
        try {
            if (options?.dryRun) {
                return this.model.findOne(criteria as any);
            }
            return await this.model.findOneAndUpdate(criteria as any, update as any, { new: true });
        } catch (err: any) {
            if (err && err.code === MONGO_UNIQUE_CONSTRAINT_CODE) {
                throw MongoException.Conflict.setMessage('Unique constraint');
            }
            throw err;
        }
    }

    async findByIdAndUpdate(id: Types.ObjectId, update: Partial<T> | any, options?: ExecutionOptions) {
        return await this.findOneAndUpdate({ _id: id }, update as any, options);
    }

    async deleteById(id: string | mongoose.Types.ObjectId, options?: ExecutionOptions) {
        if (options?.dryRun) {
            return;
        }
        return this.model.deleteOne({ _id: id } as any).exec();
    }

    async deleteOne(criteria: Record<string, unknown>) {
        return this.model.deleteOne(criteria as any).exec();
    }

    bulkInsert(docs: T[], options?: InsertManyOptions) {
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
