import {assert} from "chai";

import {applyTransforms, applyAsyncTransforms} from "./transform.ts";
import {sleep} from "./basic.ts";

describe("applyTransforms", () => {
    it("should return original value when no transforms are provided", () => {
        const obj = {count: 1};
        const result = applyTransforms(obj);
        assert.deepEqual(result, {count: 1});
        assert.equal(result, obj);
    });

    it("should apply a single pure transformation", () => {
        const result = applyTransforms(
            {count: 1},
            (obj) => ({...obj, count: obj.count + 1}),
        );
        assert.deepEqual(result, {count: 2});
    });

    it("should apply a single impure transformation", () => {
        const obj = {count: 1};
        const result = applyTransforms(
            obj,
            (o) => { o.count += 1; },
        );
        assert.deepEqual(result, {count: 2});
        assert.equal(result, obj);
    });

    it("should apply multiple pure transformations in order", () => {
        const result = applyTransforms<{count: number; doubled?: number}>(
            {count: 1},
            (obj) => ({...obj, count: obj.count + 1}),
            (obj) => ({...obj, doubled: obj.count * 2}),
        );
        assert.deepEqual(result, {count: 2, doubled: 4});
    });

    it("should apply multiple impure transformations in order", () => {
        const result = applyTransforms<{count: number; doubled?: number}>(
            {count: 1},
            (obj) => { obj.count += 1; },
            (obj) => { obj.doubled = obj.count * 2; },
        );
        assert.deepEqual(result, {count: 2, doubled: 4});
    });

    it("should handle mixed pure and impure transformations", () => {
        const result = applyTransforms<{count: number; tripled?: number}>(
            {count: 1},
            (obj) => ({...obj, count: obj.count + 1}),
            (obj) => { obj.count += 1; },
            (obj) => ({...obj, tripled: obj.count * 3}),
        );
        assert.deepEqual(result, {count: 3, tripled: 9});
    });

    it("should flatten nested arrays of transforms", () => {
        const result = applyTransforms<{count: number; doubled?: number}>(
            {count: 1},
            [(obj) => ({...obj, count: obj.count + 1})],
            [[(obj) => ({...obj, doubled: obj.count * 2})]],
        );
        assert.deepEqual(result, {count: 2, doubled: 4});
    });

    it("should handle deeply nested arrays", () => {
        const result = applyTransforms(
            {value: 0},
            [[[[(obj) => ({...obj, value: obj.value + 1})]]]],
            (obj) => ({...obj, value: obj.value + 10}),
        );
        assert.deepEqual(result, {value: 11});
    });

    it("should handle empty nested arrays", () => {
        const result = applyTransforms(
            {count: 1},
            [],
            [[]],
            (obj) => ({...obj, count: obj.count + 1}),
            [[[]]],
        );
        assert.deepEqual(result, {count: 2});
    });

    it("should work with primitive types", () => {
        const result = applyTransforms(
            5,
            (n) => n * 2,
            (n) => n + 3,
        );
        assert.equal(result, 13);
    });

    it("should work with string types", () => {
        const result = applyTransforms(
            "hello",
            (s) => s.toUpperCase(),
            (s) => s + "!",
        );
        assert.equal(result, "HELLO!");
    });

    it("should work with array types", () => {
        const result = applyTransforms(
            [1, 2, 3],
            (arr) => arr.map((x) => x * 2),
            (arr) => [...arr, 8],
        );
        assert.deepEqual(result, [2, 4, 6, 8]);
    });
});

describe("applyAsyncTransforms", () => {
    it("should return original value when no transforms are provided", async () => {
        const obj = {count: 1};
        const result = await applyAsyncTransforms(obj);
        assert.deepEqual(result, {count: 1});
        assert.equal(result, obj);
    });

    it("should apply a single async transformation", async () => {
        const result = await applyAsyncTransforms(
            {count: 1},
            async (obj) => ({...obj, count: obj.count + 1}),
        );
        assert.deepEqual(result, {count: 2});
    });

    it("should apply multiple async transformations in order", async () => {
        const result = await applyAsyncTransforms<{count: number; doubled?: number}>(
            {count: 1},
            async (obj) => ({...obj, count: obj.count + 1}),
            async (obj) => ({...obj, doubled: obj.count * 2}),
        );
        assert.deepEqual(result, {count: 2, doubled: 4});
    });

    it("should handle impure async transformations", async () => {
        const obj: {count: number; doubled?: number} = {count: 1};
        const result = await applyAsyncTransforms(
            obj,
            async (o) => { o.count += 1; },
            async (o) => { o.doubled = o.count * 2; },
        );
        assert.deepEqual(result, {count: 2, doubled: 4});
        assert.equal(result, obj);
    });

    it("should mix sync and async transforms", async () => {
        const result = await applyAsyncTransforms<{"count": number; "doubled"?: number; "final"?: boolean}>(
            {count: 1},
            (obj) => ({...obj, count: obj.count + 1}),
            async (obj) => ({...obj, doubled: obj.count * 2}),
            (obj) => ({...obj, "final": true}),
        );
        assert.deepEqual(result, {"count": 2, "doubled": 4, "final": true});
    });

    it("should flatten nested arrays of async transforms", async () => {
        const result = await applyAsyncTransforms<{count: number; doubled?: number}>(
            {count: 1},
            [async (obj) => ({...obj, count: obj.count + 1})],
            [[async (obj) => ({...obj, doubled: obj.count * 2})]],
        );
        assert.deepEqual(result, {count: 2, doubled: 4});
    });

    it("should execute transforms sequentially", async () => {
        const order: number[] = [];
        const result = await applyAsyncTransforms(
            {value: 0},
            async (obj) => {
                await sleep(10);
                order.push(1);
                return {...obj, value: obj.value + 1};
            },
            async (obj) => {
                order.push(2);
                return {...obj, value: obj.value + 10};
            },
            async (obj) => {
                await sleep(5);
                order.push(3);
                return {...obj, value: obj.value + 100};
            },
        );
        assert.deepEqual(order, [1, 2, 3]);
        assert.deepEqual(result, {value: 111});
    });

    it("should work with primitive types", async () => {
        const result = await applyAsyncTransforms(
            5,
            async (n) => n * 2,
            (n) => n + 3,
        );
        assert.equal(result, 13);
    });

    it("should handle empty nested arrays", async () => {
        const result = await applyAsyncTransforms(
            {count: 1},
            [],
            [[]],
            async (obj) => ({...obj, count: obj.count + 1}),
            [[[]]],
        );
        assert.deepEqual(result, {count: 2});
    });
});
