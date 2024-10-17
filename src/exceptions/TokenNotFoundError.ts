import { InjectionToken } from "../types/injection-token.type.ts";

export class TokenNotFoundError extends Error {
  constructor(token: InjectionToken) {
    super(`Token not found: "${token.toString()}"`);
  }
}
