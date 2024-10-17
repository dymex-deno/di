import { beforeEach, describe, test } from "jsr:@std/testing/bdd";
import { container } from "../../src/container.ts";
import {
  AutoInjectable,
  createInterfaceId,
  Scoped,
  Singleton,
  Transient,
} from "../../src/decorators.ts";
import { UndefinedScopeError } from "../../src/exceptions/UndefinedScopeError.ts";
import * as assert from "jsr:@std/assert";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.reset());
  describe("async", () => {
    describe("Class Decorators", () => {
      describe("Singleton", () => {
        test("should work with @Singleton decorator", async () => {
          @Singleton()
          class TestClass {}
          const instance1 = await container.resolveAsync(TestClass);
          const instance2 = await container.resolveAsync(TestClass);
          assert.assertStrictEquals(instance1, instance2);
        });
        test("should create an target and inject singleton", async () => {
          @Singleton("serviceA")
          class ServiceA {}
          @Singleton(["serviceA"])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = await container.resolveAsync<ServiceB>(ServiceB);
          assert.assertInstanceOf(b, ServiceB);
          assert.assertInstanceOf(b.serviceA, ServiceA);
          const a = await container.resolveAsync("serviceA");
          assert.assertInstanceOf(a, ServiceA);
          assert.equal(b.serviceA, a);
        });
        test("should redirect the registration", async () => {
          @Singleton()
          class Test {}

          class TestMock {}

          @Transient([Test])
          class TestClass {
            constructor(public readonly test: Test) {}
          }
          container.registerType(Test, TestMock);
          const test = await container.resolveAsync<TestClass>(TestClass);
          assert.assertInstanceOf(test.test, TestMock);
        });
      });
      describe("Transient", () => {
        test("should work with @Transient decorator", async () => {
          @Transient()
          class TestClass {}
          const instance1 = await container.resolveAsync(TestClass);
          const instance2 = await container.resolveAsync(TestClass);
          assert.assertNotStrictEquals(instance1, instance2);
        });
        test("should create an target and inject transient", async () => {
          @Transient()
          class ServiceA {}
          @Singleton([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = await container.resolveAsync<ServiceB>(ServiceB);
          assert.assertInstanceOf(b, ServiceB);
          assert.assertInstanceOf(b.serviceA, ServiceA);
          const a = await container.resolveAsync<ServiceA>(ServiceA);
          assert.assertInstanceOf(a, ServiceA);
          assert.assertNotStrictEquals(b.serviceA, a);
          assert.equal(b.serviceA, a);
        });
        test("should create transients", async () => {
          @Transient()
          class ServiceA {}
          @Transient([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = await container.resolveAsync<ServiceB>(ServiceB);
          assert.assertInstanceOf(b, ServiceB);
          assert.assertInstanceOf(b.serviceA, ServiceA);
          const a = await container.resolveAsync(ServiceA);
          assert.assertInstanceOf(a, ServiceA);
          assert.assertNotStrictEquals(b.serviceA, a);
          assert.equal(b.serviceA, a);
          const b2 = await container.resolveAsync(ServiceB);
          assert.assertNotStrictEquals(b, b2);
          assert.equal(b, b2);
        });
      });
      describe("Scoped", () => {
        test("should work with @Scoped decorator", async () => {
          @Scoped()
          class TestClass {}
          const scope = container.createScope();
          const instance1 = await container.resolveAsync(TestClass, scope);
          const instance2 = await container.resolveAsync(TestClass, scope);
          assert.assertStrictEquals(instance1, instance2);
        });
        test("should create scoped", async () => {
          @Scoped()
          class ServiceA {}
          @Scoped([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const scope = container.createScope();
          const b = await container.resolveAsync<ServiceB>(ServiceB, scope);
          assert.assertInstanceOf(b, ServiceB);
          assert.assertInstanceOf(b.serviceA, ServiceA);
          const a = await container.resolveAsync(ServiceA, scope);
          assert.assertInstanceOf(a, ServiceA);
          assert.assertStrictEquals(b.serviceA, a);
          assert.assertRejects(
            () => container.resolveAsync<ServiceB>(ServiceB),
            UndefinedScopeError,
          );
        });
      });
      describe("AutoInjectable", () => {
        describe("resolveWithArgs", () => {
          test("should resolve an instance with extra args", async () => {
            class TestA {}
            @AutoInjectable([TestA])
            class TestB {
              constructor(
                public hello: string,
                public num: number,
                public a?: TestA,
              ) {}
            }
            const testB = await container.resolveWithArgsAsync<TestB>(TestB, [
              "test",
              1,
            ]);
            assert.assertInstanceOf(testB, TestB);
            assert.assertStrictEquals(testB.hello, "test");
            assert.assertStrictEquals(testB.num, 1);
            assert.assertInstanceOf(testB.a, TestA);
          });
          test("@AutoInjectable allows for parameters to be specified manually", async () => {
            class Bar {}
            @AutoInjectable([Bar])
            class Foo {
              constructor(public myBar?: Bar) {}
            }

            const myBar = new Bar();
            const myFoo = await container.resolveWithArgsAsync<Foo>(Foo, [
              myBar,
            ]);

            assert.assertStrictEquals(myFoo.myBar, myBar);
          });
          test("@AutoInjectable injects parameters beyond those specified manually", async () => {
            class Bar {}
            class FooBar {}
            @AutoInjectable([Bar])
            class Foo {
              constructor(
                public myFooBar: FooBar,
                public myBar?: Bar,
              ) {}
            }

            const myFooBar = new FooBar();
            const myFoo = await container.resolveWithArgsAsync<Foo>(Foo, [
              myFooBar,
            ]);

            assert.assertStrictEquals(myFoo.myFooBar, myFooBar);
            assert.assertInstanceOf(myFoo.myBar, Bar);
          });
          test("@AutoInjectable works when the @AutoInjectable is a polymorphic ancestor", async () => {
            class Foo {
              constructor() {}
            }

            @AutoInjectable([Foo])
            class Ancestor {
              constructor(public myFoo?: Foo) {}
            }

            class Child extends Ancestor {
              constructor() {
                super();
              }
            }

            const instance = await container.resolveWithArgsAsync<Child>(Child);

            assert.assertInstanceOf(instance.myFoo, Foo);
          });
          test("@AutoInjectable classes keep behavior from their ancestor's constructors", async () => {
            const a = 5;
            const b = 4;
            class Foo {
              constructor() {}
            }

            @AutoInjectable([Foo])
            class Ancestor {
              public a: number;
              constructor(public myFoo?: Foo) {
                this.a = a;
              }
            }

            class Child extends Ancestor {
              public b: number;
              constructor() {
                super();

                this.b = b;
              }
            }

            const instance = await container.resolveWithArgsAsync<Child>(Child);

            assert.assertStrictEquals(instance.a, a);
            assert.assertStrictEquals(instance.b, b);
            assert.assertInstanceOf(instance.myFoo, Foo);
          });
          test("@AutoInjectable classes resolve their @Transient dependencies", async () => {
            class Foo {}
            @Transient([Foo])
            class Bar {
              constructor(public myFoo: Foo) {}
            }
            @AutoInjectable([Bar])
            class FooBar {
              constructor(public myBar?: Bar) {}
            }

            const myFooBar = await container.resolveWithArgsAsync<FooBar>(
              FooBar,
            );

            assert.assertInstanceOf(myFooBar.myBar!.myFoo, Foo);
          });
          test("@AutoInjectable works with @Singleton", async () => {
            class Bar {}

            @Singleton([Bar])
            @AutoInjectable([Bar])
            class Foo {
              constructor(public bar: Bar) {}
            }

            const instance1 = await container.resolveAsync(Foo);
            const instance2 = await container.resolveAsync(Foo);

            assert.assertStrictEquals(instance1, instance2);
            assert.assertStrictEquals(instance1.bar, instance2.bar);
          });
          test("@AutoInjectable resolves multiple registered dependencies", async () => {
            interface Bar {
              str: string;
            }

            @Transient()
            class FooBar implements Bar {
              str = "";
            }

            container.register<Bar>("Bar", { useClass: FooBar });

            @AutoInjectable(["Bar"], { all: ["Bar"] })
            class Foo {
              constructor(public bar?: Bar[]) {}
            }

            const foo = await container.resolveWithArgsAsync(Foo);
            assert.assertInstanceOf(foo.bar, Array);
            assert.assertStrictEquals(foo.bar!.length, 1);
            assert.assertInstanceOf(foo.bar![0], FooBar);
          });

          test("@AutoInjectable resolves multiple transient dependencies", async () => {
            class Foo {}

            @AutoInjectable([Foo], { all: [Foo] })
            class Bar {
              constructor(public foo?: Foo[]) {}
            }

            const bar = await container.resolveWithArgsAsync(Bar);
            assert.assertInstanceOf(bar.foo, Array);
            assert.assertStrictEquals(bar.foo!.length, 1);
            assert.assertInstanceOf(bar.foo![0], Foo);
          });
        });
      });
      test("should create instance of object not in container", async () => {
        class TestA {}
        @Singleton([TestA])
        class TestB {
          constructor(public a: TestA) {}
        }
        const test = await container.resolveAsync(TestB);
        assert.assertInstanceOf(test, TestB);
        assert.assertInstanceOf(test.a, TestA);
      });
    });
    describe("Interface Decorators", () => {
      test("should create an target and inject singleton", async () => {
        // deno-lint-ignore no-empty-interface
        interface SA {}
        const SA = createInterfaceId<SA>("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = createInterfaceId<SB>("SB");

        @Singleton(SA)
        class ServiceA {}
        @Singleton(SB, [SA])
        class ServiceB {
          constructor(public serviceA: SA) {}
        }
        const b = await container.resolveAsync<SB>(SB);
        assert.assertInstanceOf(b, ServiceB);
        assert.assertInstanceOf(b.serviceA, ServiceA);
        const a = await container.resolveAsync<SA>(SA);
        assert.assertInstanceOf(a, ServiceA);
        assert.assertStrictEquals(b.serviceA, a);
      });
      test("should create an target and inject transient", async () => {
        // deno-lint-ignore no-empty-interface
        interface SA {}
        const SA = createInterfaceId<SA>("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = createInterfaceId<SB>("SB");

        @Transient(SA)
        class ServiceA {}
        @Singleton(SB, [SA])
        class ServiceB {
          constructor(public serviceA: SA) {}
        }
        const b = await container.resolveAsync<SB>(SB);
        assert.assertInstanceOf(b, ServiceB);
        assert.assertInstanceOf(b.serviceA, ServiceA);
        const a = await container.resolveAsync<SA>(SA);
        assert.assertInstanceOf(a, ServiceA);
        assert.assertNotStrictEquals(b.serviceA, a);
        assert.equal(b.serviceA, a);
      });
      test("should create transients", async () => {
        // deno-lint-ignore no-empty-interface
        interface SA {}
        const SA = createInterfaceId<SA>("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = createInterfaceId<SB>("SB");
        @Transient(SA)
        class ServiceA {}
        @Transient(SB, [SA])
        class ServiceB {
          constructor(public serviceA: SA) {}
        }
        const b = await container.resolveAsync<SB>(SB);
        assert.assertInstanceOf(b, ServiceB);
        assert.assertInstanceOf(b.serviceA, ServiceA);
        const a = await container.resolveAsync<SA>(SA);
        assert.assertInstanceOf(a, ServiceA);
        assert.assertNotStrictEquals(b.serviceA, a);
        assert.equal(b.serviceA, a);
        const b2 = await container.resolveAsync<SB>(SB);
        assert.assertNotStrictEquals(b, b2);
        assert.equal(b, b2);
      });
      test("should create scoped", async () => {
        // deno-lint-ignore no-empty-interface
        interface SA {}
        const SA = createInterfaceId<SA>("SA");
        interface SB {
          readonly serviceA: SA;
        }
        const SB = createInterfaceId<SB>("SB");
        @Scoped(SA)
        class ServiceA {}
        @Scoped(SB, [SA])
        class ServiceB {
          constructor(public serviceA: SA) {}
        }
        const scope = container.createScope();
        const b = await container.resolveAsync<SB>(SB, scope);
        assert.assertInstanceOf(b, ServiceB);
        assert.assertInstanceOf(b.serviceA, ServiceA);
        const a = await container.resolveAsync<SA>(SA, scope);
        assert.assertInstanceOf(a, ServiceA);
        assert.assertStrictEquals(b.serviceA, a);
        assert.equal(b.serviceA, a);
        assert.assertRejects(
          () => container.resolveAsync<SB>(SB),
          UndefinedScopeError,
        );
      });
    });
  });
});
