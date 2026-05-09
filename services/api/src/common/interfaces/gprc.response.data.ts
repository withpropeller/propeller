export interface GrpcResponseData<T = any> {
    code: string;
    error: string;
    data?: T;
}
