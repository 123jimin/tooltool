import {assert} from "chai";

import {sleep} from "./basic.ts";
import {fetchPages, forEachPage, type PageFetcher} from "./fetch-pages.ts";

const createFetcher = (
    page_contents: Array<string[] | null | undefined>,
    num_pages_on_fetch: number[] = [],
): PageFetcher<string[]> => (page_index) => Promise.resolve({
    num_pages: num_pages_on_fetch[page_index] ?? page_contents.length,
    page: page_contents[page_index],
});

function createDeferredFetcher(count: number) {
    const requests = Array.from({length: count}, () => ({
        started: Promise.withResolvers<void>(),
        response: Promise.withResolvers<{num_pages: number; page?: string[]}>(),
    }));
    const calls: number[] = [];
    const fetcher: PageFetcher<string[]> = (index) => {
        calls.push(index);
        const request = requests[index];
        if(request == null) throw new Error(`Unexpected page ${index}`);
        request.started.resolve();
        return request.response.promise;
    };
    return {fetcher, requests, calls};
}

describe("function/fetch-pages", () => {
    describe("forEachPage", () => {
        it("should fetch all pages and call the callback for each", async () => {
            const collected_pages: {index: number; page: string[]}[] = [];
            await forEachPage(createFetcher([["a"], ["b"], ["c"]]), (page, index) => {
                collected_pages.push({index, page});
            });
            assert.deepStrictEqual(collected_pages.sort((a, b) => a.index - b.index), [
                {index: 0, page: ["a"]},
                {index: 1, page: ["b"]},
                {index: 2, page: ["c"]},
            ]);
        });

        it("should not call callback for null or undefined pages", async () => {
            const collected_pages: {index: number; page: string[]}[] = [];
            await forEachPage(createFetcher([["a"], null, ["c"], void 0]), (page, index) => {
                collected_pages.push({index, page});
            });
            assert.deepStrictEqual(collected_pages.sort((a, b) => a.index - b.index), [
                {index: 0, page: ["a"]},
                {index: 2, page: ["c"]},
            ]);
        });

        it("should fetch newly discovered pages without refetching earlier pages", async () => {
            const {fetcher, requests, calls} = createDeferredFetcher(3);
            const collected: string[][] = [];
            const operation = forEachPage(fetcher, (page) => collected.push(page));
            await requests[0]!.started.promise;
            requests[0]!.response.resolve({num_pages: 2, page: ["a"]});
            await requests[1]!.started.promise;
            assert.deepStrictEqual(calls, [0, 1]);

            requests[1]!.response.resolve({num_pages: 3, page: ["b"]});
            await requests[2]!.started.promise;
            requests[2]!.response.resolve({num_pages: 1, page: ["c"]});
            await operation;
            assert.deepStrictEqual(calls, [0, 1, 2]);
            assert.deepStrictEqual(collected, [["a"], ["b"], ["c"]]);
        });

        it("should process pages in completion order and wait for every discovered page", async () => {
            const {fetcher, requests} = createDeferredFetcher(4);
            const call_order: number[] = [];
            let completed = false;
            const operation = forEachPage(fetcher, (_page, index) => call_order.push(index)).then(() => {
                completed = true;
            });
            await requests[0]!.started.promise;
            requests[0]!.response.resolve({num_pages: 4, page: ["a"]});
            await Promise.all(requests.slice(1).map((request) => request.started.promise));

            requests[2]!.response.resolve({num_pages: 4, page: ["c"]});
            await requests[2]!.response.promise;
            requests[3]!.response.resolve({num_pages: 4, page: ["d"]});
            await requests[3]!.response.promise;
            assert.deepStrictEqual(call_order, [0, 2, 3]);
            assert.isFalse(completed);

            requests[1]!.response.resolve({num_pages: 4, page: ["b"]});
            await operation;
            assert.deepStrictEqual(call_order, [0, 2, 3, 1]);
            assert.isTrue(completed);
        });

        it("should propagate a fetch failure and ignore completed late pages, counts, and failures", async () => {
            const {fetcher, requests, calls} = createDeferredFetcher(4);
            const fetch_error = new Error("page failure");
            const late_error = new Error("late failure");
            const collected: string[][] = [];
            const operation = forEachPage(fetcher, (page) => collected.push(page)).catch((reason: unknown) => reason);
            await requests[0]!.started.promise;
            requests[0]!.response.resolve({num_pages: 4, page: ["a"]});
            await Promise.all(requests.slice(1).map((request) => request.started.promise));

            requests[2]!.response.reject(fetch_error);
            assert.strictEqual(await operation, fetch_error);
            requests[1]!.response.resolve({num_pages: 99, page: ["ignored"]});
            requests[3]!.response.reject(late_error);
            await Promise.all([
                requests[1]!.response.promise,
                requests[3]!.response.promise.catch((reason: unknown) => reason),
            ]);
            assert.deepStrictEqual(collected, [["a"]]);
            assert.deepStrictEqual(calls, [0, 1, 2, 3]);
        });

        it("should reject synchronous callback exceptions and stop delivering other pages", async () => {
            const callback_error = new Error("callback failure");
            const callbacks: number[] = [];
            const result = await forEachPage(createFetcher([["a"], ["b"], ["c"]]), (_page, index) => {
                callbacks.push(index);
                if(index === 1) throw callback_error;
            }).catch((reason: unknown) => reason);
            assert.strictEqual(result, callback_error);
            assert.deepStrictEqual(callbacks, [0, 1]);
        });

        it("should fetch page zero but deliver nothing for an empty result", async () => {
            const {fetcher, requests, calls} = createDeferredFetcher(1);
            const collected: string[][] = [];
            const operation = forEachPage(fetcher, (page) => collected.push(page));
            await requests[0]!.started.promise;
            requests[0]!.response.resolve({num_pages: 0});
            await operation;
            assert.deepStrictEqual(calls, [0]);
            assert.deepStrictEqual(collected, []);
        });
    });

    describe("fetchPages", () => {
        it("should yield all pages", async () => {
            const collected_pages: {index: number; page: string[]}[] = [];
            for await (const page of fetchPages(createFetcher([["a"], ["b"], ["c"]]))) {
                collected_pages.push(page);
            }
            assert.deepStrictEqual(collected_pages.sort((a, b) => a.index - b.index), [
                {index: 0, page: ["a"]},
                {index: 1, page: ["b"]},
                {index: 2, page: ["c"]},
            ]);
        });

        it("should not yield null or undefined pages", async () => {
            const collected_pages: {index: number; page: string[]}[] = [];
            for await (const page of fetchPages(createFetcher([["a"], null, ["c"], void 0]))) {
                collected_pages.push(page);
            }
            assert.deepStrictEqual(collected_pages.sort((a, b) => a.index - b.index), [
                {index: 0, page: ["a"]},
                {index: 2, page: ["c"]},
            ]);
        });

        it("should yield dynamically discovered pages", async () => {
            const collected_pages: {index: number; page: string[]}[] = [];
            for await (const page of fetchPages(createFetcher([["a"], ["b"], ["c"]], [2, 3]))) {
                collected_pages.push(page);
            }
            assert.deepStrictEqual(collected_pages.sort((a, b) => a.index - b.index), [
                {index: 0, page: ["a"]},
                {index: 1, page: ["b"]},
                {index: 2, page: ["c"]},
            ]);
        });

        it("should yield pages in completion order without finishing while another page is pending", async () => {
            const {fetcher, requests} = createDeferredFetcher(3);
            const pages = fetchPages(fetcher);
            const first = pages.next();
            await requests[0]!.started.promise;
            requests[0]!.response.resolve({num_pages: 3, page: ["a"]});
            assert.deepStrictEqual(await first, {value: {index: 0, page: ["a"]}, done: false});
            await Promise.all(requests.slice(1).map((request) => request.started.promise));

            const second = pages.next();
            requests[2]!.response.resolve({num_pages: 3, page: ["c"]});
            assert.deepStrictEqual(await second, {value: {index: 2, page: ["c"]}, done: false});
            let settled = false;
            const third = pages.next().then((result) => {
                settled = true;
                return result;
            });
            await sleep(0);
            assert.isFalse(settled);

            requests[1]!.response.resolve({num_pages: 3, page: ["b"]});
            assert.deepStrictEqual(await third, {value: {index: 1, page: ["b"]}, done: false});
            assert.deepStrictEqual(await pages.next(), {value: void 0, done: true});
        });

        it("should propagate fetch failure without stray unhandled rejections after late fetches finish", async () => {
            const {fetcher, requests, calls} = createDeferredFetcher(4);
            const fetch_error = new Error("page failure");
            const late_error = new Error("late failure");
            const pages = fetchPages(fetcher);
            const first = pages.next();
            await requests[0]!.started.promise;
            requests[0]!.response.resolve({num_pages: 4, page: ["a"]});
            assert.deepStrictEqual(await first, {value: {index: 0, page: ["a"]}, done: false});
            await Promise.all(requests.slice(1).map((request) => request.started.promise));

            const failure = pages.next().catch((reason: unknown) => reason);
            requests[2]!.response.reject(fetch_error);
            assert.strictEqual(await failure, fetch_error);

            requests[1]!.response.resolve({num_pages: 99, page: ["ignored"]});
            requests[3]!.response.reject(late_error);
            await Promise.all([
                requests[1]!.response.promise,
                requests[3]!.response.promise.catch((reason: unknown) => reason),
            ]);
            // Give the host a turn to report stray rejections; the test command treats them as failures.
            await sleep(0);
            assert.deepStrictEqual(calls, [0, 1, 2, 3]);
            assert.deepStrictEqual(await pages.next(), {value: void 0, done: true});
        });

        it("should continue fetching newly discovered pages after the consumer exits early", async () => {
            const {fetcher, requests, calls} = createDeferredFetcher(3);
            const pages = fetchPages(fetcher);
            const first = pages.next();
            await requests[0]!.started.promise;
            requests[0]!.response.resolve({num_pages: 2, page: ["a"]});
            assert.deepStrictEqual(await first, {value: {index: 0, page: ["a"]}, done: false});
            await requests[1]!.started.promise;
            assert.deepStrictEqual(await pages.return(void 0), {value: void 0, done: true});

            requests[1]!.response.resolve({num_pages: 3, page: ["b"]});
            await requests[2]!.started.promise;
            requests[2]!.response.resolve({num_pages: 3, page: ["c"]});
            await requests[2]!.response.promise;
            await sleep(0);
            assert.deepStrictEqual(calls, [0, 1, 2]);
            assert.deepStrictEqual(await pages.next(), {value: void 0, done: true});
        });

        it("should handle an empty result without yielding pages", async () => {
            const collected: unknown[] = [];
            for await (const page of fetchPages(createFetcher([]))) {
                collected.push(page);
            }
            assert.deepStrictEqual(collected, []);
        });
    });
});
