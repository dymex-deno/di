import { Registration, RegistrationOptions } from "./registration.interface.ts";
import { InjectionToken } from "./injection-token.type.ts";
import { ConstructorType } from "./constructor.type.ts";
import { ScopeContext } from "../scope-context.ts";
import { TokenProvider } from "./providers/token-provider.ts";
import { Provider } from "./providers/provider.type.ts";
import { FactoryFunction } from "./providers/factory-provider.ts";
import { ClassProvider } from "./providers/class-provider.ts";

export interface IContainer extends AsyncDisposable {
  readonly scopes: Set<ScopeContext>;

  /**
   * Clears all instances from the container, disposing them if they
   * implement the `IAsyncDisposable` or `IDisposable` interface.
   *
   * This method is useful for testing, as it allows you to clear out
   * all instances from the container, so you can start from a clean
   * slate.
   *
   * @returns A promise that resolves when all instances have been
   * cleared.
   */
  clearInstances(): Promise<void>;

  /**
   * Creates a new child container.
   *
   * The child container will have a reference to the current container as its parent.
   * The child container is also stored in the current container, so it can be properly disposed when the parent container is disposed.
   *
   * @returns The new child container.
   */
  createChildContainer(): IContainer;

  /**
   * Creates a new scope.
   *
   * A scope is used to separate registrations into different groups.
   * Each scope has its own set of registrations, which are stored
   * in the scope's `services` property.
   *
   * @returns The new scope.
   */
  createScope(): ScopeContext;

  /**
   * Dispose a scope and it's contents
   * @param scope scope to be disposed
   */
  disposeScope(scope: ScopeContext): Promise<void>;

  //#region Register

  /**
   * Registers a provider in the container.
   * @param token The token to register the provider with.
   * @param provider The provider to register. This can be an instance of `Provider`, a class, or a constructor token.
   * @param options  Options for the registration. If not specified, the lifetime of the registration will be `Lifetime.Transient`. @see RegistrationOptions
   * @return The container used for the registration
   */
  register<T>(
    token: InjectionToken<T>,
    provider: Provider<T> | ConstructorType<T>,
    options?: RegistrationOptions,
  ): IContainer;

  /**
   * Registers a factory function with the specified token in the container.
   * The factory function will be called each time the token is resolved.
   * @param token The token to register the factory with.
   * @param factory The factory function to register.
   * @returns The container used for the registration.
   */
  registerFactory<T>(
    token: InjectionToken<T>,
    factory: FactoryFunction<T>,
  ): IContainer;

  /**
   * Registers an instance of a class with the specified token.
   * This registration is a singleton, meaning that the same instance
   * will be returned each time the token is resolved.
   * @param token The token to register the instance with.
   * @param instance The instance to register.
   * @returns The container used for the registration
   */
  registerInstance<T>(token: InjectionToken<T>, instance: T): IContainer;

  /**
   * Registe a registration object directly
   * @param token The token to register
   * @param registration The registration object
   * @return The container used for the registration
   */
  registerRegistration<T>(
    token: InjectionToken<T>,
    registration: Registration,
  ): IContainer;

  /**
   * Registers a class as a scoped in the container.
   * @param token The token to register the class with.
   * @param target The class to register.
   * @returns The container used for the registration.
   */
  registerScoped<T>(
    token: InjectionToken<T>,
    target: ConstructorType<T> | ClassProvider<T>,
  ): IContainer;

  /**
   * Registers a class as a singleton in the container.
   * @param token The token to register the class with.
   * @param target The class to register.
   * @returns The container used for the registration.
   */
  registerSingleton<T>(
    token: InjectionToken<T>,
    target: ConstructorType<T> | ClassProvider<T>,
  ): IContainer;

  /**
   * Registers a class as a transient in the container.
   * @param token The token to register the class with.
   * @param target The class to register.
   * @returns The container used for the registration.
   */
  registerTransient<T>(
    token: InjectionToken<T>,
    target: ConstructorType<T> | ClassProvider<T>,
  ): IContainer;

  /**
   * Registers a token to redirect to another token, 'to' must exist before registration
   * @param from The token to be registered
   * @param to The token to where the from token will redirect to
   * @return The container used for the registration
   */
  registerType<T>(
    from: InjectionToken<T>,
    to: InjectionToken<T> | TokenProvider<T>,
  ): IContainer;

  /**
   * Registers a value with the specified token in the container.
   * This registration is a singleton, meaning that the same value
   * will be returned each time the token is resolved.
   * @param token The token to register the value with.
   * @param value The value to register.
   * @returns The container used for the registration.
   */
  registerValue<T>(token: InjectionToken<T>, value: T): IContainer;

  /**
   * Removes all registrations that match the predicate from the container.
   * If no predicate is specified, all registrations are removed.
   * @param token The token to remove registrations from
   * @param predicate A function that takes a Registration and returns a boolean indicating whether the registration should be removed
   * @return The container used for the removal
   */
  removeRegistration<T>(
    token: InjectionToken<T>,
    predicate?: (registration: Registration<T>) => boolean,
  ): Promise<IContainer>;

  //#endregion Register

  /**
   * Resets the container by clearing all registrations and disposing all scopes.
   * This method is useful for testing, as it allows you to clear out all registrations
   * and scopes, so you can start from a clean slate.
   * @returns A promise that resolves when all registrations and scopes have been cleared.
   * NOTE: don't clean child containers
   */
  reset(): Promise<void>;

  //#region Resolve

  /**
   * Resolves the specified token to an instance.
   * If the token is already being resolved (i.e. a circular dependency is detected),
   * a proxy is returned instead.
   * @param token The token to resolve.
   * @param scope Optional scope to resolve the token in.
   * @returns The resolved instance.
   */
  resolve<T>(token: InjectionToken<T>, scope?: ScopeContext): T;

  /**
   * Resolves all instances of the specified token.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an array of resolved instances.
   * @param token The token to resolve.
   * @param scope Optional scope to resolve the token in.
   * @returns An array of resolved instances.
   */
  resolveAll<T>(token: InjectionToken<T>, scope?: ScopeContext): Array<T>;

  /**
   * Resolves all instances of the specified token asynchronously.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an array of resolved instances.
   * @param token The token to resolve.
   * @param scope Optional scope to resolve the token in.
   * @returns A promise that resolves with an array of resolved instances.
   */
  resolveAllAsync<T>(
    token: InjectionToken<T>,
    scope?: ScopeContext,
  ): Promise<Array<T>>;

  /**
   * Resolves the specified token asynchronously.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an instance of the type.
   * If the token is already being resolved (i.e. a circular dependency is detected),
   * a proxy is returned instead.
   * @param token The token to resolve.
   * @param scope Optional scope to resolve the token in.
   * @returns A promise that resolves with an instance of the type.
   */
  resolveAsync<T>(token: InjectionToken<T>, scope?: ScopeContext): Promise<T>;

  /**
   * Resolves the specified token with the given arguments.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an instance of the type.
   * @param token The token to resolve.
   * @param args Optional arguments to pass to the constructor.
   * @param scope Optional scope to resolve the token in.
   * @returns An instance of the type.
   */
  resolveWithArgs<T>(
    token: InjectionToken<T>,
    args?: Array<unknown>,
    scope?: ScopeContext,
  ): T;

  /**
   * Resolves the specified token with the given arguments asynchronously.
   * If the token is not registered, it will throw an error.
   * If the token is registered, it will return an instance of the type.
   * @param token The token to resolve.
   * @param args Optional arguments to pass to the constructor.
   * @param scope Optional scope to resolve the token in.
   * @returns A promise that resolves with an instance of the type.
   */
  resolveWithArgsAsync<T>(
    token: InjectionToken<T>,
    args?: Array<unknown>,
    scope?: ScopeContext,
  ): Promise<T>;

  //#endregion Resolve
}
