import {assert} from "chai";
import {recordAccess, recursiveMerge} from "./record.ts";

describe("data-structure/record", () => {
    describe("recordAccess", () => {
        describe("getting values", () => {
            it("should work as advertised", () => {
                const obj = {a: {b: {c: 42}}};
                const [value, setValue] = recordAccess<number>(obj, ["a", "b", "c"]);
                assert.strictEqual(value, 42);
                setValue(100);
                assert.strictEqual(obj.a.b.c, 100);
            });

            it("should return value at single-level path", () => {
                const obj = {foo: "bar"};
                const [value] = recordAccess<string>(obj, ["foo"]);
                assert.strictEqual(value, "bar");
            });

            it("should return value at deeply nested path", () => {
                const obj = {a: {b: {c: {d: {e: 123}}}}};
                const [value] = recordAccess<number>(obj, ["a", "b", "c", "d", "e"]);
                assert.strictEqual(value, 123);
            });

            it("should return undefined for non-existent path", () => {
                const obj = {a: {b: 1}};
                const [value] = recordAccess<number>(obj, ["a", "c"]);
                assert.isUndefined(value);
            });

            it("should return undefined for path through non-object", () => {
                const obj = {a: 42};
                const [value] = recordAccess<number>(obj, ["a", "b"]);
                assert.isUndefined(value);
            });

            it("should return the root object for empty path", () => {
                const obj = {a: 1};
                const [value] = recordAccess<Record<string, unknown>>(obj, []);
                assert.strictEqual(value, obj);
            });

            it("should handle various value types", () => {
                const obj = {
                    str: "hello",
                    num: 42,
                    bool: true,
                    arr: [1, 2, 3],
                    obj: {x: 1},
                    nil: null,
                };

                assert.strictEqual(recordAccess<string>(obj, ["str"])[0], "hello");
                assert.strictEqual(recordAccess<number>(obj, ["num"])[0], 42);
                assert.strictEqual(recordAccess<boolean>(obj, ["bool"])[0], true);
                assert.deepStrictEqual(recordAccess<number[]>(obj, ["arr"])[0], [1, 2, 3]);
                assert.deepStrictEqual(recordAccess<{x: number}>(obj, ["obj"])[0], {x: 1});
                assert.isNull(recordAccess<null>(obj, ["nil"])[0]);
            });
        });

        describe("setting values", () => {
            it("should set value at existing path", () => {
                const obj = {a: {b: 1}};
                const [, setValue] = recordAccess<number>(obj, ["a", "b"]);
                setValue(99);
                assert.strictEqual(obj.a.b, 99);
            });

            it("should create intermediate objects for non-existent path", () => {
                const obj: Record<string, unknown> = {};
                const [, setValue] = recordAccess<number>(obj, ["a", "b", "c"]);
                setValue(42);
                assert.deepStrictEqual(obj, {a: {b: {c: 42}}});
            });

            it("should set value at single-level path", () => {
                const obj: {foo?: "bar"} = {};
                const [, setValue] = recordAccess<string>(obj, ["foo"]);
                setValue("bar");
                assert.strictEqual(obj.foo, "bar");
            });

            it("should overwrite existing value", () => {
                const obj ={x: "old"};
                const [oldValue, setValue] = recordAccess<string>(obj, ["x"]);
                assert.strictEqual(oldValue, "old");
                setValue("new");
                assert.strictEqual(obj.x, "new");
            });

            it("should create path partially when some intermediate objects exist", () => {
                const obj: Record<string, unknown> = {a: {existing: true}};
                const [, setValue] = recordAccess<number>(obj, ["a", "b", "c"]);
                setValue(123);
                assert.deepStrictEqual(obj, {a: {existing: true, b: {c: 123}}});
            });

            it("should allow multiple setValue calls", () => {
                const obj: {x?: number} = {};
                const [, setValue] = recordAccess<number>(obj, ["x"]);
                setValue(1);
                assert.strictEqual(obj.x, 1);
                setValue(2);
                assert.strictEqual(obj.x, 2);
            });

            it("should handle setting array values", () => {
                const obj: {data?: number[]} = {};
                const [, setValue] = recordAccess<number[]>(obj, ["data"]);
                setValue([1, 2, 3]);
                assert.deepStrictEqual(obj.data, [1, 2, 3]);
            });

            it("should handle setting object values", () => {
                const obj: {config?: unknown} = {};
                const [, setValue] = recordAccess<{nested: boolean}>(obj, ["config"]);
                setValue({nested: true});
                assert.deepStrictEqual(obj.config, {nested: true});
            });

            it("should handle setting null and undefined", () => {
                const obj = {a: 1, b: 2};

                recordAccess<null>(obj, ["a"])[1](null);
                assert.isNull(obj.a);

                recordAccess<undefined>(obj, ["b"])[1](undefined);
                assert.isUndefined(obj.b);
            });
        });

        describe("edge cases", () => {
            it("should handle path with special characters in keys", () => {
                const obj: Record<string, unknown> = {"key.with.dots": {"key with spaces": 42}};
                const [value, setValue] = recordAccess<number>(obj, ["key.with.dots", "key with spaces"]);
                assert.strictEqual(value, 42);
                setValue(100);
                assert.strictEqual((obj["key.with.dots"] as Record<string, unknown>)["key with spaces"], 100);
            });

            it("should handle empty string as key", () => {
                const obj: Record<string, unknown> = {"": {"": "nested empty"}};
                const [value] = recordAccess<string>(obj, ["", ""]);
                assert.strictEqual(value, "nested empty");
            });

            it("should not modify original object when only reading", () => {
                const obj = {a: {b: 1}};
                const original = JSON.stringify(obj);
                recordAccess<number>(obj, ["a", "b"]);
                recordAccess<number>(obj, ["x", "y", "z"]);
                assert.strictEqual(JSON.stringify(obj), original);
            });

            it("should handle path through null value", () => {
                const obj: Record<string, unknown> = {a: null};
                const [value] = recordAccess<number>(obj, ["a", "b"]);
                assert.isUndefined(value);
            });

            it("should handle path through array", () => {
                const obj: Record<string, unknown> = {a: [1, 2, 3]};
                const [value] = recordAccess<number>(obj, ["a", "1"]);
                assert.strictEqual(value, 2);
            });
        });
    });

    describe("recursiveMerge", () => {
        it("should work as advertised", () => {
            const base: Record<string, unknown> = {a: 1, b: {c: 2}};
            const patch: Record<string, unknown> = {b: {d: 3}, e: 4};

            const result = recursiveMerge(base, patch);
            assert.deepStrictEqual(result, {a: 1, b: {c: 2, d: 3}, e: 4});
        });

        it("should return the base object reference if patch is null or undefined", () => {
            const base = {a: 1};
            assert.strictEqual(recursiveMerge(base, undefined), base);
            assert.strictEqual(recursiveMerge(base, null), base);
        });

        it("should overwrite primitive values in base with values from patch", () => {
            const base = {a: 1, b: "hello"};
            const patch = {a: 2, b: "world"};
            const result = recursiveMerge(base, patch);
            assert.deepStrictEqual(result, {a: 2, b: "world"});
        });

        it("should overwrite arrays completely instead of merging them", () => {
            const base = {list: [1, 2, 3]};
            const patch = {list: [4, 5]};
            const result = recursiveMerge(base, patch);
            assert.deepStrictEqual(result, {list: [4, 5]});
        });

        it("should merge nested objects recursively", () => {
            const base = {
                user: {
                    name: "User",
                    settings: {theme: "dark", notifications: true},
                },
            };
            const patch = {
                user: {
                    settings: {notifications: false},
                },
            };
            const result = recursiveMerge(base, patch);

            assert.deepStrictEqual(result, {
                user: {
                    name: "User",
                    settings: {theme: "dark", notifications: false},
                },
            });
        });

        it("should ignore properties explicitly set to undefined in patch", () => {
            const base: Record<string, unknown> = {a: 1, b: 2};
            const patch: Record<string, unknown> = {a: undefined, b: 3};
            const result = recursiveMerge(base, patch);
            assert.deepStrictEqual(result, {a: 1, b: 3});
        });

        it("should overwrite properties with null if set to null in patch", () => {
            const base: {a: number | null; b: number} = {a: 1, b: 2};
            const patch = {a: null};
            const result = recursiveMerge(base, patch);
            assert.deepStrictEqual(result, {a: null, b: 2});
        });

        it("should not mutate the original base or patch objects", () => {
            const base: Record<string, unknown> = {nested: {a: 1}};
            const patch: Record<string, unknown> = {nested: {b: 2}};

            recursiveMerge(base, patch);

            assert.deepStrictEqual(base, {nested: {a: 1}}, "Base should remain unchanged");
            assert.deepStrictEqual(patch, {nested: {b: 2}}, "Patch should remain unchanged");
        });

        it("should handle disjoint keys correctly", () => {
            const base: Record<string, unknown> = {a: 1};
            const patch: Record<string, unknown> = {b: 2};

            const result = recursiveMerge(base, patch);
            assert.deepStrictEqual(result, {a: 1, b: 2});
        });
    });
});
