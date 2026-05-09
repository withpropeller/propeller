export interface WorkerResponse<T = any> {
    code: string;
    message: string;
    error: string;
    errors: string;
    data: T;
}
