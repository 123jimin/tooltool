import {createAsyncChannel} from "../iterator/index.ts";
import type {Nullable} from "../type/index.ts";

/**
 * A function that fetches a single page of data.
 *
 * @typeParam Page - The page data type.
 * @param page - Zero-based page index.
 * @returns An object with `num_pages` (total pages) and `page` (data, or `null` or `undefined` if empty).
 */
export type PageFetcher<Page> = (page: number) => Promise<{num_pages: number; page?: Nullable<Page>}>;

/**
 * Fetches multiple pages in parallel and invokes a callback for each non-nullish page.
 *
 * @typeParam Page - The page data type.
 * @param fetcher - Fetches a page by zero-based index.
 * @param callback - Called for each non-nullish page (may be out-of-order).
 * @returns Resolves when all fetches and synchronous page callbacks finish.
 *
 * @remarks
 * Page `0` is fetched first to discover the count, even for an empty result.
 * All discovered remaining pages are then fetched in parallel with no
 * concurrency limit; consider using {@link rateLimited} to wrap the fetcher.
 * Higher reported counts schedule additional pages; lower counts do not cancel
 * already scheduled pages. Callbacks are synchronous and are not awaited.
 *
 * @throws Propagates fetch failures and synchronous callback exceptions. In-flight
 * fetches continue after failure, but their pages and reported counts are ignored.
 *
 * @example
 * ```ts
 * await forEachPage(
 *   async (i) => ({ num_pages: 5, page: await fetchUsers(i) }),
 *   (users, i) => console.log(`Page ${i}:`, users),
 * );
 * ```
 *
 * @see {@link fetchPages} for an async generator alternative.
 */
export async function forEachPage<Page>(fetcher: PageFetcher<Page>, callback: (page: NonNullable<Page>, index: number) => void) {
    let unresolved_count = 0;
    let max_pages = 1;

    let onSuccess: (() => void)|null = null;
    let onFail: ((err: unknown) => void)|null = null;

    async function invokeFetcher(index: number): Promise<void> {
        if(onSuccess == null) return;

        ++unresolved_count;

        try {
            const {num_pages, page} = await fetcher(index);
            if(onSuccess == null) return;

            if(page != null) callback(page, index);
            onFetchSuccess(num_pages);
        } catch (err) {
            if(onSuccess == null) return;

            onSuccess = null;
            onFail?.(err);
        }
    }

    function onFetchSuccess(new_max_pages: number) {
        --unresolved_count;

        if(max_pages < new_max_pages) {
            const old_max_pages = max_pages;
            max_pages = new_max_pages;

            for(let i=old_max_pages; i<new_max_pages; ++i) {
                void invokeFetcher(i);
            }

            return;
        }

        if(unresolved_count === 0 && onSuccess) {
            const myOnSuccess = onSuccess;
            onSuccess = null;
            myOnSuccess();
        }
    }

    await new Promise<void>((resolve, reject) => {
        onSuccess = resolve;
        onFail = reject;

        void invokeFetcher(0);
    });
}

/**
 * Fetches pages as an async generator, yielding each non-nullish page with its index.
 *
 * Wrapper around {@link forEachPage}. Pages may yield out-of-order due to parallel fetching.
 *
 * @typeParam Page - The page data type.
 * @param fetcher - Fetches a page by zero-based index.
 * @yields `{ page, index }` for each non-nullish page.
 * @throws If any fetch fails.
 *
 * @remarks
 * Fetching starts on the first iteration. Exiting the generator early does not
 * cancel in-flight fetches or prevent subsequently discovered pages from being
 * fetched. Pages are buffered without backpressure for slower consumers.
 *
 * @example
 * ```ts
 * for await (const { page, index } of fetchPages(fetcher)) {
 *   console.log(`Page ${index}:`, page);
 * }
 * ```
 *
 * @see {@link forEachPage} for a callback-based alternative.
 */
export async function* fetchPages<Page>(fetcher: PageFetcher<Page>): AsyncGenerator<{index: number; page: NonNullable<Page>}> {
    const channel = createAsyncChannel<{index: number; page: NonNullable<Page>}>();

    void forEachPage(fetcher, (page, index) => channel.next({page, index})).then(
        () => channel.complete(),
        (err: unknown) => channel.error(err),
    );

    yield* channel;
}
