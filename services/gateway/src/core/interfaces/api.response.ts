export interface APIResponse<T = any> {
    code: string;
    message: string;
    data: T;
}
