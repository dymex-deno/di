import { describe, test } from "jsr:@std/testing/bdd";
import {
  getProviderType,
  isProvider,
  Provider,
  ProvidersType,
} from "../src/types/providers/provider.type.ts";
import { isValueProvider } from "../src/types/providers/value-provider.ts";
import { isClassProvider } from "../src/types/providers/class-provider.ts";
import { isFactoryProvider } from "../src/types/providers/factory-provider.ts";
import { isConstructorType } from "../src/types/constructor.type.ts";
import { isTokenProvider } from "../src/types/providers/token-provider.ts";
import { container } from "../src/container.ts";
import { TokenRegistrationCycleError } from "../src/exceptions/TokenRegistrationCycleError.ts";
import * as assert from "jsr:@std/assert";

describe("Provider", () => {
  describe("Invalid provider", () => {
    test("isProvider", () => {
      assert.assertStrictEquals(isProvider("test"), false);
    });
    test("getProviderType", () => {
      assert.assertThrows(
        // deno-lint-ignore no-explicit-any
        () => getProviderType("test" as any),
        Error,
        "Invalid provider type: test",
      );
    });
  });
  describe("ValueProvider", () => {
    test("isProvider", () => {
      assert.assert(isProvider({ useValue: "test" }));
    });
    test("getProviderType", () => {
      assert.assertStrictEquals(
        getProviderType({ useValue: "test" }),
        ProvidersType.ValueProvider,
      );
    });
    test("isValueProvider true", () => {
      assert.assert(isValueProvider({ useValue: "test" }));
    });
    test("isValueProvider false", () => {
      assert.assertStrictEquals(
        isValueProvider({} as Provider<unknown>),
        false,
      );
    });
  });
  describe("ClassProvider", () => {
    class TestClass {}
    test("isProvider", () => {
      assert.assert(isProvider({ useClass: TestClass }));
    });
    test("getProviderType", () => {
      assert.assertStrictEquals(
        getProviderType({ useClass: TestClass }),
        ProvidersType.ClassProvider,
      );
    });
    test("isClassProvider true", () => {
      assert.assert(isClassProvider({ useClass: TestClass }));
    });
    test("isClassProvider false", () => {
      assert.assertStrictEquals(
        isClassProvider({} as Provider<unknown>),
        false,
      );
    });
  });
  describe("Factory provider", () => {
    test("isProvider", () => {
      assert.assertStrictEquals(isProvider({ useFactory: () => {} }), true);
    });
    test("getProviderType", () => {
      assert.assertStrictEquals(
        getProviderType({ useFactory: () => {} }),
        ProvidersType.FactoryProvider,
      );
    });
    test("isFactoryProvider true", () => {
      assert.assertStrictEquals(
        isFactoryProvider({ useFactory: () => {} }),
        true,
      );
    });
    test("isFactoryProvider false", () => {
      assert.assertStrictEquals(
        isFactoryProvider({} as Provider<unknown>),
        false,
      );
    });
  });
  describe("constructor provider", () => {
    test("isConstructorToken", () => {
      // deno-lint-ignore no-explicit-any
      assert.assertStrictEquals(isConstructorType((() => true) as any), true);
    });
    test("getProviderType", () => {
      assert.assertStrictEquals(
        // deno-lint-ignore no-explicit-any
        getProviderType((() => true) as any),
        ProvidersType.ConstructorProvider,
      );
    });
  });
  describe("Token provider", () => {
    test("isProvider", () => {
      assert.assertStrictEquals(isProvider({ useToken: "test" }), true);
    });
    test("getProviderType", () => {
      assert.assertStrictEquals(
        getProviderType({ useToken: "test" }),
        ProvidersType.TokenProvider,
      );
    });
    test("isTokenProvider true", () => {
      assert.assertStrictEquals(isTokenProvider({ useToken: "test" }), true);
    });
    test("isTokenProvider false", () => {
      assert.assertStrictEquals(
        isTokenProvider({} as Provider<unknown>),
        false,
      );
    });
    test("should throw circular token registration", async () => {
      await container.reset();
      container.register("test", { useToken: "test2" });
      assert.assertThrows(
        () => container.register("test2", { useToken: "test" }),
        TokenRegistrationCycleError,
      );
    });
  });
});
