import { isConstructorType } from "../types/constructor.type.ts";

export class InvalidDecoratorError extends Error {
  constructor(
    decorator: string,
    // deno-lint-ignore no-explicit-any
    target: any,
    message: string = "can only be used in a class",
  ) {
    super(
      `Decorator '${decorator}' found on '"${
        isConstructorType(target) ? target.name : target.toString()
      }"' ${message}.`,
    );
  }
}
