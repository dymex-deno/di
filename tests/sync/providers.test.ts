import { beforeEach, describe, test } from "jsr:@std/testing/bdd";
import { assertSpyCalls, returnsNext, spy } from "jsr:@std/testing/mock";
import { container } from "../../src/container.ts";
import { Lifetime } from "../../src/types/registration.interface.ts";
import { UndefinedScopeError } from "../../src/exceptions/UndefinedScopeError.ts";
import { STATIC_INJECTION_LIFETIME } from "../../src/constants.ts";
import * as assert from "jsr:@std/assert";

describe("Dymexjs_DI ", () => {
  beforeEach(async () => await container.reset());
  describe("sync", () => {
    describe("Provider", () => {
      describe("ValueProvider", () => {
        test("should allow array to be registered", () => {
          class Test {}
          const value = [new Test()];
          container.register("array", { useValue: value });
          const result = container.resolve<Test[]>("array");
          assert.assertInstanceOf(result, Array);
          assert.assertStrictEquals(result.length, 1);
          assert.assertInstanceOf(result[0], Test);
          assert.assertStrictEquals(result, value);
        });
        test("should register and resolve value", () => {
          const testValue = "test";
          container.register("test", { useValue: testValue });
          const value = container.resolve("test");
          assert.assertStrictEquals(value, testValue);
        });
      });
      describe("Factory provider", () => {
        test("should allow to register an array", () => {
          class Test {}
          container.register<Test>(Test, { useClass: Test });
          container.register<Array<Test>>("array", {
            useFactory: (cont): Array<Test> => [cont.resolve(Test)],
          });
          const result = container.resolve<Array<Test>>("array");
          assert.assertInstanceOf(result, Array);
          assert.assertStrictEquals(result.length, 1);
          assert.assertInstanceOf(result[0], Test);
        });
        test("should register and resolve a factory", () => {
          class TestClass {
            public propertyFactory;
            constructor() {
              this.propertyFactory = "test";
            }
          }
          container.register("test", { useFactory: () => new TestClass() });
          const value = container.resolve<TestClass>("test");
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyFactory, "test");
        });
        test("register and resolve a factory value", () => {
          container.register("test", { useFactory: (cont) => cont });
          const value = container.resolve("test");
          assert.assertStrictEquals(value, container);
        });
        test("executes a registered factory each time resolve is called", () => {
          const factoryMock = spy(function () {});
          container.register("Test", { useFactory: factoryMock });

          container.resolve("Test");
          container.resolve("Test");

          assertSpyCalls(factoryMock, 2);
        });

        test("resolves to factory result each time resolve is called", () => {
          const value1 = 1;
          const value2 = 2;
          const factoryMock = returnsNext([value1, value2]);
          container.register("Test", { useFactory: factoryMock });

          const result1 = container.resolve("Test");
          const result2 = container.resolve("Test");

          assert.assertStrictEquals(result1, value1);
          assert.assertStrictEquals(result2, value2);
        });
      });
      describe("Class Provider", () => {
        test("should register and resolve class with string token", () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register("test", { useClass: TestClass });
          const value = container.resolve<TestClass>("test");
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
        });
        test("should register and resolve class with class token", () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, { useClass: TestClass });
          const value = container.resolve(TestClass);
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
        });
        test("should register and resolve class with class token and provider", () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, TestClass);
          const value = container.resolve(TestClass);
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
        });
        test("should register and resolve singleton", () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Singleton,
          });
          const value = container.resolve(TestClass);
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
          value.propertyA = "test2";
          const value2 = container.resolve<TestClass>(TestClass);
          assert.assertInstanceOf(value2, TestClass);
          assert.assertStrictEquals(value2.propertyA, "test2");
        });
        test("should register and resolve transient", () => {
          class TestClass {
            public propertyA = "test";
          }
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Transient,
          });
          const value = container.resolve(TestClass);
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
          value.propertyA = "test2";
          const value2 = container.resolve<TestClass>(TestClass);
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
          assert.assertThrows(
            () => container.resolve<TestClass>("test"),
            UndefinedScopeError,
          );
        });
      });
      describe("Token Provider", () => {
        test("should register type TokenProvider", () => {
          container.register("test", { useValue: "test" });
          container.registerType("test2", "test");
          assert.assertStrictEquals(container.resolve("test2"), "test");
        });
      });
      describe("Constructor Provider", () => {
        test("constructor token provider", () => {
          class TestClass {
            propertyA = "test";
            public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
          }
          const value = container.resolve(TestClass);
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
          value.propertyA = "test2";
        });
        test("should return a transient when constructor not registered", () => {
          class Test {}
          const test1 = container.resolve(Test);
          const test2 = container.resolve(Test);
          assert.assertInstanceOf(test1, Test);
          assert.assertInstanceOf(test2, Test);
          assert.equal(test1, test2);
          assert.assertNotStrictEquals(test1, test2);
        });
      });
    });
  });
});
