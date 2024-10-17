import { beforeEach, describe, test } from "jsr:@std/testing/bdd";
import { container } from "../../src/container.ts";
import {
  STATIC_INJECTION_LIFETIME,
  STATIC_INJECTIONS,
} from "../../src/constants.ts";
import { Lifetime } from "../../src/types/registration.interface.ts";
import { StaticInjectable } from "../../src/types/static-inject.interface.ts";
import * as assert from "jsr:@std/assert";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.reset());
  describe("sync", () => {
    describe("Static Injector", () => {
      test("should register and resolve with static injector", () => {
        class TestClass {
          public propertyA = "test";
        }
        class TestClass2 {
          constructor(public test: TestClass) {}
          public static [STATIC_INJECTIONS] = ["test"];
        }
        container.register(
          "test",
          { useClass: TestClass },
          { lifetime: Lifetime.Singleton },
        );
        const test2 = container.resolve(TestClass2);
        const test = container.resolve<TestClass>("test");
        assert.assertInstanceOf(test2, TestClass2);
        assert.assertInstanceOf(test2.test, TestClass);
        assert.assertStrictEquals(test2.test.propertyA, "test");
        assert.assertStrictEquals(test2.test, test);
        test.propertyA = "test2";
        const test3 = container.resolve<TestClass>("test");
        assert.assertInstanceOf(test3, TestClass);
        assert.assertStrictEquals(test3.propertyA, "test2");
        assert.assertStrictEquals(test2.test, test3);
      });
      test("should register singleton from STATIC_INJECTION_LIFETIME", () => {
        class TestClass {
          public propertyA = "test";
          public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
        }
        class TestClass2 {
          constructor(public test: TestClass) {}
          public static [STATIC_INJECTIONS] = ["test"];
        }
        container.register("test", { useClass: TestClass });
        const test2 = container.resolve(TestClass2);
        const test = container.resolve<TestClass>("test");
        assert.assertInstanceOf(test2, TestClass2);
        assert.assertInstanceOf(test2.test, TestClass);
        assert.assertStrictEquals(test2.test.propertyA, "test");
        assert.assertStrictEquals(test2.test, test);
        test.propertyA = "test2";
        const test3 = container.resolve<TestClass>("test");
        assert.assertInstanceOf(test3, TestClass);
        assert.assertStrictEquals(test3.propertyA, "test2");
        assert.assertStrictEquals(test2.test, test3);
      });
      test("should register singleton from impements StaticInjectable", () => {
        class TestClass implements StaticInjectable<typeof TestClass> {
          public propertyA = "test";
          public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
        }
        class TestClass2 implements StaticInjectable<typeof TestClass2> {
          constructor(public test: TestClass) {}
          public static [STATIC_INJECTIONS] = ["test"];
        }
        container.register("test", { useClass: TestClass });
        const test2 = container.resolve(TestClass2);
        const test = container.resolve<TestClass>("test");
        assert.assertInstanceOf(test2, TestClass2);
        assert.assertInstanceOf(test2.test, TestClass);
        assert.assertStrictEquals(test2.test.propertyA, "test");
        assert.assertStrictEquals(test2.test, test);
        test.propertyA = "test2";
        const test3 = container.resolve<TestClass>("test");
        assert.assertInstanceOf(test3, TestClass);
        assert.assertStrictEquals(test3.propertyA, "test2");
        assert.assertStrictEquals(test2.test, test3);
      });
    });
  });
});
