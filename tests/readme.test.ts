import { beforeEach, describe, test } from "jsr:@std/testing/bdd";
import { container } from "../src/container.ts";
import { Scoped, Singleton } from "../src/decorators.ts";
import { StaticInjectable } from "../src/types/static-inject.interface.ts";
import { STATIC_INJECTION_LIFETIME, STATIC_INJECTIONS } from "../src/constants.ts";
import { Lifetime } from "../src/types/registration.interface.ts";
import { UndefinedScopeError } from "../src/exceptions/UndefinedScopeError.ts";
import { Token } from "../src/types/injection-token.type.ts";
import * as assert from "jsr:@std/assert";

describe("Dymexjs_DI ", () => {
  beforeEach(async () => await container.reset());
  describe("README", () => {
    describe("Basic Usage", () => {
      test("Decorators", () => {
        class TestService {
          printMessage() {
            return "I'm printting this message inside of TestService instance.";
          }
        }

        @Singleton([TestService])
        class Test {
          constructor(public testService: TestService) {}
        }

        const testInstance = container.resolve(Test);
        assert.assertStrictEquals(
          testInstance.testService.printMessage(),
          "I'm printting this message inside of TestService instance.",
        );
      });
      describe("Static inject", () => {
        test("Example 1", () => {
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
          assert.assertStrictEquals(test2.test.propertyA, "test");
        });
        test("Example 2", () => {
          class TestClass implements StaticInjectable<typeof TestClass> {
            public propertyA = "test";
            public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
          }
          class TestClass2 implements StaticInjectable<typeof TestClass2> {
            constructor(public test: TestClass) {}
            public static [STATIC_INJECTIONS] = [TestClass];
          }
          const test2 = container.resolve(TestClass2);
          assert.assertStrictEquals(test2.test.propertyA, "test");
        });
      });
    });
    describe("Decorators", () => {
      test("empty singleton", () => {
        @Singleton()
        class TestClass {}
        const instance1 = container.resolve(TestClass);
        assert.assertInstanceOf(instance1,TestClass);
      });
      test("with registration token", () => {
        @Singleton("serviceA") //With token to register
        class ServiceA {}
        @Singleton(["serviceA"]) //With an array of dependencies to resolve when creating the instance
        class ServiceB {
          constructor(public serviceA: ServiceA) {}
        }
        const b = container.resolve<ServiceB>(ServiceB);
        assert.assertInstanceOf(b, ServiceB);
        assert.assertInstanceOf(b.serviceA,ServiceA);
      });
      test("empty token with dependencies", () => {
        @Singleton()
        class ServiceA {}
        @Singleton([ServiceA]) //With an array of dependencies to resolve when creating the instance
        class ServiceB {
          constructor(public serviceA: ServiceA) {}
        }
        const b = container.resolve<ServiceB>(ServiceB);
        assert.assertInstanceOf(b,ServiceB);
        assert.assertInstanceOf(b.serviceA,ServiceA);
      });
      test("empty scoped without scope", () => {
        @Scoped()
        class TestClass {}
        assert.assertThrows(() => container.resolve(TestClass), UndefinedScopeError);
      });
      test("empty scoped with scope", () => {
        @Scoped()
        class TestClass {}
        const scope = container.createScope();
        const instance1 = container.resolve(TestClass, scope);
        assert.assertInstanceOf(instance1,TestClass);
      });
    });
    describe("API", () => {
      describe("Container", () => {
        test("test token", () => {
          const JWT_SECRET = new Token("jwt_secret");
          container.registerValue(JWT_SECRET, "my secure secret");
          const secret = container.resolve(JWT_SECRET);
          assert.assertStrictEquals(secret, "my secure secret");
        });
      });
    });
  });
});
