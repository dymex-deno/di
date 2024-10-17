# Resolution

Process to resolve a token into an instance, resolving all the necessary
dependencies in between.

- [Resolution](#resolution)
  - [resolve](#resolve)
    - [Example](#example)
  - [resolveAll](#resolveall)
    - [Example](#example-1)
  - [resolveWithArgs](#resolvewithargs)
    - [Example](#example-2)

## resolve

The most common method to resolve an object is by using the `resolve()` method.

```typescript
resolve<T>(token: InjectionToken<T>, scope?: ScopeContext): T;
```

or

```typescript
resolveAsync<T>(token: InjectionToken<T>, scope?: ScopeContext): Promise<T>;
```

### Example

```typescript
const obj: TestClass = container.resolve(TestClass);
```

or

```typescript
const obj: TestClass = await container.resolveAsync<TestClass>("testClass");
```

## resolveAll

To resolve all instances registered for a token it's done using `resolveAll()`

```typescript
resolveAll<T>(token: InjectionToken<T>, scope?: ScopeContext): Array<T>;
```

or

```typescript
resolveAllAsync<T>(token: InjectionToken<T>, scope?: ScopeContext): Promise<Array<T>>;
```

### Example<!-- markdownlint-disable-line no-duplicate-heading -->

```typescript
const obj: TestClass[] = container.resolveAll(TestClass);
```

or

```typescript
const obj: TestClass[] = await container.resolveAllAsync<TestClass>(
  "testClass",
);
```

## resolveWithArgs

It's also possible to resolve objects with extra arguments, used when the
instance should be constructed with some arguments passed into the constructor
and some arguments injected.

This method is used with [@AutoInjectable](02-decorators.md##autoinjectable)
decorator

```typescript
resolveWithArgs<T>(token: InjectionToken<T>, args?: Array<unknown>, scope?: ScopeContext): T;
```

or

```typescript
resolveWithArgsAsync<T>(token: InjectionToken<T>, args?: Array<unknown>, scope?: ScopeContext): Promise<T>;
```

### Example<!-- markdownlint-disable-line no-duplicate-heading -->

```typescript
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
```

or

```typescript
class TestA {}
@AutoInjectable([TestA])
class TestB {
  constructor(
    public hello: string,
    public num: number,
    public a?: TestA,
  ) {}
}
const testB = await container.resolveWithArgsAsync(TestB, ["test", 1]);
```
