import { IContainer } from "../container.interface.ts";
import { Provider } from "./provider.type.ts";

export type FactoryFunction<T> = (container: IContainer) => T | Promise<T>;

export interface FactoryProvider<T> {
  useFactory: FactoryFunction<T>;
}

export function isFactoryProvider<T>(
  provider: Provider<T>,
): provider is FactoryProvider<T> {
  try {
    return "useFactory" in provider;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return false;
  }
}
