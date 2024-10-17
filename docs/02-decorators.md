<!-- markdownlint-disable-next-line no-duplicate-heading -->

# Decorators

<!-- TOC depthFrom:1 depthTo:3 -->

- [Decorators](#decorators)
  - [@Singleton](#singleton)
    - [Example](#example)
  - [@Transient](#transient)
  - [@Scoped](#scoped)
    - [Example](#example-1)
  - [@AutoInjectable](#autoinjectable)
    - [Example](#example-2)
  - [@Inject](#inject)
    - [Example](#example-3)
    - [Inject into a class field](#inject-into-a-class-field)
    - [Inject into a class accessor](#inject-into-a-class-accessor)
    - [Inject into a class method](#inject-into-a-class-method)
    - [Inject into a class getter](#inject-into-a-class-getter)
  - [@InjectAll](#injectall)
    - [Inject all instances into a class field](#inject-all-instances-into-a-class-field)

<!-- /TOC -->

## @Singleton

Class decorator factory that registers the class as a `singleton` in the
container.

```typescript
function Singleton(
  id?: InjectionToken | Array<InjectionToken>,
  dependencies?: Array<InjectionToken>,
): ClassDecorator;
```

> @param id Optional token or array of dependencies to inject into the class.\
> @param dependencies Optional array of dependencies to inject into the class.\
> @returns A class decorator that registers the class as a singleton in the
> container.

### Example

```typescript
@Singleton()
class TestClass {}
const instance1 = container.resolve(TestClass);
```

or

```typescript
@Singleton("serviceA") //With token to register
class ServiceA {}
@Singleton(["serviceA"]) //With an array of dependencies to resolve when creating the instance
class ServiceB {
  constructor(public serviceA: ServiceA) {}
}
const b = container.resolve<ServiceB>(ServiceB);
```

or

```typescript
@Singleton()
class ServiceA {}
@Singleton([ServiceA]) //With an array of dependencies to resolve when creating the instance
class ServiceB {
  constructor(public serviceA: ServiceA) {}
}
const b = container.resolve<ServiceB>(ServiceB);
```

**NOTE:** The same pattern is used for Transient and Scoped decorators.

## @Transient

Class decorator factory that registers the class as transient within the
container.

```typescript
function Transient(
  id?: InjectionToken | Array<InjectionToken>,
  dependencies?: Array<InjectionToken>,
): ClassDecorator;
```

> @param id Optional token or array of dependencies to inject into the class.\
> @param dependencies Optional array of dependencies to inject into the class.\
> @returns A class decorator that registers the class as a transient in the
> container.

## @Scoped

Class decorator factory that registers the class as scoped within the container.

```typescript
function Scoped(
  id?: InjectionToken | Array<InjectionToken>,
  dependencies?: Array<InjectionToken>,
): ClassDecorator;
```

> @param id Optional token or array of dependencies to inject into the class.\
> @param dependencies Optional array of dependencies to inject into the class.\
> @returns A class decorator that registers the class as a scoped in the
> container.

### Example<!-- markdownlint-disable-line no-duplicate-heading -->

_Wrong way:_

```typescript
@Scoped()
class TestClass {}
const test = container.resolve(TestClass);
```

will throw an `UndefinedScopeError` because the resolve method has no scope to
resolve the instance of the object

_Correct way:_

```typescript
@Scoped()
class TestClass {}
const scope = container.createScope(); // Note the createScope call to create a scope for the resolution
const instance1 = container.resolve(TestClass, scope); // Note the scope passed to the resolution
```

## @AutoInjectable

```typescript
type IAutoInjectableOptions = {
  all?: Array<InjectionToken | InterfaceId>;
};

function AutoInjectable(
  dependencies?: Array<InjectionToken>,
  options?: IAutoInjectableOptions,
);
```

> @param dependencies Optional array of dependencies to inject into the class.\
> @returns A class decorator factory that replaces the decorated class
> constructor with a parameterless constructor that will resolve the
> dependencies automatically

### Example<!-- markdownlint-disable-line no-duplicate-heading -->

```typescript
class TestA {}
@AutoInjectable([TestA])
class TestB {
  constructor(
    public otherArg: string,
    public testA?: TestA, // In order to call new with only one param the injected param must be marked as optional
  ) {}
}
const testB = new TestB("test");
//testB.testA will be an instance of TestA
```

## @Inject

```typescript
function Inject(token: InjectionToken | Array<InjectionToken>);
```

> @param token The token or array of tokens to inject.\
> @returns A decorator function that injects the dependency.

### Example<!-- markdownlint-disable-line no-duplicate-heading -->

### Inject into a class field

```typescript
@Singleton()
class TestA {
  prop = "testA";
}

class TestB {
  @Inject(TestA)
  testA!: TestA;
}
// Will inject 'TestA' into the field 'testA'
```

### Inject into a class accessor

```typescript
@Singleton()
class TestA {
  prop = "testA";
}

class TestB {
  @Inject(TestA)
  accessor testA!: TestA;
}
// Will inject 'TestA' into the accessor.get 'testA'
```

### Inject into a class method

```typescript
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
// Will inject 'TestA' into the method 'doSomething'
```

### Inject into a class getter

```typescript
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
// Will inject 'TestA' into the getter 'testA'
```

## @InjectAll

```typescript
function InjectAll(token: InjectionToken | Array<InjectionToken>);
```

Works like the [@Inject](#inject) decorator but will solve all the registrations
of the token(s) and return array(s) of instance(s).

### Inject all instances into a class field

```typescript
class TestA {
  prop = "testA";
}
container.registerSingleton(TestA, TestA);
container.registerSingleton(TestA, TestA);

class TestB {
  @InjectAll(TestA)
  testA!: TestA[];
}
// Will inject 'TestA[]' into the field 'testA'
```
