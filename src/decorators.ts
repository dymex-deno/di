import { container } from "./container.ts";
import { InvalidDecoratorError } from "./exceptions/InvalidDecoratorError.ts";
import { ScopeContext } from "./scope-context.ts";
import { ConstructorType } from "./types/constructor.type.ts";
import { InterfaceId, UnwrapDecoratorArgs } from "./types/decorators.type.ts";
import { InjectionToken } from "./types/injection-token.type.ts";
import { ProvidersType } from "./types/providers/provider.type.ts";
import { Lifetime, Registration } from "./types/registration.interface.ts";

const getRandomString = () => Math.random().toString(36).substring(2, 15);

/**
 * Creates a runtime identifier of an interface used for dependency injection.
 *
 * Every call to this function produces unique identifier, you can't call this method twice for the same Type!
 */
export const createInterfaceId = <T>(id: string): InterfaceId<T> =>
  `${id}-${getRandomString()}` as InterfaceId<T>;

/**
 * Decorator that registers a class as a singleton in the container.
 *
 * @param id Optional token or array of tokens to register the class with.
 * @param dependencies Optional array of dependencies to inject into the class.
 * @returns A class decorator that registers the class as a singleton in the container.
 */
// deno-lint-ignore no-explicit-any
export function Singleton<TDependencies extends Array<InjectionToken>, I = any>(
  id?: TDependencies extends Array<InterfaceId> ? InjectionToken
    : [...TDependencies] | InjectionToken,
  dependencies?: [...TDependencies],
): ClassDecorator {
  return function <
    T extends { new (...args: UnwrapDecoratorArgs<TDependencies>): I },
  >(target: T, context: ClassDecoratorContext) {
    if (context.kind === "class") {
      let token: InjectionToken<I> = target;
      if (Array.isArray(id)) {
        // If id is an array, use it as the dependencies
        dependencies = id as unknown as [...TDependencies];
      } else if (typeof id !== "undefined") {
        // If id is a token, use it as the registration token
        token = id as unknown as InjectionToken<I>;
      }
      // Register the class as a singleton in the container
      container.registerRegistration(
        target,
        createRegistration(target, Lifetime.Singleton, dependencies ?? []),
      );
      // If the registration token is different from the class itself, register the token as an alias
      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (token !== target) {
        container.registerType(token, { useToken: target });
      }
      return;
    }
    throw new InvalidDecoratorError("Singleton", context.name);
  } as ClassDecorator;
}

/**
 * Decorator that registers a class as a transient in the container.
 *
 * @param id Optional token or array of tokens to register the class with.
 * @param dependencies Optional array of dependencies to inject into the class.
 * @returns A class decorator that registers the class as a transient in the container.
 */
// deno-lint-ignore no-explicit-any
export function Transient<TDependencies extends Array<InjectionToken>, I = any>(
  id?: TDependencies extends Array<InterfaceId> ? InjectionToken
    : [...TDependencies] | InjectionToken,
  dependencies?: [...TDependencies],
): ClassDecorator {
  return function <
    T extends { new (...args: UnwrapDecoratorArgs<TDependencies>): I },
  >(target: T, context: ClassDecoratorContext) {
    if (context.kind === "class") {
      let token: InjectionToken<I> = target;
      if (Array.isArray(id)) {
        // If id is an array, use it as the dependencies
        dependencies = id as unknown as [...TDependencies];
      } else if (typeof id !== "undefined") {
        // If id is a token, use it as the registration token
        token = id as unknown as InjectionToken<I>;
      }
      // Register the class as a transient in the container
      container.registerRegistration(
        target,
        createRegistration(target, Lifetime.Transient, dependencies ?? []),
      );
      // If the registration token is different from the class itself, register the token as an alias
      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (token !== target) {
        container.registerType(token, { useToken: target });
      }
      return;
    }
    throw new InvalidDecoratorError("Transient", context.name);
  } as ClassDecorator;
}

/**
 * Decorator that registers a class as a scoped in the container.
 *
 * @param id Optional token or array of tokens to register the class with.
 * @param dependencies Optional array of dependencies to inject into the class.
 * @returns A class decorator that registers the class as a scoped in the container.
 */
// deno-lint-ignore no-explicit-any
export function Scoped<TDependencies extends Array<InjectionToken>, I = any>(
  id?: TDependencies extends Array<InterfaceId> ? InjectionToken
    : [...TDependencies] | InjectionToken,
  dependencies?: [...TDependencies],
): ClassDecorator {
  return function <
    T extends { new (...args: UnwrapDecoratorArgs<TDependencies>): I },
  >(target: T, context: ClassDecoratorContext) {
    if (context.kind === "class") {
      let token: InjectionToken<I> = target;
      if (Array.isArray(id)) {
        // If id is an array, use it as the dependencies
        dependencies = id as unknown as [...TDependencies];
      } else if (typeof id !== "undefined") {
        // If id is a token, use it as the registration token
        token = id as unknown as InjectionToken<I>;
      }
      // Register the class as a scoped in the container
      container.registerRegistration(
        target,
        createRegistration(target, Lifetime.Scoped, dependencies ?? []),
      );
      // If the registration token is different from the class itself, register the token as an alias
      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (token !== target) {
        container.registerType(token, { useToken: target });
      }
      return;
    }
    throw new InvalidDecoratorError("Scoped", context.name);
  } as ClassDecorator;
}

// deno-lint-ignore no-explicit-any
function createRegistration<T extends ConstructorType<any>>(
  target: T,
  lifetime: Lifetime,
  dependencies: Array<InjectionToken<unknown>>,
): Registration {
  return {
    provider: { useClass: target },
    providerType: ProvidersType.ClassProvider,
    options: { lifetime: lifetime },
    injections: dependencies,
  };
}

type IAutoInjectableOptions = {
  all?: Array<InjectionToken | InterfaceId>;
  scope?: ScopeContext;
};

/**
 * Class decorator that registers a class with the container and injects its dependencies.
 *
 * @param dependencies Optional array of dependencies to inject into the class.
 * @param options Optional options to customize the behavior of the decorator.
 * @returns A class decorator that registers the class with the container and injects its dependencies.
 */
export function AutoInjectable<
  TDependencies extends Array<InjectionToken>,
  // deno-lint-ignore no-explicit-any
  I = any,
>(
  dependencies?: [...TDependencies],
  options: IAutoInjectableOptions = {},
  // deno-lint-ignore no-explicit-any
): <T extends { new (...args: UnwrapDecoratorArgs<TDependencies> | any): I }>(
  target: T,
  context: ClassDecoratorContext,
) => T {
  /**
   * Registers a class with the container and injects its dependencies.
   *
   * @param target The class to register.
   * @param {kind} The kind of the target, which should be a class.
   * @returns The registered class.
   */
  return function <
    // deno-lint-ignore no-explicit-any
    T extends { new (...args: UnwrapDecoratorArgs<TDependencies> | any): I },
  >(target: T, context: ClassDecoratorContext) {
    if (context.kind === "class") {
      /**
       * Creates a new class that extends the target class and injects its dependencies.
       *
       * @private
       * @class
       * @extends {T}
       */
      // deno-lint-ignore no-explicit-any
      const aClass = class extends (target as ConstructorType<any>) {
        /**
         * Constructor that calls the target class constructor with the injected dependencies.
         *
         * @param {...any} args The arguments to pass to the target class constructor.
         */
        // deno-lint-ignore no-explicit-any
        constructor(...args: Array<any>) {
          // Calls the target class constructor with the injected dependencies
          super(
            ...args.concat(
              (dependencies ?? []).map((a) =>
                options.all?.includes(a)
                  ? container.resolveAll(a, options.scope)
                  : container.resolve(a, options.scope)
              ),
            ),
          );
        }
      } as T;
      // Registers the class with the container
      container.register(aClass, { useClass: aClass });
      // Registers an alias for the class with the target class
      container.registerType(target, { useToken: aClass });
      // Returns the registered class
      return aClass;
    }
    throw new InvalidDecoratorError("AutoInjectable", context.name);
  };
}

/**
 * Decorator that injects a dependency into a class.
 *
 * @param token The token or array of tokens to inject.
 * @returns A decorator function that injects the dependency.
 *
 * The decorator can be used in one of the following ways:
 * - In a field: The dependency is injected when the class is instantiated.
 * - In an accessor: The dependency is injected when the accessor is called.
 * - In a getter: The dependency is injected when the getter is called.
 * - In a method: The dependency is injected when the method is called.
 * @throws {InvalidDecoratorError} If the decorator is used in a context that is not one of the above.
 */
export function Inject(
  token: InjectionToken | Array<InjectionToken>,
  // deno-lint-ignore no-explicit-any
): (value: any, context: ClassMemberDecoratorContext) => any {
  return function DecoratorFn(
    // deno-lint-ignore no-explicit-any
    value: any,
    context: ClassMemberDecoratorContext,
    // deno-lint-ignore no-explicit-any
  ): any {
    switch (context.kind) {
      case "field":
        return function () {
          return Array.isArray(token)
            ? token.map((t) => container.resolve(t))
            : container.resolve(token);
        };
      case "accessor": {
        const instance = Array.isArray(token)
          ? token.map((t) => container.resolve(t))
          : container.resolve(token);
        return {
          get() {
            return instance;
          },
        };
      }
      case "method":
        // deno-lint-ignore no-explicit-any
        return function (this: any, ...args: Array<any>) {
          const instances = Array.isArray(token)
            ? token.map((t) => container.resolve(t))
            : [container.resolve(token)];
          const argsConcat = args.concat(instances);
          return value.apply(this, argsConcat);
        };
      case "getter":
        return function () {
          return Array.isArray(token)
            ? token.map((t) => container.resolve(t))
            : container.resolve(token);
        };
      default:
        throw new InvalidDecoratorError(
          "Inject",
          context.name,
          "can only be used in a field, accessor, getter or method",
        );
    }
  };
}

/**
 * Decorator that injects all instances of a token into a class.
 *
 * @param token The token or array of tokens to inject.
 * @returns A decorator function that injects the dependency.
 *
 * The decorator can be used in one of the following ways:
 * - In a field: The dependency is injected when the class is instantiated.
 * - In an accessor: The dependency is injected when the accessor is called.
 * - In a getter: The dependency is injected when the getter is called.
 * - In a method: The dependency is injected when the method is called.
 * @throws {InvalidDecoratorError} If the decorator is used in a context that is not one of the above.
 */
export function InjectAll(
  token: InjectionToken | Array<InjectionToken>,
  // deno-lint-ignore no-explicit-any
): (value: any, context: ClassMemberDecoratorContext) => any {
  return function DecoratorFn(
    // deno-lint-ignore no-explicit-any
    value: any,
    context: ClassMemberDecoratorContext,
    // deno-lint-ignore no-explicit-any
  ): any {
    switch (context.kind) {
      case "field":
        return function () {
          return Array.isArray(token)
            ? token.map((t) => container.resolveAll(t))
            : container.resolveAll(token);
        };
      case "accessor": {
        const instance = Array.isArray(token)
          ? token.map((t) => container.resolveAll(t))
          : container.resolveAll(token);
        return {
          get() {
            return instance;
          },
          init() {
            return instance;
          },
        };
      }
      case "method":
        // deno-lint-ignore no-explicit-any
        return function (this: any, ...args: Array<any>) {
          const instances = Array.isArray(token)
            ? token.map((t) => container.resolveAll(t))
            : [container.resolveAll(token)];
          const argsConcat = args.concat(instances);
          return value.apply(this, argsConcat);
        };
      case "getter":
        return function () {
          return Array.isArray(token)
            ? token.map((t) => container.resolveAll(t))
            : container.resolveAll(token);
        };
      default:
        throw new InvalidDecoratorError(
          "Inject",
          context.name,
          "can only be used in a field, accessor, getter or method",
        );
    }
  };
}
