// deno-lint-ignore no-explicit-any
export type ConstructorType<T> = new (...args: Array<any>) => T;

export function isConstructorType(
  token?: unknown,
  // deno-lint-ignore no-explicit-any
): token is ConstructorType<any> {
  return typeof token === "function";
}
