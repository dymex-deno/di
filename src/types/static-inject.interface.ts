import { STATIC_INJECTION_LIFETIME, STATIC_INJECTIONS } from "../constants.ts";
import { InjectionToken } from "./injection-token.type.ts";
import { Lifetime } from "./registration.interface.ts";

interface StaticInject {
  // deno-lint-ignore no-explicit-any
  new (...args: any[]): any;
  [STATIC_INJECTIONS]?: InjectionToken[];
  [STATIC_INJECTION_LIFETIME]?: Lifetime;
}

export type StaticInjectable<I extends StaticInject = StaticInject> =
  InstanceType<I>;
