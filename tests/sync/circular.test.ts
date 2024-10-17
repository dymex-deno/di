import { beforeEach, describe, test } from "jsr:@std/testing/bdd";
import { container } from "../../src/container.ts";
import { StaticInjectable } from "../../src/types/static-inject.interface.ts";
import {
  STATIC_INJECTION_LIFETIME,
  STATIC_INJECTIONS,
} from "../../src/constants.ts";
import { Lifetime } from "../../src/types/registration.interface.ts";
import { IContainer } from "../../src/types/container.interface.ts";
import {
  createInterfaceId,
  Singleton,
  Transient,
} from "../../src/decorators.ts";
import * as assert from "jsr:@std/assert";

describe("Dymexjs_DI ", () => {
  beforeEach(async () => await container.reset());
  describe("async", () => {
    describe("Static inject", () => {
      class ServiceA implements StaticInjectable<typeof ServiceA> {
        constructor(
          public serviceB: ServiceB,
          public serviceC: ServiceC,
        ) {}
        public static [STATIC_INJECTIONS] = ["serviceB", "serviceC"];
        public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
      }
      class ServiceB implements StaticInjectable<typeof ServiceB> {
        constructor(
          public serviceA: ServiceA,
          public serviceD: ServiceD,
        ) {}
        public static [STATIC_INJECTIONS] = ["serviceA", "serviceD"];
        public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
      }
      class ServiceC implements StaticInjectable<typeof ServiceC> {
        constructor(
          public serviceB: ServiceB,
          public serviceD: ServiceD,
        ) {}
        public static [STATIC_INJECTIONS] = ["serviceB", "serviceD"];
        public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
      }
      class ServiceD implements StaticInjectable<typeof ServiceD> {
        constructor(
          public serviceA: ServiceA,
          public serviceC: ServiceC,
        ) {}
        public static [STATIC_INJECTIONS] = ["serviceA", "serviceC"];
        public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
      }

      test("circular dependency resolution simple case", () => {
        const factoryTest = (cont: IContainer) => {
          return cont.resolve(TestClass);
        };
        const factoryTest2 = (cont: IContainer) => {
          return cont.resolve(TestClass2);
        };
        class TestClass2 implements StaticInjectable<typeof TestClass2> {
          constructor(public test: TestClass) {}
          public static [STATIC_INJECTIONS] = ["factoryTest"];
          public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
        }
        class TestClass implements StaticInjectable<typeof TestClass> {
          public propertyA = "test";
          constructor(public test2: TestClass2) {}
          public static [STATIC_INJECTIONS] = ["factoryTest2"];
          public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
        }
        container.register("factoryTest", { useFactory: factoryTest });
        container.register("factoryTest2", { useFactory: factoryTest2 });
        const test2 = container.resolve(TestClass2);
        const test = container.resolve(TestClass);
        assert.assertInstanceOf(test2, TestClass2);
        assert.assertInstanceOf(test, TestClass);
        assert.assertInstanceOf(test2.test, TestClass);
        const t = test.test2.test;
        assert.assertInstanceOf(t, TestClass);
        assert.assertStrictEquals(test2.test, test);
        //This needs to be deepEqual because where comparing the generated proxy, and deepEqual will make a deep equal assertion
        assert.equal(test.test2, test2);
        assert.assertStrictEquals(test.test2.test.propertyA, "test");
      });
      test("circular dependency resolution complex case", () => {
        container.register("serviceA", { useClass: ServiceA });
        container.register("serviceB", { useClass: ServiceB });
        container.register("serviceC", { useClass: ServiceC });
        container.register("serviceD", { useClass: ServiceD });

        /*
                        When resolving for ServiceA the path is:
                        ServiceA(A) -> ServiceB(A) -> ServiceA(B)P -> ServiceD(B) -> ServiceA(D)P -> ServiceC(D) -> ServiceB(C)P -> ServiceD(C)P -> ServiceC(A)
                        //Creation result
                        ServiceA(A) -> ServiceB(A) -> proxy(ServiceA(B)) -> ServiceD(B) -> proxy(ServiceA(D)) -> ServiceC(D) -> proxy(ServiceB(C)) -> proxy(ServiceD(C)) -> ServiceC(A)
                    */

        const serviceA = container.resolve<ServiceA>("serviceA");
        const serviceB = container.resolve<ServiceB>("serviceB");
        const serviceC = container.resolve<ServiceC>("serviceC");
        const serviceD = container.resolve<ServiceD>("serviceD");

        assert.assertInstanceOf(serviceA, ServiceA);
        assert.assertInstanceOf(serviceA.serviceB, ServiceB);
        assert.assertInstanceOf(serviceA.serviceB.serviceA, ServiceA);
        assert.assertInstanceOf(serviceA.serviceB.serviceD, ServiceD);
        assert.assertInstanceOf(serviceA.serviceC, ServiceC);
        assert.assertInstanceOf(serviceA.serviceC.serviceB, ServiceB);
        assert.assertInstanceOf(serviceA.serviceC.serviceD, ServiceD);
        assert.assertInstanceOf(serviceB, ServiceB);
        assert.assertInstanceOf(serviceB.serviceA, ServiceA);
        assert.assertInstanceOf(serviceB.serviceA.serviceB, ServiceB);
        assert.assertInstanceOf(serviceB.serviceA.serviceC, ServiceC);
        assert.assertInstanceOf(serviceB.serviceD, ServiceD);
        assert.assertInstanceOf(serviceB.serviceD.serviceA, ServiceA);
        assert.assertInstanceOf(serviceB.serviceD.serviceC, ServiceC);
        assert.assertInstanceOf(serviceC, ServiceC);
        assert.assertInstanceOf(serviceC.serviceB, ServiceB);
        assert.assertInstanceOf(serviceC.serviceB.serviceA, ServiceA);
        assert.assertInstanceOf(serviceC.serviceB.serviceD, ServiceD);
        assert.assertInstanceOf(serviceC.serviceD, ServiceD);
        assert.assertInstanceOf(serviceC.serviceD.serviceA, ServiceA);
        assert.assertInstanceOf(serviceC.serviceD.serviceC, ServiceC);
        assert.assertInstanceOf(serviceD, ServiceD);
        assert.assertInstanceOf(serviceD.serviceA, ServiceA);
        assert.assertInstanceOf(serviceD.serviceA.serviceB, ServiceB);
        assert.assertInstanceOf(serviceD.serviceA.serviceC, ServiceC);
        assert.assertInstanceOf(serviceD.serviceC, ServiceC);
        assert.assertInstanceOf(serviceD.serviceC.serviceB, ServiceB);
        assert.assertInstanceOf(serviceD.serviceC.serviceD, ServiceD);

        assert.assertStrictEquals(serviceA.serviceB, serviceB); //Instance
        assert.equal(serviceA.serviceB.serviceA, serviceA); //Proxy
        assert.assertStrictEquals(serviceA.serviceB.serviceD, serviceD); //Instance
        assert.assertStrictEquals(serviceA.serviceC, serviceC); //Instance
        assert.equal(serviceA.serviceC.serviceB, serviceB); //Proxy
        assert.equal(serviceA.serviceC.serviceD, serviceD); //Proxy
        assert.equal(serviceB.serviceA, serviceA); //Proxy
        assert.assertStrictEquals(serviceB.serviceA.serviceB, serviceB); //Instance
        assert.assertStrictEquals(serviceB.serviceA.serviceC, serviceC); //Instance
        assert.assertStrictEquals(serviceB.serviceD, serviceD); //Instance
        assert.equal(serviceB.serviceD.serviceA, serviceA); //Proxy
        assert.assertStrictEquals(serviceB.serviceD.serviceC, serviceC); //Instance
        assert.equal(serviceC.serviceB, serviceB); //Proxy
        assert.equal(serviceC.serviceB.serviceA, serviceA); //Proxy
        assert.assertStrictEquals(serviceC.serviceB.serviceD, serviceD); //Instance
        assert.equal(serviceC.serviceD, serviceD); //Proxy
        assert.equal(serviceC.serviceD.serviceA, serviceA); //Proxy
        assert.assertStrictEquals(serviceC.serviceD.serviceC, serviceC); //Instance
        assert.equal(serviceD.serviceA, serviceA); //Proxy
        assert.assertStrictEquals(serviceD.serviceA.serviceB, serviceB); //Proxy
        assert.assertStrictEquals(serviceD.serviceA.serviceC, serviceC); //Proxy
        assert.assertStrictEquals(serviceD.serviceC, serviceC); //Instance
        assert.equal(serviceD.serviceC.serviceB, serviceB); //Proxy
        assert.equal(serviceD.serviceC.serviceD, serviceD); //Proxy
      });
    });
    describe("Decorators", () => {
      describe("Class", () => {
        test("circular dependency resolution simple case", () => {
          @Singleton("test", ["test2"])
          class TestClass {
            public propertyA = "test";
            constructor(public test2: TestClass2) {}
          }
          @Singleton("test2", ["test"])
          class TestClass2 {
            constructor(public test: TestClass) {}
          }

          const test = container.resolve<TestClass>("test");
          const test2 = container.resolve<TestClass2>("test2");
          assert.assertInstanceOf(test, TestClass);
          assert.assertInstanceOf(test2, TestClass2);
          assert.assertInstanceOf(test.test2, TestClass2);
          assert.assertInstanceOf(test2.test, TestClass);
          assert.assertStrictEquals(test.test2, test2);
          //This needs to be equal because where comparing the generated proxy, and equal will make a deep equal assertion
          assert.equal(test2.test, test);
        });
        test("circular dependency complex case", () => {
          @Singleton("serviceA", ["serviceB", "serviceC"])
          class ServiceA {
            constructor(
              public serviceB: ServiceB,
              public serviceC: ServiceC,
            ) {}
          }
          @Singleton("serviceB", ["serviceA", "serviceD"])
          class ServiceB {
            constructor(
              public serviceA: ServiceA,
              public serviceD: ServiceD,
            ) {}
          }
          @Singleton("serviceC", ["serviceB", "serviceD"])
          class ServiceC {
            constructor(
              public serviceB: ServiceB,
              public serviceD: ServiceD,
            ) {}
          }
          @Singleton("serviceD", ["serviceA", "serviceC"])
          class ServiceD {
            constructor(
              public serviceA: ServiceA,
              public serviceC: ServiceC,
            ) {}
          }
          /*
                        When resolving for ServiceA the path is:
                        ServiceA(A) -> ServiceB(A) -> ServiceA(B)P -> ServiceD(B) -> ServiceA(D)P -> ServiceC(D) -> ServiceB(C)P -> ServiceD(C)P -> ServiceC(A)
                        //Creation result
                        ServiceA(A) -> ServiceB(A) -> proxy(ServiceA(B)) -> ServiceD(B) -> proxy(ServiceA(D)) -> ServiceC(D) -> proxy(ServiceB(C)) -> proxy(ServiceD(C)) -> ServiceC(A)
                    */

          const serviceA = container.resolve<ServiceA>("serviceA");
          const serviceB = container.resolve<ServiceB>("serviceB");
          const serviceC = container.resolve<ServiceC>("serviceC");
          const serviceD = container.resolve<ServiceD>("serviceD");

          assert.assertInstanceOf(serviceA, ServiceA);
          assert.assertInstanceOf(serviceA.serviceB, ServiceB);
          assert.assertInstanceOf(serviceA.serviceB.serviceA, ServiceA);
          assert.assertInstanceOf(serviceA.serviceB.serviceD, ServiceD);
          assert.assertInstanceOf(serviceA.serviceC, ServiceC);
          assert.assertInstanceOf(serviceA.serviceC.serviceB, ServiceB);
          assert.assertInstanceOf(serviceA.serviceC.serviceD, ServiceD);
          assert.assertInstanceOf(serviceB, ServiceB);
          assert.assertInstanceOf(serviceB.serviceA, ServiceA);
          assert.assertInstanceOf(serviceB.serviceA.serviceB, ServiceB);
          assert.assertInstanceOf(serviceB.serviceA.serviceC, ServiceC);
          assert.assertInstanceOf(serviceB.serviceD, ServiceD);
          assert.assertInstanceOf(serviceB.serviceD.serviceA, ServiceA);
          assert.assertInstanceOf(serviceB.serviceD.serviceC, ServiceC);
          assert.assertInstanceOf(serviceC, ServiceC);
          assert.assertInstanceOf(serviceC.serviceB, ServiceB);
          assert.assertInstanceOf(serviceC.serviceB.serviceA, ServiceA);
          assert.assertInstanceOf(serviceC.serviceB.serviceD, ServiceD);
          assert.assertInstanceOf(serviceC.serviceD, ServiceD);
          assert.assertInstanceOf(serviceC.serviceD.serviceA, ServiceA);
          assert.assertInstanceOf(serviceC.serviceD.serviceC, ServiceC);
          assert.assertInstanceOf(serviceD, ServiceD);
          assert.assertInstanceOf(serviceD.serviceA, ServiceA);
          assert.assertInstanceOf(serviceD.serviceA.serviceB, ServiceB);
          assert.assertInstanceOf(serviceD.serviceA.serviceC, ServiceC);
          assert.assertInstanceOf(serviceD.serviceC, ServiceC);
          assert.assertInstanceOf(serviceD.serviceC.serviceB, ServiceB);
          assert.assertInstanceOf(serviceD.serviceC.serviceD, ServiceD);

          assert.assertStrictEquals(serviceA.serviceB, serviceB); //Instance
          assert.equal(serviceA.serviceB.serviceA, serviceA); //Proxy
          assert.assertStrictEquals(serviceA.serviceB.serviceD, serviceD); //Instance
          assert.assertStrictEquals(serviceA.serviceC, serviceC); //Instance
          assert.equal(serviceA.serviceC.serviceB, serviceB); //Proxy
          assert.equal(serviceA.serviceC.serviceD, serviceD); //Proxy
          assert.equal(serviceB.serviceA, serviceA); //Proxy
          assert.assertStrictEquals(serviceB.serviceA.serviceB, serviceB); //Instance
          assert.assertStrictEquals(serviceB.serviceA.serviceC, serviceC); //Instance
          assert.assertStrictEquals(serviceB.serviceD, serviceD); //Instance
          assert.equal(serviceB.serviceD.serviceA, serviceA); //Proxy
          assert.assertStrictEquals(serviceB.serviceD.serviceC, serviceC); //Instance
          assert.equal(serviceC.serviceB, serviceB); //Proxy
          assert.equal(serviceC.serviceB.serviceA, serviceA); //Proxy
          assert.assertStrictEquals(serviceC.serviceB.serviceD, serviceD); //Instance
          assert.equal(serviceC.serviceD, serviceD); //Proxy
          assert.equal(serviceC.serviceD.serviceA, serviceA); //Proxy
          assert.assertStrictEquals(serviceC.serviceD.serviceC, serviceC); //Instance
          assert.equal(serviceD.serviceA, serviceA); //Proxy
          assert.assertStrictEquals(serviceD.serviceA.serviceB, serviceB); //Proxy
          assert.assertStrictEquals(serviceD.serviceA.serviceC, serviceC); //Proxy
          assert.assertStrictEquals(serviceD.serviceC, serviceC); //Instance
          assert.equal(serviceD.serviceC.serviceB, serviceB); //Proxy
          assert.equal(serviceD.serviceC.serviceD, serviceD); //Proxy
        });
        test("Lazily created proxy allows iterating over keys of the original service", () => {
          @Transient(["TestB"])
          class TestA {
            constructor(public b: TestB) {}
          }
          @Transient("TestB", [TestA])
          class TestB {
            public name = "testB";
            public prop = {
              defined: false,
            };
            constructor(public a: TestA) {}
          }
          const a = container.resolve(TestA);
          const b = container.resolve(TestB);
          assert.assertInstanceOf(a, TestA);
          assert.assertInstanceOf(b, TestB);
          assert.equal(Object.keys(a), ["b"]);
          assert.equal(
            Object.keys(b).sort(),
            ["a", "name", "prop"].sort(),
          );
          assert.equal(Object.getOwnPropertyNames(a), ["b"]);
          assert.equal(
            Object.getOwnPropertyNames(b).sort(),
            ["a", "name", "prop"].sort(),
          );
        });
      });
      describe("Interface", () => {
        test("simple case", () => {
          interface TC {
            readonly propertyA: string;
            readonly test2: TC2;
          }
          const TC = createInterfaceId<TC>("TC");
          interface TC2 {
            readonly test: TC;
          }
          const TC2 = createInterfaceId<TC2>("TC2");

          @Singleton(TC, [TC2])
          class TestClass implements TC {
            public propertyA = "test";
            constructor(public test2: TestClass2) {}
          }
          @Singleton(TC2, [TC])
          class TestClass2 implements TC2 {
            constructor(public test: TestClass) {}
          }
          const test2 = container.resolve<TC2>(TC2);
          const test = container.resolve<TestClass>(TC);
          assert.assertInstanceOf(test2, TestClass2);
          assert.assertInstanceOf(test, TestClass);
          assert.assertInstanceOf(test2.test, TestClass);
          assert.assertInstanceOf(test.test2, TestClass2);
          assert.assertStrictEquals(test2.test, test);
          //This needs to be equal because where comparing the generated proxy, and equal will make a deep equal assertion
          assert.equal(test.test2, test2);
        });
        test("Lazy creation with proxies allow circular dependencies using interfaces", () => {
          interface ITestA {
            name: string;
          }
          interface ITestB {
            name: string;
          }
          const ITestA = createInterfaceId("Ia03");
          const ITestB = createInterfaceId("Ib03");

          @Transient(ITestA, [ITestB])
          class TestA implements ITestA {
            public name = "testA";
            constructor(public b: ITestB) {}
          }

          @Transient(ITestB, [ITestA])
          class TestB implements ITestB {
            public name = "testB";
            constructor(public a: ITestA) {}
          }

          const a = container.resolve<TestA>(ITestA);
          const b = container.resolve<TestB>(ITestB);
          assert.assertInstanceOf(a, TestA);
          assert.assertInstanceOf(a.b, TestB);
          assert.assertInstanceOf(b.a, TestA);
          assert.assertStrictEquals(a.b.name, "testB");
        });
        test("circular dependency complex case", async () => {
          interface SA {
            readonly serviceB: SB;
            readonly serviceC: SC;
          }
          const SA = createInterfaceId<SA>("SA");
          interface SB {
            readonly serviceA: SA;
            readonly serviceD: SD;
          }
          const SB = createInterfaceId<SB>("SB");
          interface SC {
            readonly serviceB: SB;
            readonly serviceD: SD;
          }
          const SC = createInterfaceId<SC>("SC");
          interface SD {
            readonly serviceA: SA;
            readonly serviceC: SC;
          }
          const SD = createInterfaceId<SD>("SD");
          @Singleton(SA, [SB, SC])
          class ServiceA {
            constructor(
              public serviceB: ServiceB,
              public serviceC: ServiceC,
            ) {}
          }
          @Singleton(SB, [SA, SD])
          class ServiceB {
            constructor(
              public serviceA: ServiceA,
              public serviceD: ServiceD,
            ) {}
          }
          @Singleton(SC, [SB, SD])
          class ServiceC {
            constructor(
              public serviceB: ServiceB,
              public serviceD: ServiceD,
            ) {}
          }
          @Singleton(SD, [SA, SC])
          class ServiceD {
            constructor(
              public serviceA: ServiceA,
              public serviceC: ServiceC,
            ) {}
          }
          /*
                        When resolving for ServiceA the path is:
                        ServiceA(A) -> ServiceB(A) -> ServiceA(B)P -> ServiceD(B) -> ServiceA(D)P -> ServiceC(D) -> ServiceB(C)P -> ServiceD(C)P -> ServiceC(A)
                        //Creation result
                        ServiceA(A) -> ServiceB(A) -> proxy(ServiceA(B)) -> ServiceD(B) -> proxy(ServiceA(D)) -> ServiceC(D) -> proxy(ServiceB(C)) -> proxy(ServiceD(C)) -> ServiceC(A)
                    */

          const serviceA = container.resolve<ServiceA>(SA);
          const serviceB = container.resolve<ServiceB>(SB);
          const serviceC = container.resolve<ServiceC>(ServiceC);
          const serviceD = container.resolve<ServiceD>(ServiceD);

          assert.assertInstanceOf(serviceA, ServiceA);
          assert.assertInstanceOf(serviceA.serviceB, ServiceB);
          assert.assertInstanceOf(serviceA.serviceB.serviceA, ServiceA);
          assert.assertInstanceOf(serviceA.serviceB.serviceD, ServiceD);
          assert.assertInstanceOf(serviceA.serviceC, ServiceC);
          assert.assertInstanceOf(serviceA.serviceC.serviceB, ServiceB);
          assert.assertInstanceOf(serviceA.serviceC.serviceD, ServiceD);
          assert.assertInstanceOf(serviceB, ServiceB);
          assert.assertInstanceOf(serviceB.serviceA, ServiceA);
          assert.assertInstanceOf(serviceB.serviceA.serviceB, ServiceB);
          assert.assertInstanceOf(serviceB.serviceA.serviceC, ServiceC);
          assert.assertInstanceOf(serviceB.serviceD, ServiceD);
          assert.assertInstanceOf(serviceB.serviceD.serviceA, ServiceA);
          assert.assertInstanceOf(serviceB.serviceD.serviceC, ServiceC);
          assert.assertInstanceOf(serviceC, ServiceC);
          assert.assertInstanceOf(serviceC.serviceB, ServiceB);
          assert.assertInstanceOf(serviceC.serviceB.serviceA, ServiceA);
          assert.assertInstanceOf(serviceC.serviceB.serviceD, ServiceD);
          assert.assertInstanceOf(serviceC.serviceD, ServiceD);
          assert.assertInstanceOf(serviceC.serviceD.serviceA, ServiceA);
          assert.assertInstanceOf(serviceC.serviceD.serviceC, ServiceC);
          assert.assertInstanceOf(serviceD, ServiceD);
          assert.assertInstanceOf(serviceD.serviceA, ServiceA);
          assert.assertInstanceOf(serviceD.serviceA.serviceB, ServiceB);
          assert.assertInstanceOf(serviceD.serviceA.serviceC, ServiceC);
          assert.assertInstanceOf(serviceD.serviceC, ServiceC);
          assert.assertInstanceOf(serviceD.serviceC.serviceB, ServiceB);
          assert.assertInstanceOf(serviceD.serviceC.serviceD, ServiceD);

          assert.assertStrictEquals(serviceA.serviceB, serviceB); //Instance
          assert.equal(serviceA.serviceB.serviceA, serviceA); //Proxy
          assert.assertStrictEquals(serviceA.serviceB.serviceD, serviceD); //Instance
          assert.assertStrictEquals(serviceA.serviceC, serviceC); //Instance
          assert.equal(serviceA.serviceC.serviceB, serviceB); //Proxy
          assert.equal(serviceA.serviceC.serviceD, serviceD); //Proxy
          assert.equal(serviceB.serviceA, serviceA); //Proxy
          assert.assertStrictEquals(serviceB.serviceA.serviceB, serviceB); //Instance
          assert.assertStrictEquals(serviceB.serviceA.serviceC, serviceC); //Instance
          assert.assertStrictEquals(serviceB.serviceD, serviceD); //Instance
          assert.equal(serviceB.serviceD.serviceA, serviceA); //Proxy
          assert.assertStrictEquals(serviceB.serviceD.serviceC, serviceC); //Instance
          assert.equal(serviceC.serviceB, serviceB); //Proxy
          assert.equal(serviceC.serviceB.serviceA, serviceA); //Proxy
          assert.assertStrictEquals(serviceC.serviceB.serviceD, serviceD); //Instance
          assert.equal(serviceC.serviceD, serviceD); //Proxy
          assert.equal(serviceC.serviceD.serviceA, serviceA); //Proxy
          assert.assertStrictEquals(serviceC.serviceD.serviceC, serviceC); //Instance
          assert.equal(serviceD.serviceA, serviceA); //Proxy
          assert.assertStrictEquals(serviceD.serviceA.serviceB, serviceB); //Proxy
          assert.assertStrictEquals(serviceD.serviceA.serviceC, serviceC); //Proxy
          assert.assertStrictEquals(serviceD.serviceC, serviceC); //Instance
          assert.equal(serviceD.serviceC.serviceB, serviceB); //Proxy
          assert.equal(serviceD.serviceC.serviceD, serviceD); //Proxy
        });
      });
    });
  });
});
