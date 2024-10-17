import { InjectionToken } from "../injection-token.type.ts";
import { Provider } from "./provider.type.ts";

export interface TokenProvider<T> {
  useToken: InjectionToken<T>;
}

export function isTokenProvider<T>(
  provider: Provider<T>,
): provider is TokenProvider<T> {
  try {
    return "useToken" in provider;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return false;
  }
}
