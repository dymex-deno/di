import { InjectionToken } from "./injection-token.type.ts";

// deno-lint-ignore no-explicit-any
export type InterfaceId<T = any> = string & { __type: T };

export type UnwrapDecoratorArgs<T extends Array<InterfaceId | InjectionToken>> =
  {
    [K in keyof T]: T[K] extends string
      // deno-lint-ignore no-explicit-any
      ? any
      : T[K] extends symbol
      // deno-lint-ignore no-explicit-any
        ? any
      : T[K] extends InterfaceId<infer U> ? U
      : T[K] extends InjectionToken<infer U> ? U
      : never;
  };
