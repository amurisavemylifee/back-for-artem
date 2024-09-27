import { Request, Response } from "express";

export type IRequest<T extends Record<string, unknown>> = Request<
  unknown,
  unknown,
  T
>;
export type IResponse<
  T extends Record<string, unknown>,
  E = unknown
> = Response<
  | { isSuccess: boolean } & (
      | { result: T }
      | {
          message: string;
          errorCode?: E;
        }
    )
>;
