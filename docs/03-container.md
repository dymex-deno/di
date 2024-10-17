# Container

The container is the place where the dependencies are registered and latter will
be resolved, for this you give a token to the container and after all the
resolutions necessary the container will return the required object instance.

The decorators [@Singleton](02-decorators.md#singleton),
[@Transient](02-decorators.md##transient) and
[@Scoped](02-decorators.md##scoped) will auto-register the classes where they're
being called into the container.

<!-- TOC depthFrom:1 depthTo:3 -->

- [Container](#container)
  - [InjectionToken](#injectiontoken)
    - [Token](#token)
  - [Providers](#providers)
    - [Class Provider](#class-provider)
    - [Value Provider](#value-provider)
    - [Factory Provider](#factory-provider)
    - [Token Provider](#token-provider)

<!-- /TOC -->

Registrations take the form of Token/Provider pair.

## InjectionToken

A token may be either a string, a symbol, a class constructor, a `Token` or an
`InterfaceId`

```typescript
type InjectionToken<T = any> =
  | string
  | symbol
  | ConstructorType<T>
  | Token
  | InterfaceId<T>;
```

### Token

The `Token` object is just an helper class to allow for type-safe access to a
registration in the container.

```typescript
//File: jwt.secret.ts
import { container, Token } from "@dymexjs/di";

export const JWT_SECRET = new Token("jwt_secret");
container.registerValue(JWT_SECRET, "my secure secret");

/**
 * Somewhere else in the code you import the token and resolve the value from the container
 */
// File: resolution.ts
import { container } from "@dymexjs/di";
import { JWT_SECRET } from "./jwt.secret";

let secret = container.resolve(JWT_SECRET);
// secret = "my secure secret"
```

The `InterfaceId` is a special object to allow for the registration of
interfaces, and must be create with `createInterfaceId()`

```typescript
interface SA {}
const SA = createInterfaceId<SA>("SA"); // the const variable and the interface should have the same name

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
// 'b' will be an instance of ServiceB, resolved trough the interface
```

For more examples see `tests/sync/decorators.test.ts` or
`tests/async/decorators.test.ts`) -> `Interface Decorators`

## Providers

The container uses the providers to register information needed to resolve an
instance for a given token.

### Class Provider

```typescript
{
  token: InjectionToken<T>;
  useClass: ConstructorType<T>;
}
```

This provider is used to resolve classes by their constructor.

```typescript
type ConstructorType<T> = new (...args: Array<any>) => T;
```

### Value Provider

```typescript
{
  token: InjectionToken<T>,
  useValue: T
}
```

This provider is used to resolve a value in the container, this value can be a
constant or an instance that as been instantiated in a particular way.

### Factory Provider

```typescript
{
  token: InjectionToken<T>,
  useFactory: FactoryFunction<T>
}
```

This provider is used to resolve a token given a factory function. The factory
function has access to the container.

```typescript
type FactoryFunction<T> = (container: IContainer) => T | Promise<T>;
```

### Token Provider

```typescript
{
  token: InjectionToken<T>,
  useToken: InjectionToken<T>
}
```

This provider acts like a redirect or an alias, given token 'x' it will resolve
instance for token 'y'.
