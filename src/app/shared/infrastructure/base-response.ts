export interface BaseResource {
  readonly id: number;
}

export interface BaseResponse<T = unknown> {
  readonly data?: T;
  readonly status?: string;
  readonly message?: string;
}
