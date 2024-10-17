# Register

For using the resolving capabilities of the container first the things have to
be registered, to achieve this, there are multiple ways.

By using the decorators [@Singleton](02-decorators.md##singleton),
[@Transient](02-decorators.md##transient) or [@Scoped](02-decorators.md##scoped)
that will automatically register the classes, or by using some of the next
methods available in the container.

- [Register](#register)
  - [registerSingleton](#registersingleton)
  - [registerTransient](#registertransient)
  - [registerScoped](#registerscoped)
  - [registerFactory](#registerfactory)
  - [registerInstance](#registerinstance)
  - [registerType](#registertype)
  - [registerValue](#registervalue)
  - [register](#register-1)
  - [registerRegistration](#registerregistration)
  - [removeRegistration](#removeregistration)

## registerSingleton

Helper to register a singleton class in the container

```typescript
registerSingleton<T>(token: InjectionToken<T>, target: ConstructorType<T> | ClassProvider<T>): IContainer;
```

## registerTransient

Heper to register a transient class in the container

```typescript
registerTransient<T>(token: InjectionToken<T>, target: ConstructorType<T> | ClassProvider<T>): IContainer;
```

## registerScoped

Helper to register a scoped class in the container

```typescript
registerScoped<T>(token: InjectionToken<T>, target: ConstructorType<T> | ClassProvider<T>): IContainer;
```

## registerFactory

Helper to register a factory in the container

```typescript
registerFactory<T>(token: InjectionToken<T>, factory: FactoryFunction<T>): IContainer;
```

## registerInstance

Helper to register an instance in the container, the instance will be registered
as a [Value Provider](03-container.md#value-provider)

```typescript
registerInstance<T>(token: InjectionToken<T>, instance: T): IContainer;
```

## registerType

Helper to register a redirect or alias in the container see
[Token Provider](03-container.md#token-provider)

```typescript
registerType<T>(from: InjectionToken<T>, to: InjectionToken<T> | TokenProvider<T>): IContainer;
```

## registerValue

Helper to register a value in the container, see
[Value Provider](03-container.md#value-provider)

```typescript
registerValue<T>(token: InjectionToken<T>, value: T): IContainer;
```

## register

Register something in the container

```typescript
register<T>(
  token: InjectionToken<T>,
  provider: Provider<T> | ConstructorType<T>,
  options?: RegistrationOptions,
): IContainer;
```

```typescript
type RegistrationOptions = {
  lifetime: Lifetime;
};
```

## registerRegistration

Helper to directly register a registration in the container

```typescript
registerRegistration<T>(token: InjectionToken<T>, registration: Registration<T>): IContainer;
```

```typescript
export interface Registration<T> {
  providerType: ProvidersType;
  provider: Provider<T>;
  instance?: T;
  options: RegistrationOptions;
  injections: Array<InjectionToken>;
}
enum ProvidersType {
  ValueProvider,
  ClassProvider,
  FactoryProvider,
  ConstructorProvider,
  TokenProvider,
}
```

## removeRegistration

It's also possible to remove a specific registration or a group of registrations
associated with a token

```typescript
removeRegistration<T>(
  token: InjectionToken<T>,
  predicate?: (registration: Registration<T>) => boolean,
): Promise<IContainer>;
```

This function is only async because the instances of the registrations, if any,
can be disposed with `AsyncDispose`
