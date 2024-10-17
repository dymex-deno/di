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
  describe("async", () => {
    describe("scope", () => {
      test("dispose scope", async () => {
        const scope = container.createScope();
        assert.assertStrictEquals(container.scopes.size, 1);
        assert.assertInstanceOf(scope, ScopeContext);
        await container.disposeScope(scope);
        assert.assertStrictEquals(container.scopes.size, 0);
      });
      describe("Class provider", () => {
        test("should register and resolveAsync scoped correctly", async () => {
          class TestClass {
            public propertyA = "test";
          }
          const scope = container.createScope();
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Scoped,
          });
          const value = await container.resolveAsync(TestClass, scope);
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
          value.propertyA = "test2";
          const value2 = await container.resolveAsync(TestClass, scope);
          assert.assertInstanceOf(value2, TestClass);
          assert.assertStrictEquals(value2.propertyA, "test2");
        });
        test("should register and resolveAsync scoped diferent instances because scope is diferent", async () => {
          class TestClass {
            public propertyA = "test";
          }
          const scope = container.createScope();
          container.register(TestClass, TestClass, {
            lifetime: Lifetime.Scoped,
          });
          const value = await container.resolveAsync(TestClass, scope);
          assert.assertInstanceOf(value, TestClass);
          assert.assertStrictEquals(value.propertyA, "test");
          value.propertyA = "test2";
          const scope2 = container.createScope();
          const value2 = await container.resolveAsync(TestClass, scope2);
          assert.assertInstanceOf(value2, TestClass);
          assert.assertStrictEquals(value2.propertyA, "test");
        });
      });
      describe("other", () => {
        test("register constructor in scope", async () => {
          class Test {
            static [STATIC_INJECTION_LIFETIME] = Lifetime.Scoped;
          }
          const scope = container.createScope();
          const test = await container.resolveAsync(Test, scope);
          assert.assertInstanceOf(test, Test);
        });
        test("throw register constructor without scope", () => {
          class Test {
            static [STATIC_INJECTION_LIFETIME] = Lifetime.Scoped;
          }
          assert.assertRejects(
            () => container.resolveAsync(Test),
            UndefinedScopeError,
          );
        });
        test("register constructor in scope with decorator", async () => {
          @Scoped()
          class Test {}
          const scope = container.createScope();
          const test = await container.resolveAsync(Test, scope);
          assert.assertInstanceOf(test, Test);
        });
        test("throw register constructor without scope with decorator", () => {
          @Scoped()
          class Test {}
          assert.assertRejects(
            () => container.resolveAsync(Test),
            UndefinedScopeError,
          );
        });
      });
    });
  });
});
