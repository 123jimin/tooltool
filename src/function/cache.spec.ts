import { assert } from "chai";
import { cached } from "./cache.js";

describe("function/cache", () => {
    describe("cached", () => {
        it("should work as advertised", async () => {
            let call_count = 0;
            const fetchProfile = cached(async (id: string) => {
                call_count += 1;
                return { id, name: `user-${id}` };
            });

            const first_promise = fetchProfile("42");
            const second_promise = fetchProfile("42");

            assert.strictEqual(first_promise, second_promise);
            const profile = await second_promise;
            assert.deepStrictEqual(profile, { id: "42", name: "user-42" });
            assert.strictEqual(call_count, 1);

            fetchProfile.clearCache();
            await fetchProfile("42");
            assert.strictEqual(call_count, 2);
        });

        it("should evict rejected promises so retries can succeed", async () => {
            let attempts = 0;
            const unstable = cached(async (value: string) => {
                attempts += 1;
                if (attempts === 1) {
                    throw new Error("boom");
                }

                return value.repeat(2);
            });

            await unstable("a").then(
                () => assert.fail("should have thrown"),
                (error) => {
                    assert.instanceOf(error, Error);
                    assert.strictEqual((error as Error).message, "boom");
                },
            );

            const result = await unstable("a");
            assert.strictEqual(result, "aa");
            assert.strictEqual(attempts, 2);
        });

        it("should honor the provided key generator", async () => {
            let call_count = 0;
            const lookupUser = cached(
                async (user_id: string, request_id: string) => {
                    call_count += 1;
                    return `${user_id}:${request_id}`;
                },
                (user_id) => user_id,
            );

            const first_promise = lookupUser("alice", "req-1");
            const second_promise = lookupUser("alice", "req-2");

            assert.strictEqual(first_promise, second_promise);
            assert.strictEqual(await second_promise, "alice:req-1");
            assert.strictEqual(call_count, 1);

            const bob_result = await lookupUser("bob", "req-1");
            assert.strictEqual(bob_result, "bob:req-1");
            assert.strictEqual(call_count, 2);
        });
    });
});