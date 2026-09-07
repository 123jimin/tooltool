import {assert} from "chai";

import {Deque} from "./deque.ts";

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

        it("should preserve stored undefined values in at lookups", () => {
            const deque = new Deque<number | undefined>();
            deque.push(1, void 0, 3);

            assert.strictEqual(deque.at(1), void 0);
            assert.strictEqual(deque.at(-2), void 0);
            assert.strictEqual(deque.at(0), 1);
            assert.strictEqual(deque.at(2), 3);
            assert.strictEqual(deque.at(3), null);
            assert.strictEqual(deque.length, 3);
        });

        it("should preserve a stored undefined value when popping the tail", () => {
            const deque = new Deque<number | undefined>();
            deque.push(1, void 0);

            assert.strictEqual(deque.pop(), void 0);
            assert.strictEqual(deque.length, 1);
            assert.strictEqual(deque.pop(), 1);
            assert.strictEqual(deque.pop(), null);
        });

        it("should preserve a stored undefined value when shifting the head", () => {
            const deque = new Deque<number | undefined>();
            deque.unshift(void 0, 1);

            assert.strictEqual(deque.shift(), void 0);
            assert.strictEqual(deque.length, 1);
            assert.strictEqual(deque.shift(), 1);
            assert.strictEqual(deque.shift(), null);
        });
    });
});
