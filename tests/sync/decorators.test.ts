import { beforeEach, describe, test } from "jsr:@std/testing/bdd";
import { container } from "../../src/container.ts";
import {
  AutoInjectable,
  createInterfaceId,
  Inject,
  InjectAll,
  Scoped,
  Singleton,
  Transient,
} from "../../src/decorators.ts";
import { UndefinedScopeError } from "../../src/exceptions/UndefinedScopeError.ts";
import { InvalidDecoratorError } from "../../src/exceptions/InvalidDecoratorError.ts";
import * as assert from "jsr:@std/assert";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.reset());
  describe("sync", () => {
    describe("Class Decorators", () => {
      describe("Singleton", () => {
        test("should work with @Singleton decorator", () => {
          @Singleton()
          class TestClass {}
          const instance1 = container.resolve(TestClass);
          const instance2 = container.resolve(TestClass);
          assert.assertStrictEquals(instance1, instance2);
        });
        test("should create an target and inject singleton", () => {
          @Singleton("serviceA")
          class ServiceA {}
          @Singleton(["serviceA"])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = container.resolve<ServiceB>(ServiceB);
          assert.assertInstanceOf(b, ServiceB);
          assert.assertInstanceOf(b.serviceA, ServiceA);
          const a = container.resolve<ServiceA>("serviceA");
          assert.assertInstanceOf(a, ServiceA);
          assert.assertStrictEquals(b.serviceA, a);
        });
        test("should redirect the registration", () => {
          @Singleton()
          class Test {}

          class TestMock {}

          @Transient([Test])
          class TestClass {
            constructor(public readonly test: Test) {}
          }
          container.registerType(Test, TestMock);
          const test = container.resolve<TestClass>(TestClass);
          assert.assertInstanceOf(test.test, TestMock);
        });
      });
      describe("Transient", () => {
        test("should work with @Transient decorator", () => {
          @Transient()
          class TestClass {}
          const instance1 = container.resolve(TestClass);
          const instance2 = container.resolve(TestClass);
          assert.assertNotStrictEquals(instance1, instance2);
        });
        test("should create an target and inject transient", () => {
          @Transient()
          class ServiceA {}
          @Singleton([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = container.resolve<ServiceB>(ServiceB);
          assert.assertInstanceOf(b, ServiceB);
          assert.assertInstanceOf(b.serviceA, ServiceA);
          const a = container.resolve<ServiceA>(ServiceA);
          assert.assertInstanceOf(a, ServiceA);
          assert.assertNotStrictEquals(b.serviceA, a);
          assert.equal(b.serviceA, a);
        });
        test("should create transients", () => {
          @Transient()
          class ServiceA {}
          @Transient([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const b = container.resolve<ServiceB>(ServiceB);
          assert.assertInstanceOf(b, ServiceB);
          assert.assertInstanceOf(b.serviceA, ServiceA);
          const a = container.resolve<ServiceA>(ServiceA);
          assert.assertInstanceOf(a, ServiceA);
          assert.assertNotStrictEquals(b.serviceA, a);
          assert.equal(b.serviceA, a);
          const b2 = container.resolve<ServiceB>(ServiceB);
          assert.assertNotStrictEquals(b, b2);
          assert.equal(b, b2);
        });
      });
      describe("Scoped", () => {
        test("should work with @Scoped decorator", () => {
          @Scoped()
          class TestClass {}
          const scope = container.createScope();
          const instance1 = container.resolve(TestClass, scope);
          const instance2 = container.resolve(TestClass, scope);
          assert.assertStrictEquals(instance1, instance2);
        });
        test("should create scoped", () => {
          @Scoped()
          class ServiceA {}
          @Scoped([ServiceA])
          class ServiceB {
            constructor(public serviceA: ServiceA) {}
          }
          const scope = container.createScope();
          const b = container.resolve<ServiceB>(ServiceB, scope);
          assert.assertInstanceOf(b, ServiceB);
          assert.assertInstanceOf(b.serviceA, ServiceA);
          const a = container.resolve<ServiceA>(ServiceA, scope);
          assert.assertInstanceOf(a, ServiceA);
          assert.assertStrictEquals(b.serviceA, a);
          assert.assertThrows(
            () => container.resolve<ServiceB>(ServiceB),
            UndefinedScopeError,
          );
        });
      });
      describe("AutoInjectable", () => {
        describe("new()", () => {
          test("@AutoInjectable allows for injection to be performed without using .resolveWithArgs()", async () => {
            class TestA {}
            @AutoInjectable([TestA])
            class TestB {
              constructor(
                public otherArg: string,
                public a?: TestA,
              ) {}
            }
            const testB = new TestB("test");
            assert.assertInstanceOf(testB, TestB);
            assert.assertStrictEquals(testB.otherArg, "test");
            assert.assertInstanceOf(testB.a, TestA);
          });
          test("@AutoInjectable allows for parameters to be specified manually", () => {
            class Bar {}
            @AutoInjectable([Bar])
            class Foo {
              constructor(public myBar?: Bar) {}
            }

            const myBar = new Bar();
            const myFoo = new Foo(myBar);

            assert.assertStrictEquals(myFoo.myBar, myBar);
          });
          test("@AutoInjectable injects parameters beyond those specified manually", () => {
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
            const myFoo = new Foo(myFooBar);

            assert.assertStrictEquals(myFoo.myFooBar, myFooBar);
            assert.assertInstanceOf(myFoo.myBar, Bar);
          });
          test("@AutoInjectable works when the @AutoInjectable is a polymorphic ancestor", () => {
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

            const instance = new Child();

            assert.assertInstanceOf(instance.myFoo, Foo);
          });
          test("@AutoInjectable classes keep behavior from their ancestor's constructors", () => {
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

            const instance = new Child();

            assert.assertStrictEquals(instance.a, a);
            assert.assertStrictEquals(instance.b, b);
          });
          test("@AutoInjectable classes resolve their @Transient dependencies", () => {
            class Foo {}
            @Transient([Foo])
            class Bar {
              constructor(public myFoo: Foo) {}
            }
            @AutoInjectable([Bar])
            class FooBar {
              constructor(public myBar?: Bar) {}
            }

            const myFooBar = new FooBar();

            assert.assertInstanceOf(myFooBar.myBar!.myFoo, Foo);
          });
          test("@AutoInjectable works with @Singleton", () => {
            class Bar {}

            @Singleton([Bar])
            @AutoInjectable([Bar])
            class Foo {
              constructor(public bar: Bar) {}
            }

            const instance1 = container.resolve<Foo>(Foo);
            const instance2 = container.resolve<Foo>(Foo);

            assert.assertStrictEquals(instance1, instance2);
            assert.assertStrictEquals(instance1.bar, instance2.bar);
          });

          test("@AutoInjectable resolves multiple registered dependencies", () => {
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

            const foo = new Foo();
            assert.assertInstanceOf(foo.bar, Array);
            assert.assertStrictEquals(foo.bar!.length, 1);
            assert.assertInstanceOf(foo.bar![0], FooBar);
          });

          test("@AutoInjectable resolves multiple transient dependencies", () => {
            class Foo {}

            @AutoInjectable([Foo], { all: [Foo] })
            class Bar {
              constructor(public foo?: Foo[]) {}
            }

            const bar = new Bar();
            assert.assertInstanceOf(bar.foo, Array);
            assert.assertStrictEquals(bar.foo!.length, 1);
            assert.assertInstanceOf(bar.foo![0], Foo);
          });
        });
        describe("resolveWithArgs", () => {
          test("should resolve an instance with extra args", () => {
            class TestA {}
            @AutoInjectable([TestA])
            class TestB {
              constructor(
                public hello: string,
                public num: number,
                public a?: TestA,
              ) {}
            }
            const testB = container.resolveWithArgs<TestB>(TestB, ["test", 1]);
            assert.assertInstanceOf(testB, TestB);
            assert.assertStrictEquals(testB.hello, "test");
            assert.assertStrictEquals(testB.num, 1);
            assert.assertInstanceOf(testB.a, TestA);
          });
          test("@AutoInjectable allows for parameters to be specified manually", () => {
            class Bar {}
            @AutoInjectable([Bar])
            class Foo {
              constructor(public myBar?: Bar) {}
            }

            const myBar = new Bar();
            const myFoo = container.resolveWithArgs<Foo>(Foo, [myBar]);

            assert.assertStrictEquals(myFoo.myBar, myBar);
          });
          test("@AutoInjectable injects parameters beyond those specified manually", () => {
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
            const myFoo = container.resolveWithArgs<Foo>(Foo, [myFooBar]);

            assert.assertStrictEquals(myFoo.myFooBar, myFooBar);
            assert.assertInstanceOf(myFoo.myBar, Bar);
          });
          test("@AutoInjectable works when the @AutoInjectable is a polymorphic ancestor", () => {
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

            const instance = container.resolveWithArgs<Child>(Child);

            assert.assertInstanceOf(instance.myFoo, Foo);
          });
          test("@AutoInjectable classes keep behavior from their ancestor's constructors", () => {
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

            const instance = container.resolveWithArgs<Child>(Child);
            //const instance = new Child();

            assert.assertStrictEquals(instance.a, a);
            assert.assertStrictEquals(instance.b, b);
            assert.assertInstanceOf(instance.myFoo, Foo);
          });
          test("@AutoInjectable classes resolve their @Transient dependencies", () => {
            class Foo {}
            @Transient([Foo])
            class Bar {
              constructor(public myFoo: Foo) {}
            }
            @AutoInjectable([Bar])
            class FooBar {
              constructor(public myBar?: Bar) {}
            }

            const myFooBar = container.resolveWithArgs<FooBar>(FooBar);

            assert.assertInstanceOf(myFooBar.myBar!.myFoo, Foo);
          });
          test("@AutoInjectable works with @Singleton", () => {
            class Bar {}

            @Singleton([Bar])
            @AutoInjectable([Bar])
            class Foo {
              constructor(public bar: Bar) {}
            }

            const instance1 = container.resolve<Foo>(Foo);
            const instance2 = container.resolve<Foo>(Foo);

            assert.assertStrictEquals(instance1, instance2);
            assert.assertStrictEquals(instance1.bar, instance2.bar);
          });
          test("@AutoInjectable resolves multiple registered dependencies", () => {
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

            const foo = container.resolveWithArgs(Foo);
            assert.assertInstanceOf(foo.bar, Array);
            assert.assertStrictEquals(foo.bar!.length, 1);
            assert.assertInstanceOf(foo.bar![0], FooBar);
          });

          test("@AutoInjectable resolves multiple transient dependencies", () => {
            class Foo {}

            @AutoInjectable([Foo], { all: [Foo] })
            class Bar {
              constructor(public foo?: Foo[]) {}
            }

            const bar = container.resolveWithArgs(Bar);
            assert.assertInstanceOf(bar.foo, Array);
            assert.assertStrictEquals(bar.foo!.length, 1);
            assert.assertInstanceOf(bar.foo![0], Foo);
          });
        });
      });
      describe("Inject and InjectAll", () => {
        test("should fail", () => {
          assert.assertThrows(
            () =>
              class Test {
                @Inject("token")
                set val(value: unknown) {}
              },
            InvalidDecoratorError,
          );
        });
        describe("field", () => {
          test("should inject an instance into the class field", () => {
            @Singleton()
            class TestA {
              prop = "testA";
            }

            class TestB {
              @Inject(TestA)
              testA!: TestA;
            }
            const testB = new TestB();
            assert.assertInstanceOf(testB, TestB);
            assert.assertInstanceOf(testB.testA, TestA);
            assert.assertStrictEquals(testB.testA.prop, "testA");
          });
          test("should injectAll registered instances into the class field", () => {
            class TestA {
              prop = "testA";
            }
            container.registerSingleton(TestA, TestA);
            container.registerSingleton(TestA, TestA);

            class TestB {
              @InjectAll(TestA)
              testA!: TestA[];
            }

            const testB = new TestB();
            assert.assertInstanceOf(testB, TestB);
            assert.assertInstanceOf(testB.testA, Array);
            assert.assertStrictEquals(testB.testA.length, 2);
            assert.assertInstanceOf(testB.testA[0], TestA);
            assert.assertStrictEquals(testB.testA[0].prop, "testA");
            assert.assertInstanceOf(testB.testA[1], TestA);
            assert.assertStrictEquals(testB.testA[1].prop, "testA");
          });
        });
        describe("accessor", () => {
          test("should inject an instance into the class accessor", () => {
            @Singleton()
            class TestA {
              prop = "testA";
            }

            class TestB {
              @Inject(TestA)
              accessor testA!: TestA;
            }
            const testB = new TestB();
            assert.assertInstanceOf(testB, TestB);
            assert.assertInstanceOf(testB.testA, TestA);
            assert.assertStrictEquals(testB.testA.prop, "testA");
          });
          test("should injectAll registered instances into the class accessor", () => {
            class TestA {
              prop = "testA";
            }

            container.registerSingleton(TestA, TestA);
            container.registerSingleton(TestA, TestA);

            class TestB {
              @InjectAll(TestA)
              accessor testA!: TestA[];
            }

            const testB = new TestB();
            assert.assertInstanceOf(testB, TestB);
            assert.assertInstanceOf(testB.testA, Array);
            assert.assertStrictEquals(testB.testA.length, 2);
            assert.assertInstanceOf(testB.testA[0], TestA);
            assert.assertStrictEquals(testB.testA[0].prop, "testA");
            assert.assertInstanceOf(testB.testA[1], TestA);
            assert.assertStrictEquals(testB.testA[1].prop, "testA");
          });
        });
        describe("method", () => {
          test("should inject an instance into the method of the class", () => {
            @Singleton()
            class TestA {
              prop = "testA";
            }
            class TestB {
              @Inject(TestA)
              doSomething(testA?: TestA) {
                return testA!.prop;
              }
            }
            const testB = container.resolve(TestB);
            assert.assertInstanceOf(testB, TestB);
            assert.assertStrictEquals(testB.doSomething(), "testA");
          });

          test("should inject all registered instances into the method of the class", () => {
            class TestA {
              prop = "testA";
            }
            container.registerSingleton(TestA, TestA);
            container.registerSingleton(TestA, TestA);

            class TestB {
              @InjectAll(TestA)
              doSomething(testA?: TestA[]): Array<TestA> {
                return testA!;
              }
            }
            const testB = container.resolve(TestB);
            assert.assertInstanceOf(testB, TestB);
            assert.assertInstanceOf(testB.doSomething(), Array);
            assert.assertStrictEquals(testB.doSomething().length, 2);
            assert.assertStrictEquals(testB.doSomething()[0].prop, "testA");
          });
        });
        describe("getter", () => {
          test("should inject an instance into the getter of the class", () => {
            @Singleton()
            class TestA {
              prop = "testA";
            }
            class TestB {
              propTestA?: TestA;
              @Inject(TestA)
              get testA(): TestA {
                return this.propTestA!;
              }
            }
            const testB = container.resolve(TestB);
            assert.assertInstanceOf(testB, TestB);
            assert.assertStrictEquals(testB.propTestA, undefined);
            assert.assertInstanceOf(testB.testA, TestA);
            assert.assertStrictEquals(testB.testA.prop, "testA");
          });
          test("should inject all registered instances into the getter of the class", () => {
            class TestA {
              prop = "testA";
            }
            container.registerSingleton(TestA, TestA);
            container.registerSingleton(TestA, TestA);

            class TestB {
              propTestA?: TestA[];
              @InjectAll(TestA)
              get testA(): TestA[] {
                return this.propTestA!;
              }
            }
            const testB = container.resolve(TestB);
            assert.assertInstanceOf(testB, TestB);
            assert.assertStrictEquals(testB.propTestA, undefined);
            assert.assertInstanceOf(testB.testA, Array);
            assert.assertStrictEquals(testB.testA.length, 2);
            assert.assertStrictEquals(testB.testA[0].prop, "testA");
          });
        });
      });
      test("should create instance of object not in container", () => {
        class TestA {}
        @Singleton([TestA])
        class TestB {
          constructor(public a: TestA) {}
        }
        const test = container.resolve<TestB>(TestB);
        assert.assertInstanceOf(test, TestB);
        assert.assertInstanceOf(test.a, TestA);
      });
    });
    describe("Interface Decorators", () => {
      test("should create an target and inject singleton", () => {
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
        const b = container.resolve<SB>(SB);
        assert.assertInstanceOf(b, ServiceB);
        assert.assertInstanceOf(b.serviceA, ServiceA);
        const a = container.resolve<SA>(SA);
        assert.assertInstanceOf(a, ServiceA);
        assert.assertStrictEquals(b.serviceA, a);
      });
      test("should create an target and inject transient", () => {
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
        const b = container.resolve<SB>(SB);
        assert.assertInstanceOf(b, ServiceB);
        assert.assertInstanceOf(b.serviceA, ServiceA);
        const a = container.resolve<SA>(SA);
        assert.assertInstanceOf(a, ServiceA);
        assert.assertNotStrictEquals(b.serviceA, a);
        assert.equal(b.serviceA, a);
      });
      test("should create transients", () => {
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
        const b = container.resolve<SB>(SB);
        assert.assertInstanceOf(b, ServiceB);
        assert.assertInstanceOf(b.serviceA, ServiceA);
        const a = container.resolve<SA>(SA);
        assert.assertInstanceOf(a, ServiceA);
        assert.assertNotStrictEquals(b.serviceA, a);
        assert.equal(b.serviceA, a);
        const b2 = container.resolve<SB>(SB);
        assert.assertNotStrictEquals(b, b2);
        assert.equal(b, b2);
      });
      test("should create scoped", () => {
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
        const b = container.resolve<SB>(SB, scope);
        assert.assertInstanceOf(b, ServiceB);
        assert.assertInstanceOf(b.serviceA, ServiceA);
        const a = container.resolve<SA>(SA, scope);
        assert.assertInstanceOf(a, ServiceA);
        assert.assertStrictEquals(b.serviceA, a);
        assert.equal(b.serviceA, a);
        assert.assertThrows(
          () => container.resolve<SB>(SB),
          UndefinedScopeError,
        );
      });
    });
  });
});
