import {assert} from "chai";

import {identity, invoke, nop, sleep} from "./basic.ts";

describe("function/basic", () => {
    describe("sleep", () => {
        it("should preserve requested duration beyond the platform timer limit", async () => {
            const timeout_descriptor = Object.getOwnPropertyDescriptor(globalThis, "setTimeout")!;
            const requested_duration = 2 ** 31;
            let elapsed = 0;
            Object.defineProperty(globalThis, "setTimeout", {
                configurable: true,
                value: (callback: () => void, duration: number) => {
                    // Model Node's documented timer overflow without waiting in real time.
                    elapsed += duration > 2 ** 31 - 1 ? 1 : Math.max(1, Math.trunc(duration));
                    queueMicrotask(callback);
                    return 0;
                },
            });
            try {
                await sleep(requested_duration);
                assert.isAtLeast(elapsed, requested_duration);
            } finally {
                Object.defineProperty(globalThis, "setTimeout", timeout_descriptor);
            }
        });
    });

    describe("identity", () => {
        it("should return the original value", () => {
            for(const value of [
                0, 42, Number.POSITIVE_INFINITY, "Hello!", true, {a: 1, b: 2},
            ]) {
                assert.strictEqual(identity(value), value);
            }
        });
    });

    describe("invoke", () => {
        it("should work as advertised", () => {
            assert.strictEqual(invoke(() => 42), 42);
        });
    });

    describe("nop", () => {
        it("should return undefined", () => {
            assert.strictEqual(nop(), (void 0));
            assert.strictEqual(nop(1, 2, 3), (void 0));
        });
    });
});
