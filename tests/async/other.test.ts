import { beforeEach, describe, test } from "jsr:@std/testing/bdd";
import { container } from "../../src/container.ts";
import { TokenNotFoundError } from "../../src/exceptions/TokenNotFoundError.ts";
import { Lifetime } from "../../src/types/registration.interface.ts";
import { Singleton, Transient } from "../../src/decorators.ts";
import * as assert from "jsr:@std/assert";

describe("Dymexjs_DI ", () => {
  beforeEach(async () => await container.reset());
  describe("async", () => {
    describe("other", () => {
      describe("register and resolve", () => {
        test("should throw an error when token not registered async", () => {
          assert.assertRejects(
            () => container.resolveAsync("test"),
            TokenNotFoundError,
          );
        });
      });
      describe("asyncDispose", () => {
        test("should handle async dispose", async () => {
          class TestAsyncDisposable implements AsyncDisposable {
            async [Symbol.asyncDispose](): Promise<void> {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }
          container.register("asyncDisposable", TestAsyncDisposable, {
            lifetime: Lifetime.Singleton,
          });
          container.resolve("asyncDisposable");
          const startTime = Date.now();
          await container.clearInstances();
          const endTime = Date.now();
          assert.assert(endTime - startTime > 90);
        });
      });
      describe("resolveAll", () => {
        test("fails to resolveAll unregistered dependency by name sync", () => {
          assert.assertRejects(
            () => container.resolveAllAsync("NotRegistered"),
            TokenNotFoundError,
          );
        });
        test("resolves an array of transient instances bound to a single interface", async () => {
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

          const fooArray = await container.resolveAllAsync<FooInterface>(
            "FooInterface",
          );
          assert.assertInstanceOf(fooArray, Array);
          assert.assertInstanceOf(fooArray[0], FooOne);
          assert.assertInstanceOf(fooArray[1], FooTwo);
        });
        test("resolves all transient instances when not registered", async () => {
          class Foo {}

          const foo1 = await container.resolveAllAsync(Foo);
          const foo2 = await container.resolveAllAsync(Foo);

          assert.assertInstanceOf(foo1, Array);
          assert.assertInstanceOf(foo2, Array);
          assert.assertInstanceOf(foo1[0], Foo);
          assert.assertInstanceOf(foo2[0], Foo);
          assert.assertNotStrictEquals(foo1[0], foo2[0]);
        });
        test("allows array dependencies to be resolved if a single instance is in the container", () => {
          @Transient()
          class Foo {}

          @Transient()
          class Bar {
            constructor(public foo: Foo[] = container.resolveAll(Foo)) {}
          }

          const bar = container.resolve(Bar);
          assert.assertStrictEquals(bar.foo.length, 1);
        });
      });
      describe("clearInstances", () => {
        test("clears cached instances from container.resolve() calls", async () => {
          class Foo implements AsyncDisposable {
            [Symbol.asyncDispose](): Promise<void> {
              return new Promise((resolve) => setTimeout(resolve, 10));
            }
          }
          container.register(Foo, Foo, { lifetime: Lifetime.Singleton });
          const instance1 = container.resolve(Foo);

          await container.clearInstances();

          // Foo should still be registered as singleton
          const instance2 = container.resolve(Foo);
          const instance3 = container.resolve(Foo);

          assert.assertNotStrictEquals(instance1, instance2);
          assert.assertStrictEquals(instance2, instance3);
          assert.assertInstanceOf(instance3, Foo);
        });
      });
      describe("Child Container", () => {
        test("should resolve in child container", async () => {
          const childContainer = container.createChildContainer();
          childContainer.register("test", { useValue: "test" });
          assert.assertStrictEquals(
            await childContainer.resolveAsync("test"),
            "test",
          );
          assert.assertRejects(
            () => container.resolveAsync("test"),
            TokenNotFoundError,
          );
        });
        test("should resolve in parent container", async () => {
          const childContainer = container.createChildContainer();
          container.register("test", { useValue: "test" });
          assert.assertStrictEquals(
            await container.resolveAsync("test"),
            "test",
          );
          assert.assertStrictEquals(
            await childContainer.resolveAsync("test"),
            "test",
          );
        });
        test("should resolve scoped", async () => {
          class Test {
            propertyA = "test";
          }
          container.register("test", Test, { lifetime: Lifetime.Scoped });
          const childContainer = container.createChildContainer();
          const scope = childContainer.createScope();
          assert.assertStrictEquals(
            (await childContainer.resolveAsync<Test>("test", scope)).propertyA,
            "test",
          );
        });
        test("child container resolves even when parent doesn't have registration", async () => {
          // deno-lint-ignore no-empty-interface
          interface IFoo {}
          class Foo implements IFoo {}
          const childContainer = container.createChildContainer();
          childContainer.register("IFoo", { useClass: Foo });
          assert.assertInstanceOf(
            await childContainer.resolveAsync<Foo>("IFoo"),
            Foo,
          );
        });
        test("child container resolves using parent's registration when child container doesn't have registration", async () => {
          // deno-lint-ignore no-empty-interface
          interface IFoo {}
          class Foo implements IFoo {}
          container.register("IFoo", { useClass: Foo });
          const childContainer = container.createChildContainer();
          assert.assertInstanceOf(
            await childContainer.resolveAsync<Foo>("IFoo"),
            Foo,
          );
        });
        test("child container resolves all even when parent doesn't have registration", async () => {
          // deno-lint-ignore no-empty-interface
          interface IFoo {}
          class Foo implements IFoo {}
          const childContainer = container.createChildContainer();
          childContainer.register("IFoo", { useClass: Foo });
          const myFoo = await childContainer.resolveAllAsync<IFoo>("IFoo");
          assert.assertInstanceOf(myFoo, Array);
          assert.assertStrictEquals(myFoo.length, 1);
          assert.assertInstanceOf(myFoo[0], Foo);
        });

        test("child container resolves all using parent's registration when child container doesn't have registration", async () => {
          // deno-lint-ignore no-empty-interface
          interface IFoo {}
          class Foo implements IFoo {}
          container.register("IFoo", { useClass: Foo });
          const childContainer = container.createChildContainer();
          const myFoo = await childContainer.resolveAllAsync<IFoo>("IFoo");
          assert.assertInstanceOf(myFoo, Array);
          assert.assertStrictEquals(myFoo.length, 1);
          assert.assertInstanceOf(myFoo[0], Foo);
        });
        test("should not create a new instance of requested singleton service", async () => {
          @Singleton()
          class Bar {}

          const bar1 = await container.resolveAsync(Bar);

          assert.assertInstanceOf(bar1, Bar);

          const childContainer = container.createChildContainer();
          const bar2 = await childContainer.resolveAsync(Bar);

          assert.assertInstanceOf(bar2, Bar);
          assert.assertStrictEquals(bar1, bar2);
        });
      });
      describe("removeRegistration", () => {
        test("should remove registration", async () => {
          class Test {}
          container.register("test", Test, { lifetime: Lifetime.Singleton });
          container.register("test", Test, { lifetime: Lifetime.Transient });
          const instances = container.resolveAll("test");
          assert.assertInstanceOf(instances, Array);
          assert.assertStrictEquals(instances.length, 2);
          assert.assertInstanceOf(instances[0], Test);
          assert.assertInstanceOf(instances[1], Test);
          assert.assertNotStrictEquals(instances[0], instances[1]);
          await container.removeRegistration(
            "test",
            (reg) => reg.options.lifetime === Lifetime.Transient,
          );
          const instances2 = container.resolveAll("test");
          assert.assertInstanceOf(instances2, Array);
          assert.assertStrictEquals(instances2.length, 1);
          assert.assertInstanceOf(instances2[0], Test);
          assert.assertStrictEquals(instances2[0], instances[0]);
          await container.removeRegistration(
            "test",
            (reg) => reg.options.lifetime === Lifetime.Singleton,
          );
          assert.assertThrows(
            () => container.resolveAll("test"),
            TokenNotFoundError,
          );
        });
      });
      describe("registerType", () => {
        test("registerType() allows for classes to be swapped", async () => {
          class Bar {}
          class Foo {}
          container.registerType(Bar, Foo);

          assert.assertInstanceOf(
            await container.resolveAsync(Bar),
            Foo,
          );
        });

        test("registerType() allows for names to be registered for a given type", async () => {
          class Bar {}
          container.registerType("CoolName", Bar);

          assert.assertInstanceOf(
            await container.resolveAsync<Bar>("CoolName"),
            Bar,
          );
        });
      });
    });
  });
});
