import { InjectionToken } from "../types/injection-token.type.ts";

export class TokenRegistrationCycleError extends Error {
  constructor(path: Array<InjectionToken>) {
    super(`Token registration cycle detected! "${[...path].join(" -> ")}"`);
  }
}
