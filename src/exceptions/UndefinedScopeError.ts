import { isConstructorType } from "../types/constructor.type.ts";
import { InjectionToken } from "../types/injection-token.type.ts";

export class UndefinedScopeError extends Error {
  constructor(token: InjectionToken) {
    super(
      `Undefined Scope when resolving: "${
        isConstructorType(token) ? token.name : token.toString()
      }"`,
    );
  }
}
