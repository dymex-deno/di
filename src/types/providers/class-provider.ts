import { ConstructorType } from "../constructor.type.ts";
import { Provider } from "./provider.type.ts";

export interface ClassProvider<T> {
  useClass: ConstructorType<T>;
}

export function isClassProvider<T>(
  provider: Provider<T>,
): provider is ClassProvider<T> {
  try {
    return "useClass" in provider;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return false;
  }
}
