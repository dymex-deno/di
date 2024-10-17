import { beforeEach, describe, test } from "jsr:@std/testing/bdd";
import { container } from "../../src/container.ts";
import { Lifetime } from "../../src/types/registration.interface.ts";
import { STATIC_INJECTION_LIFETIME } from "../../src/constants.ts";
import { UndefinedScopeError } from "../../src/exceptions/UndefinedScopeError.ts";
import { ScopeContext } from "../../src/scope-context.ts";
import { Scoped } from "../../src/decorators.ts";
import * as assert from "jsr:@std/assert";

describe("Dymexjs_DI", () => {
  beforeEach(async () => await container.reset());
  describe("sync", () => {
    describe("scope", () => {
      test("create scope", () => {
        assert.assertInstanceOf(container.createScope(), ScopeContext);
        assert.assertStrictEquals(container.scopes.size, 1);
      });
      describe("Class provider", () => {
        test("should register and resolve scoped correctly", () => {
          class TestClass {
            public propertyA = "test";
          }
          const scope = container.createScope();
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Scoped,
          });
          const value = container.resolve(TestClass, scope);
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
          value.propertyA = "test2";
          const value2 = container.resolve(TestClass, scope);
          assert.assertInstanceOf(value2, TestClass);
          assert.assertStrictEquals(value2.propertyA, "test2");
        });
        test("should register and resolve scoped diferent instances because scope is diferent", () => {
          class TestClass {
            public propertyA = "test";
          }
          const scope = container.createScope();
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Scoped,
          });
          const value = container.resolve(TestClass, scope);
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
          value.propertyA = "test2";
          const scope2 = container.createScope();
          const value2 = container.resolve(TestClass, scope2);
          assert.assertInstanceOf(value2, TestClass);
          assert.assertStrictEquals(value2.propertyA, "test");
        });
      });
      describe("other", () => {
        test("register constructor in scope", () => {
          class Test {
            static [STATIC_INJECTION_LIFETIME] = Lifetime.Scoped;
          }
          const scope = container.createScope();
          const test = container.resolve(Test, scope);
          assert.assertInstanceOf(test, Test);
        });
        test("throw register constructor without scope", () => {
          class Test {
            static [STATIC_INJECTION_LIFETIME] = Lifetime.Scoped;
          }
          assert.assertThrows(
            () => container.resolve(Test),
            UndefinedScopeError,
          );
        });
        test("register constructor in scope with decorator", () => {
          @Scoped()
          class Test {}
          const scope = container.createScope();
          const test = container.resolve(Test, scope);
          assert.assertInstanceOf(test, Test);
        });
        test("throw register constructor without scope with decorator", () => {
          @Scoped()
          class Test {}
          assert.assertThrows(
            () => container.resolve(Test),
            UndefinedScopeError,
          );
        });
      });
    });
  });
});
