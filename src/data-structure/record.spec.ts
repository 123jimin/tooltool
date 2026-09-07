import {assert} from "chai";

import {assertEqualType, type RecursivePartial} from "../type/index.ts";
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

            it("should ignore inherited values and getters", () => {
                const prototype = {
                    nested: {value: 42},
                    get secret(): number {
                        throw new Error("Inherited getter must not run");
                    },
                };
                const obj = Object.create(prototype) as Record<string, unknown>;

                assert.isUndefined(recordAccess(obj, "nested", "value")[0]);
                assert.isUndefined(recordAccess(obj, "secret")[0]);
                assert.isUndefined(recordAccess({}, "__proto__")[0]);
                assert.isUndefined(recordAccess({}, "constructor")[0]);
                assert.isUndefined(recordAccess({}, "toString")[0]);
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

                recordAccess<undefined>(obj, ["b"])[1]((void 0));
                assert.isUndefined(obj.b);
            });

            it("should create own paths without mutating inherited objects", () => {
                for(const key of ["__proto__", "constructor", "toString", "shared"]) {
                    const inherited = {nested: {value: 1}};
                    const prototype = {[key]: inherited};
                    const obj = Object.create(prototype) as Record<string, unknown>;
                    const [value, setValue] = recordAccess<number>(obj, key, "nested", "value");

                    assert.isUndefined(value);
                    setValue(2);

                    assert.isTrue(Object.hasOwn(obj, key));
                    assert.deepStrictEqual(obj[key], {nested: {value: 2}});
                    assert.deepStrictEqual(inherited, {nested: {value: 1}});
                    assert.strictEqual(Object.getPrototypeOf(obj), prototype);
                }
            });

            it("should write prototype-named leaf keys as own data properties", () => {
                for(const key of ["__proto__", "constructor", "toString"]) {
                    const obj: Record<string, unknown> = {};
                    const value = {safe: true};

                    recordAccess(obj, key)[1](value);

                    assert.isTrue(Object.hasOwn(obj, key));
                    assert.strictEqual(obj[key], value);
                    assert.strictEqual(Object.getPrototypeOf(obj), Object.prototype);
                }
            });

            it("should bypass inherited setters when creating leaf properties", () => {
                let inherited_value = 1;
                const prototype = {
                    set value(value: number) {
                        inherited_value = value;
                    },
                };
                const obj = Object.create(prototype) as Record<string, unknown>;

                recordAccess<number>(obj, "value")[1](2);

                assert.strictEqual(obj["value"], 2);
                assert.strictEqual(inherited_value, 1);
                assert.isTrue(Object.hasOwn(obj, "value"));
            });

            it("should traverse and update own prototype-named records", () => {
                const obj = {
                    ["__proto__"]: {value: 1},
                    constructor: {prototype: {value: 2}},
                };
                const [proto_value, setProtoValue] = recordAccess<number>(obj, "__proto__", "value");
                const [constructor_value, setConstructorValue] = recordAccess<number>(
                    obj, "constructor", "prototype", "value",
                );

                assert.strictEqual(proto_value, 1);
                assert.strictEqual(constructor_value, 2);
                setProtoValue(3);
                setConstructorValue(4);

                assert.strictEqual(obj["__proto__"].value, 3);
                assert.strictEqual(obj.constructor.prototype.value, 4);
                assert.strictEqual(Object.getPrototypeOf(obj), Object.prototype);
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
            const base = {a: 1, b: {c: 2}};
            const patch = {b: {d: 3}, e: 4};

            const result = recursiveMerge(base, patch);
            assertEqualType<typeof result.b.c, number>();
            assertEqualType<typeof result.b.d, number>();
            assertEqualType<typeof result.e, number>();
            assert.deepStrictEqual(result, {a: 1, b: {c: 2, d: 3}, e: 4});
        });

        it("should retain the base type and reference for nullish whole patches", () => {
            const base = {a: 1};
            const from_null = recursiveMerge(base, null);
            const from_undefined = recursiveMerge(base, (void 0));
            assertEqualType<typeof from_null, typeof base>();
            assertEqualType<typeof from_undefined, typeof base>();
            assert.strictEqual(from_null, base);
            assert.strictEqual(from_undefined, base);

            const merge = (patch: {extra: number} | null | undefined) => {
                const result = recursiveMerge(base, patch);
                assertEqualType<typeof result, typeof base | {a: number; extra: number}>();
                return result;
            };
            assert.strictEqual(merge(null), base);
            assert.strictEqual(merge((void 0)), base);
            assert.deepStrictEqual(merge({extra: 2}), {a: 1, extra: 2});
        });

        it("should overwrite primitive values in base with values from patch", () => {
            const base = {a: 1, b: "hello"};
            const patch = {a: "updated", b: false};
            const result = recursiveMerge(base, patch);
            assertEqualType<typeof result, {a: string; b: boolean}>();
            assert.deepStrictEqual(result, {a: "updated", b: false});
        });

        it("should overwrite arrays completely instead of merging them", () => {
            const base = {list: [1, 2, 3]};
            const patch = {list: ["replacement"]};
            const result = recursiveMerge(base, patch);
            assertEqualType<typeof result.list, string[]>();
            assert.deepStrictEqual(result, {list: ["replacement"]});
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
            const base = {a: 1, b: 2};
            const patch = {a: (void 0), b: 3, added: (void 0)};
            const result = recursiveMerge(base, patch);
            assertEqualType<typeof result.a, number>();
            assertEqualType<typeof result.added, undefined>();
            assert.deepStrictEqual(result, {a: 1, b: 3});
            assert.isFalse(Object.hasOwn(result, "added"));
        });

        it("should retain base values and make additions optional for optional patches", () => {
            const merge = (patch: {
                value?: string | undefined;
                added?: number | undefined;
                nested?: {added: number};
            }) => {
                const result = recursiveMerge({value: 1, nested: {kept: true}}, patch);
                assertEqualType<typeof result, {
                    value: number | string;
                    added?: number | undefined;
                    nested: {kept: boolean} | {kept: boolean; added: number};
                }>();
                return result;
            };
            assert.deepStrictEqual(merge({}), {value: 1, nested: {kept: true}});
            assert.deepStrictEqual(merge({value: (void 0), added: (void 0)}), {
                value: 1, nested: {kept: true},
            });
            assert.deepStrictEqual(merge({value: "updated", added: 2, nested: {added: 3}}), {
                value: "updated", added: 2, nested: {kept: true, added: 3},
            });
        });

        it("should treat required patch properties admitting undefined as conditional updates", () => {
            const merge = (patch: {value: string | undefined; added: number | undefined}) => {
                const result = recursiveMerge({value: 1}, patch);
                assertEqualType<typeof result, {value: number | string; added?: number | undefined}>();
                return result;
            };
            assert.deepStrictEqual(merge({value: (void 0), added: (void 0)}), {value: 1});
            assert.deepStrictEqual(merge({value: "updated", added: 2}), {value: "updated", added: 2});
        });

        it("should retain possible base values for sparse dictionary patches", () => {
            const merge = (patch: Record<string, string>) => {
                const result = recursiveMerge({value: 1}, patch);
                assertEqualType<typeof result.value, number | string>();
                return result;
            };
            assert.deepStrictEqual(merge({}), {value: 1});
            assert.deepStrictEqual(merge({value: "updated"}), {value: "updated"});

            const base: Record<string, number> = {kept: 1};
            const result = recursiveMerge(base, {added: "new"});
            const indexed = result["kept"];
            assertEqualType<typeof result.added, string>();
            assertEqualType<typeof indexed, number | string | undefined>();
            assert.strictEqual(indexed, 1);
            assert.strictEqual(result.added, "new");
        });

        it("should make an optional base property required when the patch defines it", () => {
            const base: {value?: number} = {};
            const result = recursiveMerge(base, {value: "defined"});
            assertEqualType<typeof result, {value: string}>();
            assert.deepStrictEqual(result, {value: "defined"});
        });

        it("should retain required base members under recursive partial updates", () => {
            const base = {a: 1, nested: {kept: true, changed: 2}};
            const merge = (patch: RecursivePartial<typeof base>) => {
                const result = recursiveMerge<typeof base>(base, patch);
                assertEqualType<typeof result, typeof base>();
                return result;
            };
            assert.deepStrictEqual(merge({nested: {changed: 3}}), {
                a: 1, nested: {kept: true, changed: 3},
            });
        });

        it("should overwrite properties with null if set to null in patch", () => {
            const base = {a: 1, b: 2};
            const patch = {a: null};
            const result = recursiveMerge(base, patch);
            assertEqualType<typeof result.a, null>();
            assert.deepStrictEqual(result, {a: null, b: 2});
        });

        it("should not mutate the original base or patch objects", () => {
            const base: Record<string, unknown> = {nested: {a: 1}};
            const patch: Record<string, unknown> = {nested: {b: 2}};

            recursiveMerge(base, patch);

            assert.deepStrictEqual(base, {nested: {a: 1}}, "Base should remain unchanged");
            assert.deepStrictEqual(patch, {nested: {b: 2}}, "Patch should remain unchanged");
        });

        it("should share untouched branches and replacement arrays while copying merged branches", () => {
            const base = {
                stable: {value: 1},
                nested: {left: 1, right: 2},
                list: [1, 2],
            };
            const patch = {nested: {right: 3}, list: [4, 5]};

            const result = recursiveMerge(base, patch);

            assert.strictEqual(result.stable, base.stable);
            assert.strictEqual(result.list, patch.list);
            assert.notStrictEqual(result.nested, base.nested);
            assert.notStrictEqual(result.nested, patch.nested);
            assert.deepStrictEqual(result.nested, {left: 1, right: 3});
        });

        it("should preserve prototype-named patch keys as own data properties", () => {
            const base: Record<string, unknown> = {keep: 1};
            const patch = {
                ["__proto__"]: {injected: true},
                constructor: {prototype: {value: 2}},
                toString: "literal",
            };

            const result = recursiveMerge(base, patch);

            assert.isTrue(Object.hasOwn(result, "__proto__"));
            assert.isTrue(Object.hasOwn(result, "constructor"));
            assert.isTrue(Object.hasOwn(result, "toString"));
            assert.strictEqual(result["__proto__"], patch["__proto__"]);
            assert.strictEqual(result["constructor"], patch.constructor);
            assert.strictEqual(result["toString"], "literal");
            assert.isUndefined(result["injected"]);
            assert.deepStrictEqual(base, {keep: 1});
        });

        it("should recursively merge own __proto__ records without mutating either input", () => {
            const base = {["__proto__"]: {keep: 1, change: 1}};
            const patch = {["__proto__"]: {change: 2}};

            const result = recursiveMerge(base, patch);

            assert.isTrue(Object.hasOwn(result, "__proto__"));
            assert.deepStrictEqual(result["__proto__"], {keep: 1, change: 2});
            assert.deepStrictEqual(base["__proto__"], {keep: 1, change: 1});
            assert.deepStrictEqual(patch["__proto__"], {change: 2});
        });

        it("should replace custom-prototype roots instead of traversing their inherited members", () => {
            const base = Object.create({inherited_base: {value: 1}}) as Record<string, unknown>;
            base["keep"] = 2;
            const patch = Object.create({inherited_patch: {value: 3}}) as Record<string, unknown>;
            patch["added"] = 4;

            const result = recursiveMerge(base, patch);

            assert.strictEqual(result, patch);
            assert.isFalse(Object.hasOwn(result, "keep"));
            assert.isFalse(Object.hasOwn(result, "inherited_patch"));
            assert.strictEqual(base["keep"], 2);
        });

        it("should merge null-prototype records at roots and nested branches", () => {
            const base = Object.assign(Object.create(null) as Record<string, unknown>, {
                keep: 1,
                nested: Object.assign(Object.create(null) as Record<string, unknown>, {left: 2}),
                ["__proto__"]: {left: 3},
            });
            const patch = Object.assign(Object.create(null) as Record<string, unknown>, {
                nested: {right: 4},
                ["__proto__"]: {right: 5},
                constructor: "own constructor",
                toString: "own string",
            });

            const result = recursiveMerge(base, patch);

            assert.deepStrictEqual(result, {
                keep: 1,
                nested: {left: 2, right: 4},
                ["__proto__"]: {left: 3, right: 5},
                constructor: "own constructor",
                toString: "own string",
            });
            assert.strictEqual(Object.getPrototypeOf(result), Object.prototype);
            assert.strictEqual(Object.getPrototypeOf(base), null);
            assert.strictEqual(Object.getPrototypeOf(patch), null);
            assert.deepStrictEqual(base["__proto__"], {left: 3});
            assert.deepStrictEqual(patch["__proto__"], {right: 5});
            assert.isTrue(Object.hasOwn(result, "__proto__"));
        });

        it("should preserve replacement Date values when merging existing Dates", () => {
            const base = {updated_at: new Date("2020-01-01T00:00:00.000Z")};
            const patch = {updated_at: new Date("2025-06-15T12:30:00.000Z")};

            const result = recursiveMerge(base, patch);

            assertEqualType<typeof result.updated_at, Date>();
            assert.strictEqual(result.updated_at, patch.updated_at);
            assert.instanceOf(result.updated_at, Date);
            assert.strictEqual(result.updated_at.getTime(), patch.updated_at.getTime());
            assert.strictEqual(base.updated_at.toISOString(), "2020-01-01T00:00:00.000Z");
        });

        it("should preserve atomic types and replacement references at roots and nested branches", () => {
            const readonly_map: ReadonlyMap<string, {value: number}> = new Map([["entry", {value: 1}]]);
            const readonly_set: ReadonlySet<{value: number}> = new Set([{value: 2}]);
            const patch = {
                date: new Date("2025-06-15T12:30:00.000Z"),
                regexp: /replacement/u,
                map: new Map([["entry", {value: 3}]]),
                readonly_map,
                set: new Set([{value: 4}]),
                readonly_set,
                callable: (value: number) => value + 1,
                array: [1, 2],
            };
            const result = recursiveMerge({
                date: {old: true},
                regexp: {old: true},
                map: {old: true},
                readonly_map: {old: true},
                set: {old: true},
                readonly_set: {old: true},
                callable: {old: true},
                array: {old: true},
            }, patch);
            assertEqualType<typeof result, typeof patch>();
            assert.strictEqual(result.map.get("entry")?.value, 3);
            assert.strictEqual(result.readonly_map.get("entry")?.value, 1);
            assert.isTrue(result.regexp.test("replacement"));
            assert.strictEqual(result.callable(2), 3);

            for(const replacement of Object.values(patch)) {
                const root = recursiveMerge({kept: true}, replacement);
                assertEqualType<typeof root, typeof replacement>();
                assert.strictEqual(root, replacement);
                assert.strictEqual(
                    recursiveMerge({value: {kept: true}}, {value: replacement}).value,
                    replacement,
                );
                const record = {added: true};
                const replaced = recursiveMerge({value: replacement}, {value: record});
                assertEqualType<typeof replaced.value, typeof record>();
                assert.strictEqual(replaced.value, record);
                // Root bases use the existing record-indexed signature, including for instances.
                const indexed_base = replacement as typeof replacement & Record<string, unknown>;
                const replaced_root = recursiveMerge(indexed_base, record);
                assertEqualType<typeof replaced_root, typeof record>();
                assert.strictEqual(replaced_root, record);
                assert.strictEqual(recursiveMerge(indexed_base, null), indexed_base);
            }
        });

        it("should retain optional atomic union members without merging their instance properties", () => {
            const base = {nested: {value: new Date("2020-01-01T00:00:00.000Z"), kept: true}};
            const merge = (patch: {nested?: {value?: Map<string, number>|Date|null}}) => {
                const result = recursiveMerge(base, patch);
                assertEqualType<typeof result.nested, {
                    value: Date|Map<string, number>|null;
                    kept: boolean;
                }>();
                return result;
            };
            const map = new Map([["entry", 2]]);
            assert.strictEqual(merge({}).nested, base.nested);
            assert.strictEqual(merge({nested: {}}).nested.value, base.nested.value);
            assert.strictEqual(merge({nested: {value: map}}).nested.value, map);
            assert.isNull(merge({nested: {value: null}}).nested.value);
        });

        it("should replace class instances and keep their methods callable", () => {
            class State {
                [key: string]: unknown;
                readonly value: number;
                constructor(value: number) { this.value = value; }
                read(): number { return this.value; }
            }
            const base = new State(1);
            const patch = new State(2);
            const record = {added: true};

            assert.strictEqual(recursiveMerge(base, patch), patch);
            // Custom-class result types are structural; verify their runtime replacement identity.
            assert.strictEqual<unknown>(recursiveMerge(record, patch), patch);
            assert.strictEqual(recursiveMerge(base, record), record);
            assert.strictEqual(recursiveMerge(base, null), base);
            const result = recursiveMerge({value: base}, {value: patch});
            assertEqualType<typeof result.value.read, () => number>();
            assert.strictEqual(result.value, patch);
            assert.strictEqual(result.value.read(), 2);
            assert.strictEqual<unknown>(recursiveMerge({value: record}, {value: patch}).value, patch);
            assert.strictEqual(recursiveMerge({value: base}, {value: record}).value, record);
            assert.strictEqual(base.read(), 1);
        });

        it("should handle disjoint keys correctly", () => {
            const base = {a: 1};
            const patch = {b: 2};

            const result = recursiveMerge(base, patch);
            assertEqualType<typeof result, {a: number; b: number}>();
            assert.deepStrictEqual(result, {a: 1, b: 2});
        });

        context("when a record patch replaces a non-record value", () => {
            it("should replace a primitive base value with the patch record", () => {
                const result = recursiveMerge(
                    {sub: 42},
                    {sub: {y: 2}},
                );
                assertEqualType<typeof result.sub, {y: number}>();
                assert.deepStrictEqual(result["sub"], {y: 2});
            });

            it("should replace a base array with the patch record", () => {
                const result = recursiveMerge(
                    {sub: [1, 2, 3]},
                    {sub: {y: 2}},
                );
                assertEqualType<typeof result.sub, {y: number}>();
                assert.deepStrictEqual(result, {sub: {y: 2}});
            });
        });
    });
});
