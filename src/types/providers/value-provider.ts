import { Provider } from "./provider.type.ts";

export interface ValueProvider<T> {
  useValue: T;
}

export function isValueProvider<T>(
  provider: Provider<T>,
): provider is ValueProvider<T> {
  try {
    return "useValue" in provider;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return false;
  }
}
