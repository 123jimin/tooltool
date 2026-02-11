import {assert} from "chai";
import {forEachPage, fetchPages, type PageFetcher} from "./fetch-pages.ts";
import {sleep} from "./basic.ts";

const createMockFetcher = (
    page_contents: Array<string[] | null | undefined | "error">,
    options: {
        delays_ms?: number[];
        num_pages_on_fetch?: number[]; // num_pages returned for page N
    } = {},
): PageFetcher<string[]> => {
    let max_num_pages = page_contents.length;

    return async (page_index: number) => {
        const num_pages = options.num_pages_on_fetch?.[page_index] ?? max_num_pages;
        max_num_pages = Math.max(max_num_pages, num_pages);

        const delay = options.delays_ms?.[page_index] ?? 1;
        if(delay > 0) {
            await sleep(delay);
        }

        const content = page_contents[page_index];
        if(content === "error") {
            throw new Error(`Failed to fetch page ${page_index}`);
        }

        return {
            num_pages,
            page: content,
        };
    };
};

describe("function/fetch-pages", function () {
    this.slow(500);
    this.timeout(1000);

    describe("forEachPage", () => {
        it("should fetch all pages and call the callback for each", async () => {
            const pages = [["a"], ["b"], ["c"]];
            const fetcher = createMockFetcher(pages);
            const collected_pages: {index: number; page: string[]}[] = [];

            await forEachPage(fetcher, (page, index) => {
                collected_pages.push({index, page});
            });

            assert.strictEqual(collected_pages.length, 3);
            assert.deepEqual(
                collected_pages.sort((a, b) => a.index - b.index),
                [
                    {index: 0, page: ["a"]},
                    {index: 1, page: ["b"]},
                    {index: 2, page: ["c"]},
                ],
            );
        });

        it("should not call callback for null or undefined pages", async () => {
            const pages = [["a"], null, ["c"], undefined];
            const fetcher = createMockFetcher(pages);
            const collected_pages: {index: number; page: string[]}[] = [];

            await forEachPage(fetcher, (page, index) => {
                collected_pages.push({index, page});
            });

            assert.strictEqual(collected_pages.length, 2);
            assert.deepEqual(
                collected_pages.sort((a, b) => a.index - b.index),
                [
                    {index: 0, page: ["a"]},
                    {index: 2, page: ["c"]},
                ],
            );
        });

        it("should handle dynamic page count increases", async () => {
            const pages = [["a"], ["b"], ["c"]];
            // Page 0 reports 2 pages, but page 1 reports 3.
            const fetcher = createMockFetcher(pages, {num_pages_on_fetch: [2, 3]});
            const collected_pages: {index: number; page: string[]}[] = [];

            await forEachPage(fetcher, (page, index) => {
                collected_pages.push({index, page});
            });

            assert.strictEqual(collected_pages.length, 3);
            assert.deepEqual(
                collected_pages.sort((a, b) => a.index - b.index),
                [
                    {index: 0, page: ["a"]},
                    {index: 1, page: ["b"]},
                    {index: 2, page: ["c"]},
                ],
            );
        });

        it("should process pages out of order due to network delay", async () => {
            const pages = [["a"], ["b"], ["c"], ["d"]];
            const fetcher = createMockFetcher(pages, {delays_ms: [0, 300, 100, 200]});
            const call_order: number[] = [];

            await forEachPage(fetcher, (_page, index) => {
                call_order.push(index);
            });

            assert.deepEqual(call_order, [0, 2, 3, 1]);
        });

        it("should throw if the first fetch to complete fails", async () => {
            const pages: Array<string[]|'error'> = [["a"], ["b"], "error", ["d"]];
            const fetcher = createMockFetcher(pages, {delays_ms: [0, 200, 100, 300]});
            const collected_pages: {index: number; page: string[]}[] = [];

            try {
                await forEachPage(fetcher, (page, index) => {
                    collected_pages.push({index, page});
                });
                assert.fail("should have thrown");
            } catch (err) {
                assert.instanceOf(err, Error);
                assert.strictEqual((err as Error).message, "Failed to fetch page 2");
            }

            // wait a bit for other promises to potentially resolve and call callback
            await sleep(50);
            assert.strictEqual(collected_pages.length, 1);
        });

        it("should handle the case with 0 pages", async () => {
            const fetcher = createMockFetcher([]);
            let callback_called = false;

            await forEachPage(fetcher, () => {
                callback_called = true;
            });

            assert.isFalse(callback_called, "callback should not have been called for 0 pages");
        });
    });

    describe("fetchPages", () => {
        it("should yield all pages", async () => {
            const pages = [["a"], ["b"], ["c"]];
            const fetcher = createMockFetcher(pages);
            const collected_pages: {index: number; page: string[]}[] = [];

            for await (const page_result of fetchPages(fetcher)) {
                collected_pages.push(page_result);
            }

            assert.strictEqual(collected_pages.length, 3);
            assert.deepEqual(
                collected_pages.sort((a, b) => a.index - b.index),
                [
                    {index: 0, page: ["a"]},
                    {index: 1, page: ["b"]},
                    {index: 2, page: ["c"]},
                ],
            );
        });

        it("should not yield null or undefined pages", async () => {
            const pages = [["a"], null, ["c"], undefined];
            const fetcher = createMockFetcher(pages);
            const collected_pages: {index: number; page: string[]}[] = [];

            for await (const page_result of fetchPages(fetcher)) {
                collected_pages.push(page_result);
            }

            assert.strictEqual(collected_pages.length, 2);
            assert.deepEqual(
                collected_pages.sort((a, b) => a.index - b.index),
                [
                    {index: 0, page: ["a"]},
                    {index: 2, page: ["c"]},
                ],
            );
        });

        it("should handle dynamic page count increases", async () => {
            const pages = [["a"], ["b"], ["c"]];
            const fetcher = createMockFetcher(pages, {num_pages_on_fetch: [2, 3]});
            const collected_pages: {index: number; page: string[]}[] = [];

            for await (const page_result of fetchPages(fetcher)) {
                collected_pages.push(page_result);
            }

            assert.strictEqual(collected_pages.length, 3);
        });

        it("should yield pages out of order due to network delay", async () => {
            const pages = [["a"], ["b"], ["c"], ["d"]];
            const fetcher = createMockFetcher(pages, {delays_ms: [0, 300, 100, 200]});
            const yield_order: number[] = [];

            for await (const {index} of fetchPages(fetcher)) {
                yield_order.push(index);
            }

            assert.deepEqual(yield_order, [0, 2, 3, 1]);
        });

        it("should throw if the second fetch to complete fails", async () => {
            const pages: Array<string[]|'error'> = [["a"], ["b"], "error", ["d"]];
            const fetcher = createMockFetcher(pages, {delays_ms: [0, 200, 100, 300]});
            const collected_pages: {index: number; page: string[]}[] = [];

            try {
                for await (const page_result of fetchPages(fetcher)) {
                    collected_pages.push(page_result);
                }
                assert.fail("should have thrown");
            } catch (err) {
                assert.instanceOf(err, Error);
                assert.strictEqual((err as Error).message, "Failed to fetch page 2");
            }

            assert.strictEqual(collected_pages.length, 1);
        });

        it("should handle the case with 0 pages", async () => {
            const fetcher = createMockFetcher([]);
            const collected_pages: unknown[] = [];
            for await (const page of fetchPages(fetcher)) {
                collected_pages.push(page);
            }
            assert.strictEqual(collected_pages.length, 0, "generator should not have yielded anything");
        });
    });
});
