import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import {
    Model,
    InsertManyOptions,
    SaveOptions,
    QueryOptions,
    Types,
    HydratedDocument,
    PopulateOptions,
} from 'mongoose';
import { MONGO_UNIQUE_CONSTRAINT_CODE, Utils } from '@core/helpers';
import {
    APIPagingData,
    APIPagingDto,
    MongoAPIPaging,
    MongoAPIPagingOptions,
    MongoAPIQueryOptions,
} from '@common/api-paging';

export abstract class Repository<T> {
    readonly collectionName: string;

    protected constructor(
        protected readonly model: Model<HydratedDocument<T>>,
        protected readonly options: MongoAPIPagingOptions = {},
    ) {
        this.collectionName = Utils.toSentenceCase(this.model.collection.collectionName);
    }

    async createAndSave(details: Partial<T>, options?: SaveOptions): Promise<HydratedDocument<T>> {
        try {
            const entity = this.createPartial(details);

            return await this.save(entity, options);
        } catch (err: any) {
            if (err && err.code === MONGO_UNIQUE_CONSTRAINT_CODE) {
                throw new ConflictException('Unique constraint');
            }
            throw err;
        }
    }

    createPartial(details: Partial<T>): HydratedDocument<T> {
        return new this.model(details);
    }

    async count(conditions = {}): Promise<number> {
        return await this.model.countDocuments(conditions);
    }

    async findById(id: Types.ObjectId, failSilently = false): Promise<HydratedDocument<T>> {
        const entity = await this.model.findById(id).exec();
        if (!entity && !failSilently) {
            throw new NotFoundException(`${this.collectionName} not found`);
        }
        return entity;
    }

    async safeFindById(id: Types.ObjectId, activeString = 'ACTIVE') {
        const entity = await this.findById(id);
        if ((entity as any).status !== activeString) {
            throw new BadRequestException(`${this.collectionName} not in ${activeString} state`);
        }
        return entity;
    }

    async findOne(conditions = {}, failSilently = false, select?: string): Promise<HydratedDocument<T>> {
        const entity = await this.model.findOne(conditions, select).exec();
        if (!entity && !failSilently) {
            throw new NotFoundException(`${this.collectionName} not found`);
        }
        return entity;
    }

    async findOneWithOptions(options: MongoAPIQueryOptions): Promise<HydratedDocument<T>> {
        const expand = MongoAPIPaging.addRefPaths(options.expand as any, this.options);
        const populate = MongoAPIPaging.getExpandConstraints(expand, options.excludeExpand, options.populate);

        const entity = await this.model.findOne(options.conditions ?? {}, options.select, { populate });

        if (!entity && !options.failSilently) {
            throw new NotFoundException(`${this.collectionName} not found`);
        }

        return entity;
    }

    async safeFindOne(conditions = {}, activeString = 'ACTIVE', failSilently = false, select?: string) {
        const entity = await this.findOne(conditions, failSilently, select);
        if ((entity as any).status !== activeString) {
            throw new BadRequestException(`${this.collectionName} not in ${activeString} state`);
        }
        return entity;
    }

    async find(conditions = {}): Promise<HydratedDocument<T>[]> {
        return await this.model.find(conditions);
    }

    async findAndPopulate(conditions = {}, populateStr: string): Promise<HydratedDocument<T>[]> {
        let populate = MongoAPIPaging.addRefPaths(populateStr as any, this.options);
        populate = MongoAPIPaging.getExpandConstraints(populate);
        return await this.model.find(conditions, null, { populate });
    }

    async findOneAndPopulate(
        conditions = {},
        populateStr: string | string[] | PopulateOptions | PopulateOptions[],
        failSilently = false,
        select?: string,
    ): Promise<HydratedDocument<T>> {
        let populate = MongoAPIPaging.addRefPaths(populateStr as any, this.options);
        populate = MongoAPIPaging.getExpandConstraints(populate);

        const entity = await this.model.findOne(conditions, select, { populate });

        if (!entity && !failSilently) {
            throw new NotFoundException(`${this.collectionName} not found`);
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
            throw new BadRequestException(`${this.collectionName} not in ${activeString} state`);
        }
        return entity;
    }

    async save(entity: HydratedDocument<T>, options?: SaveOptions): Promise<HydratedDocument<T>> {
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

    async updateById(id: string | Types.ObjectId, update: Partial<T> | any, options?: QueryOptions) {
        return await this.updateOne({ _id: id }, update as any, options);
    }

    async updateByObjectId(id: Types.ObjectId, update: Partial<T> | any, options?: QueryOptions) {
        return await this.updateOne({ _id: id }, update as any, options);
    }

    async updateOne(criteria: Record<string, unknown>, update: Partial<T>, options?: QueryOptions) {
        return await this.model.updateOne(criteria as any, update as any, options);
    }

    async updateMany(criteria: Record<string, unknown>, update: Partial<T>) {
        return await this.model.updateMany(criteria as any, update as any);
    }

    async findOneAndUpdate(criteria: Record<string, unknown>, update: Partial<T> | any) {
        return await this.model.findOneAndUpdate(criteria as any, update as any, {
            new: true,
        });
    }

    async deleteById(publicId: string) {
        return this.model.deleteOne({ _id: publicId } as any).exec();
    }

    async deleteOne(criteria: Record<string, unknown>) {
        return this.model.deleteOne(criteria as any).exec();
    }

    bulkInsert(docs: T[], options?: InsertManyOptions): Promise<HydratedDocument<T>[]> {
        if (!docs || docs.length === 0) {
            return;
        }

        return this.model.insertMany(docs, options) as unknown as Promise<HydratedDocument<T>[]>;
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
