import { Provider, ProvidersType } from "./providers/provider.type.ts";
import { InjectionToken } from "./injection-token.type.ts";

// deno-lint-ignore no-explicit-any
export interface Registration<T = any> {
  providerType: ProvidersType;
  provider: Provider<T>;
  instance?: T;
  options: RegistrationOptions;
  injections: Array<InjectionToken>;
}

export enum Lifetime {
  Singleton,
  Transient,
  Scoped,
}

export type RegistrationOptions = {
  lifetime: Lifetime;
};
