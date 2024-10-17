import { beforeEach, describe, test } from "jsr:@std/testing/bdd";
import { assertSpyCalls, returnsNext, spy } from "jsr:@std/testing/mock";
import { container } from "../../src/container.ts";
import { UndefinedScopeError } from "../../src/exceptions/UndefinedScopeError.ts";
import { Lifetime } from "../../src/types/registration.interface.ts";
import { STATIC_INJECTION_LIFETIME } from "../../src/constants.ts";
import * as assert from "jsr:@std/assert";

describe("Dymexjs_DI ", () => {
  beforeEach(async () => await container.reset());
  describe("async", () => {
    describe("Provider", () => {
      describe("ValueProvider", () => {
        test("should allow array to be registered", async () => {
          class Test {}
          const value = [new Test()];
          container.register("array", { useValue: value });
          const result = await container.resolveAsync<Test[]>("array");
          assert.assertInstanceOf(result, Array);
          assert.assertStrictEquals(result.length, 1);
          assert.assertInstanceOf(result[0], Test);
          assert.assertStrictEquals(result, value);
        });
        test("should register and resolve value async", async () => {
          const testValue = "test";
          container.register("test", { useValue: testValue });
          const value = await container.resolveAsync("test");
          assert.assertStrictEquals(value, testValue);
        });
      });
      describe("Factory provider", () => {
        test("should allow to register an array", async () => {
          class Test {}
          container.register(Test, { useClass: Test });
          container.register("array", {
            useFactory: async (cont): Promise<Array<Test>> =>
              Promise.resolve([await cont.resolve(Test)]),
          });
          const result = await container.resolveAsync<Array<Test>>("array");
          assert.assertInstanceOf(result, Array);
          assert.assertStrictEquals(result.length, 1);
          assert.assertInstanceOf(result[0], Test);
        });
        test("should register and resolve a factory", async () => {
          class TestClass {
            public propertyFactory;
            constructor() {
              this.propertyFactory = "test";
            }
          }
          container.register("test", { useFactory: () => new TestClass() });
          const value = await container.resolveAsync<TestClass>("test");
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyFactory, "test");
        });
        test("should handle async factory providers", async () => {
          const asyncFactory = () => {
            return new Promise((resolve) => {
              setTimeout(() => resolve({ key: "asyncValue" }), 100);
            });
          };
          container.register("asyncToken", { useFactory: asyncFactory });
          const resolved = await container.resolveAsync("asyncToken");
          assert.equal(resolved, { key: "asyncValue" });
        });
        test("register and resolve a factory value", async () => {
          container.register("test", { useFactory: (cont) => cont });
          const value = await container.resolveAsync("test");
          assert.assertStrictEquals(value, container);
        });

        test("executes a registered factory each time resolve is called", async () => {
          const factoryMock = spy(function () {});
          container.register("Test", { useFactory: factoryMock });

          await container.resolveAsync("Test");
          await container.resolveAsync("Test");

          assertSpyCalls(factoryMock, 2);
        });

        test("resolves to factory result each time resolve is called", async () => {
          const value1 = 1;
          const value2 = 2;
          const factoryMock = returnsNext([value1, value2]);

          container.register("Test", { useFactory: factoryMock });

          const result1 = await container.resolveAsync("Test");
          const result2 = await container.resolveAsync("Test");

          assert.assertStrictEquals(result1, value1);
          assert.assertStrictEquals(result2, value2);
        });
      });
      describe("Class Provider", () => {
        test("should register and resolve class with string token", async () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register("test", { useClass: TestClass });
          const value = await container.resolveAsync<TestClass>("test");
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
        });
        test("should register and resolve class with class token", async () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, { useClass: TestClass });
          const value = await container.resolveAsync(TestClass);
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
        });
        test("should register and resolve class with class token and provider", async () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, TestClass);
          const value = await container.resolveAsync(TestClass);
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
        });
        test("should register and resolve singleton", async () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Singleton,
          });
          const value = await container.resolveAsync(TestClass);
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
          value.propertyA = "test2";
          const value2 = await container.resolveAsync(TestClass);
          assert.assertInstanceOf(value2, TestClass);
          assert.assertStrictEquals(value2.propertyA, "test2");
        });
        test("should register and resolve transient", async () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Transient,
          });
          const value = await container.resolveAsync(TestClass);
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
          value.propertyA = "test2";
          const value2 = await container.resolveAsync(TestClass);
          assert.assertInstanceOf(value2, TestClass);
          assert.assertStrictEquals(value2.propertyA, "test");
        });

        test("should throw an error when trying to instanciate a scoped object without a scope", () => {
          class TestClass {}
          container.register(
            "test",
            { useClass: TestClass },
            { lifetime: Lifetime.Scoped },
          );
          assert.assertRejects(
            () => container.resolveAsync<TestClass>("test"),
            UndefinedScopeError,
          );
        });
      });
      describe("Token Provider", () => {
        test("should register type TokenProvider", async () => {
          container.register("test", { useValue: "test" });
          container.registerType("test2", "test");
          assert.assertStrictEquals(
            await container.resolveAsync("test2"),
            "test",
          );
        });
      });
      describe("Constructor Provider", () => {
        test("constructor token provider", async () => {
          class TestClass {
            propertyA = "test";
            public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
          }
          const value = await container.resolveAsync(TestClass);
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
          value.propertyA = "test2";
        });
        test("should return a transient when constructor not registered", async () => {
          class Test {}
          const test1 = await container.resolveAsync(Test);
          const test2 = await container.resolveAsync(Test);
          assert.assertInstanceOf(test1, Test);
          assert.assertInstanceOf(test2, Test);
          assert.equal(test1, test2);
          assert.assertNotStrictEquals(test1, test2);
        });
      });
    });
  });
});
