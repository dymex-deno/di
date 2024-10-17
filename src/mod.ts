/**
 * A dependency injection library for Typescript to help build
 * well-structured code and easily testable applications.
 * @module
 *
 * @example
 * import { container } from "jsr:@dymex-deno/di";
 *
 * class TestService {
 *   printMessage() {
 *     return "I'm printting this message inside of TestService instance.";
 *   }
 * }
 *
 * @Singleton([TestService])
 * class Test {
 *   constructor(public testService: TestService) {}
 * }
 *
 * const testInstance = container.resolve(Test);
 * console.log(testInstance.testService.printMessage());
 * // logs "I'm printting this message inside of TestService instance."
 */

export type { StaticInjectable } from "./types/static-inject.interface.ts";
export type { IContainer } from "./types/container.interface.ts";
export { Container, container } from "./container.ts";
export * from "./decorators.ts";
export * from "./constants.ts";
export * from "./types/registration.interface.ts";
export { Token } from "./types/injection-token.type.ts";
