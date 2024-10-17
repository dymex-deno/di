import { beforeEach, describe, test } from "jsr:@std/testing/bdd";
import { Container, container } from "../../src/container.ts";
import { TokenNotFoundError } from "../../src/exceptions/TokenNotFoundError.ts";
import { Lifetime } from "../../src/types/registration.interface.ts";
import { Singleton } from "../../src/decorators.ts";
import { TokenRegistrationCycleError } from "../../src/exceptions/TokenRegistrationCycleError.ts";
import * as assert from "jsr:@std/assert";

describe("Dymexjs_DI ", () => {
  beforeEach(async () => await container.reset());
  describe("sync", () => {
    describe("other", () => {
      describe("register and resolve", () => {
        test("should throw an error when token not registered", () => {
          assert.assertThrows(
            () => container.resolve("test"),
            TokenNotFoundError,
          );
        });
      });
      describe("direct resolve", () => {
        test("should resolve directly in constructor param", () => {
          @Singleton()
          class Test {}
          @Singleton()
          class Test2 {
            constructor(public readonly test: Test = container.resolve(Test)) {}
          }
          const test2 = container.resolve(Test2);
          const test = container.resolve(Test);
          assert.assertInstanceOf(test2, Test2);
          assert.assertInstanceOf(test, Test);
          assert.assertInstanceOf(test2.test, Test);
          assert.assertStrictEquals(test2.test, test);
        });
      });
      describe("resolveAll", () => {
        test("fails to resolveAll unregistered dependency by name sync", () => {
          assert.assertThrows(
            () => container.resolveAll("NotRegistered"),
            TokenNotFoundError,
          );
        });
        test("resolves an array of transient instances bound to a single interface", () => {
          interface FooInterface {
            bar: string;
          }

          class FooOne implements FooInterface {
            public bar = "foo1";
          }

          class FooTwo implements FooInterface {
            public bar = "foo2";
          }

          container.register<FooInterface>("FooInterface", {
            useClass: FooOne,
          });
          container.register<FooInterface>("FooInterface", {
            useClass: FooTwo,
          });

          const fooArray = container.resolveAll<FooInterface>("FooInterface");
          assert.assertInstanceOf(fooArray, Array);
          assert.assertInstanceOf(fooArray[0], FooOne);
          assert.assertInstanceOf(fooArray[1], FooTwo);
        });

        test("resolves all transient instances when not registered", () => {
          class Foo {}

          const foo1 = container.resolveAll(Foo);
          const foo2 = container.resolveAll(Foo);

          assert.assertInstanceOf(foo1, Array);
          assert.assertInstanceOf(foo2, Array);
          assert.assertInstanceOf(foo1[0], Foo);
          assert.assertInstanceOf(foo2[0], Foo);
          assert.assertNotStrictEquals(foo1[0], foo2[0]);
        });
      });
      describe("Child Container", () => {
        test("should create a child container", () => {
          const childContainer = container.createChildContainer();
          assert.assertInstanceOf(childContainer, Container);
        });
        test("should resolve in child container", () => {
          const childContainer = container.createChildContainer();
          childContainer.register("test", { useValue: "test" });
          assert.assertStrictEquals(childContainer.resolve("test"), "test");
          assert.assertThrows(
            () => container.resolve("test"),
            TokenNotFoundError,
          );
        });
        test("should resolve in parent container", () => {
          const childContainer = container.createChildContainer();
          container.register("test", { useValue: "test" });
          assert.assertStrictEquals(container.resolve("test"), "test");
          assert.assertStrictEquals(childContainer.resolve("test"), "test");
        });
        test("should resolve scoped", () => {
          class Test {
            propertyA = "test";
          }
          container.register("test", Test, { lifetime: Lifetime.Scoped });
          const childContainer = container.createChildContainer();
          const scope = childContainer.createScope();
          assert.assertStrictEquals(
            childContainer.resolve<Test>("test", scope).propertyA,
            "test",
          );
        });
        test("child container resolves even when parent doesn't have registration", () => {
          // deno-lint-ignore no-empty-interface
          interface IFoo {}
          class Foo implements IFoo {}
          const childContainer = container.createChildContainer();
          childContainer.register("IFoo", { useClass: Foo });
          assert.assertInstanceOf(childContainer.resolve<Foo>("IFoo"), Foo);
        });
        test("child container resolves using parent's registration when child container doesn't have registration", () => {
          // deno-lint-ignore no-empty-interface
          interface IFoo {}
          class Foo implements IFoo {}
          container.register("IFoo", { useClass: Foo });
          const childContainer = container.createChildContainer();
          assert.assertInstanceOf(childContainer.resolve<Foo>("IFoo"), Foo);
        });
        test("child container resolves all even when parent doesn't have registration", () => {
          // deno-lint-ignore no-empty-interface
          interface IFoo {}
          class Foo implements IFoo {}
          const childContainer = container.createChildContainer();
          childContainer.register("IFoo", { useClass: Foo });
          const myFoo = childContainer.resolveAll<IFoo>("IFoo");
          assert.assertInstanceOf(myFoo, Array);
          assert.assertStrictEquals(myFoo.length, 1);
          assert.assertInstanceOf(myFoo[0], Foo);
        });

        test("child container resolves all using parent's registration when child container doesn't have registration", () => {
          // deno-lint-ignore no-empty-interface
          interface IFoo {}
          class Foo implements IFoo {}
          container.register("IFoo", { useClass: Foo });
          const childContainer = container.createChildContainer();
          const myFoo = childContainer.resolveAll<IFoo>("IFoo");
          assert.assertInstanceOf(myFoo, Array);
          assert.assertStrictEquals(myFoo.length, 1);
          assert.assertInstanceOf(myFoo[0], Foo);
        });
        test("should not create a new instance of requested singleton service", () => {
          @Singleton()
          class Bar {}

          const bar1 = container.resolve(Bar);

          assert.assertInstanceOf(bar1, Bar);

          const childContainer = container.createChildContainer();
          const bar2 = childContainer.resolve(Bar);

          assert.assertInstanceOf(bar2, Bar);
          assert.assertStrictEquals(bar1, bar2);
        });
      });
      describe("registerType", () => {
        test("registerType() allows for classes to be swapped", () => {
          class Bar {}
          class Foo {}
          container.registerType(Bar, Foo);

          assert.assertInstanceOf(container.resolve(Bar), Foo);
        });

        test("registerType() allows for names to be registered for a given type", () => {
          class Bar {}
          container.registerType("CoolName", Bar);

          assert.assertInstanceOf(container.resolve("CoolName"), Bar);
        });

        test("registerType() doesn't allow tokens to point to themselves", () => {
          assert.assertThrows(
            () => container.registerType("Bar", "Bar"),
            TokenRegistrationCycleError,
          );
        });

        test("registerType() doesn't allow registration cycles", () => {
          container.registerType("Bar", "Foo");
          container.registerType("Foo", "FooBar");

          assert.assertThrows(
            () => container.registerType("FooBar", "Bar"),
            TokenRegistrationCycleError,
          );
        });
      });
    });
  });
});
