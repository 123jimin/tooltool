import { assert } from "chai";
import { Deque } from "./deque.js";

describe("data-structure/deque", () => {
    describe("Deque", () => {
        it("should work as advertised", () => {
            const deque = new Deque<number>();
            deque.push(1, 2);
            deque.unshift(0);

            assert.strictEqual(deque.shift(), 0);
            assert.strictEqual(deque.pop(), 2);
            assert.strictEqual(deque.pop(), 1);
            assert.strictEqual(deque.pop(), null);
            assert.strictEqual(deque.shift(), null);
        });

        it("should maintain length regardless of head/tail operations", () => {
            const deque = new Deque<string>();
            assert.strictEqual(deque.length, 0);

            deque.push("a");
            deque.unshift("z", "y");
            assert.strictEqual(deque.length, 3);

            deque.shift();
            assert.strictEqual(deque.length, 2);

            deque.pop();
            assert.strictEqual(deque.length, 1);

            deque.pop();
            assert.strictEqual(deque.length, 0);
        });

        it("should support Array.at style lookups", () => {
            const deque = new Deque<number>();
            deque.push(10, 20, 30, 40);

            assert.strictEqual(deque.at(0), 10);
            assert.strictEqual(deque.at(1), 20);
            assert.strictEqual(deque.at(-1), 40);
            assert.strictEqual(deque.at(-2), 30);
            assert.strictEqual(deque.at(-4), 10);
            assert.strictEqual(deque.at(4), null);
            assert.strictEqual(deque.at(-5), null);

            const empty = new Deque<number>();
            assert.strictEqual(empty.at(0), null);
        });
    });
});