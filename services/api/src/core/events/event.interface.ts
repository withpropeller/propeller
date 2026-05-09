export interface IEvent<T> {
    tenantId: string;
    consumer?: string;
    name: string;
    data: T;
}
