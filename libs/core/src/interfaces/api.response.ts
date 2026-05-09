export interface APIResponse<T = unknown> {
  code: string;
  message: string;
  data: T;
}
