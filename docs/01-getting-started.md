# Dymexjs/DI

Dymexjs/DI is a dependency injection library for Typescript/Javascript to help
build well-structured code and easily testable applications.

<!-- TOC depthFrom:1 depthTo:3 -->

- [Dymexjs/DI](#dymexjsdi)
  - [Getting Started](#getting-started)
  - [Instalation](#instalation)
  - [Basic Usage](#basic-usage)
    - [Decorators](#decorators)
    - [Static Injection (without decorators)](#static-injection-without-decorators)
  - [Lifetime](#lifetime)
  - [Circular Dependencies](#circular-dependencies)

<!-- /TOC -->

## Getting Started

Dymexjs/DI performs
[Constructor Injection](https://en.wikipedia.org/wiki/Dependency_injection#Constructor_injection)
on the constructors of decorated classes or classes with the properties
`STATIC_INJECTIONS` and `STATIC_INJECTION_LIFETIME`, but also allows for
injection into class fields, accessor's, methods and getter's.

## Instalation

```sh
deno add jsr:@dymex-deno/di
```

## Basic Usage

### Decorators

- @Singleton
- @Transient
- @Scoped
- @AutoInjectable
- @Inject
- @InjectAll

```typescript
import { container } from "jsr:@dymex-deno/di";

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
console.log(testInstance.testService.printMessage());
// logs "I'm printting this message inside of TestService instance."
```

---

### Static Injection (without decorators)

- `STATIC_INJECTION_LIFETIME`
- `STATIC_INJECTIONS`

```typescript
import {
  container,
  STATIC_INJECTION_LIFETIME,
  STATIC_INJECTIONS,
  StaticInjectable,
} from "@dymexjs/di";

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
console.log(test2.test.propertyA);
// logs "test"
```

This snippet creates (resolves to) one instance of `TestClass` that will be a
`Singleton` instance and a `Transient` instance of `TestClass2` that will have
`TestClass` injected into the constructor.

Instead of using `container.register` it's also possible to use the `TestClass`
directly:

```typescript
import {
  container,
  STATIC_INJECTION_LIFETIME,
  STATIC_INJECTIONS,
  StaticInjectable,
} from "@dymexjs/di";

class TestClass implements StaticInjectable<typeof TestClass> {
  public propertyA = "test";
  public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
}
class TestClass2 implements StaticInjectable<typeof TestClass2> {
  constructor(public test: TestClass) {}
  public static [STATIC_INJECTIONS] = [TestClass];
}
const test2 = container.resolve(TestClass2);
console.log(test2.test.propertyA);
// logs "test"
```

## Lifetime

Lifetime defines how instances will be resolved

```typescript
enum Lifetime {
  Singleton,
  Transient,
  Scoped,
}
```

- **Singleton**
  - Each resolve will return the same instance ( including resolves from child
    containers)
- **Transient**
  - This is the default registration scope, a new instance will be created with
    each resolve
- **Scoped**
  - The container will resolve always to the same instance, like the singleton,
    but only when inside a Scope,
    [createScope](03-03-child_scope.md#createscope) for more info, when a scope
    is not defined the resolution will throw an Error.

## Circular Dependencies

Cyclic dependencies are a problem, and should be avoided, but sometimes it's
easiest to have them, to solve this problem the container resolves an already
existing instance in resolution by creating a proxy of the instance that will
later be resolved into the instance.
