import { Nullable } from "../type/index.js";
import { toAsyncGenerator } from "../iterator/generator.js";

/**
 * A function that fetches a single page of data.
 * 
 * @typeParam Page - The type of data contained in a page
 * @param page - Zero-based page index to fetch
 * @returns A promise resolving to an object containing:
 *   - `num_pages`: Total number of pages available (may change between calls)
 *   - `page`: The page data, or `null`/`undefined` if the page is empty/unavailable
 * 
 * @example
 * ```ts
 * const fetcher: PageFetcher<User[]> = async (page) => {
 *   const response = await api.getUsers({ page, limit: 100 });
 *   return {
 *     num_pages: response.totalPages,
 *     page: response.users
 *   };
 * };
 * ```
 */
export type PageFetcher<Page> = (page: number) => Promise<{num_pages: number; page?: Nullable<Page>}>;

/**
 * Fetches multiple pages in parallel and invokes a callback for each non-null page.
 * 
 * @remarks
 * **Concurrency:** All pages are fetched in parallel with no concurrency limit.
 * It is highly recommended to use {@link rateLimited} or similar rate-limiting utilities 
 * to wrap the fetcher function to avoid overwhelming the server.
 * 
 * **Dynamic page counts:** The function starts by fetching page 0. If subsequent pages 
 * report a higher `num_pages`, additional pages are automatically fetched. If `num_pages` 
 * decreases during execution, previously started fetches may continue.
 * 
 * @typeParam Page - The type of data contained in a page
 * @param fetcher - Function to fetch individual pages; called with zero-based page indices
 * @param callback - Invoked for each non-null page with the page data and its index; 
 *                   may be called out-of-order relative to page indices
 * @returns A promise that resolves when all pages have been fetched and processed
 * 
 * @throws
 * If any fetch fails, the promise rejects immediately with the error from the failed fetch.
 * Other in-flight fetches may continue running in the background, but their results are 
 * ignored and their callbacks will not be invoked.
 * 
 * @example Basic usage
 * ```ts
 * await forEachPage(
 *   async (page) => ({ num_pages: 5, page: await fetchUsers(page) }),
 *   (users, index) => console.log(`Page ${index}:`, users)
 * );
 * ```
 * 
 * @example Dynamic page count
 * ```ts
 * // If page 0 returns num_pages=2, but page 1 returns num_pages=3,
 * // page 2 will be automatically fetched
 * await forEachPage(fetcher, callback);
 * ```
 * 
 * @example With rate limiting
 * ```ts
 * const limitedFetcher = rateLimited(fetcher, 100);
 * await forEachPage(limitedFetcher, processPage);
 * ```
 * 
 * @see {@link fetchPages} for an async generator alternative
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
            const { num_pages, page } = await fetcher(index);
            if(onSuccess == null) return;

            if(page != null) callback(page, index);
            onFetchSuccess(num_pages);
        } catch(err) {
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
 * Fetches pages as an async generator, yielding each non-null page with its index.
 * 
 * @remarks
 * This is an async generator wrapper around {@link forEachPage}, providing a more 
 * functional approach to page iteration. Pages may be yielded out-of-order relative 
 * to their indices due to parallel fetching.
 * 
 * Like {@link forEachPage}, this function fetches all pages in parallel with no 
 * concurrency limit. Consider rate-limiting the fetcher function.
 * 
 * @typeParam Page - The type of data contained in a page
 * @param fetcher - Function to fetch individual pages
 * @yields Objects containing the page data and its zero-based index
 * @throws If any fetch fails, the generator throws and terminates
 * 
 * @example Basic iteration
 * ```ts
 * for await (const { page, index } of fetchPages(fetcher)) {
 *   console.log(`Page ${index}:`, page);
 * }
 * ```
 * 
 * @see {@link forEachPage} for a callback-based alternative
 */
export async function* fetchPages<Page>(fetcher: PageFetcher<Page>): AsyncGenerator<{index: number, page: NonNullable<Page>}> {
    yield* toAsyncGenerator(async ({yeet, done, fail}) => {
        try {
            await forEachPage(fetcher, (page, index) => yeet({page, index}));
        } catch(err) {
            fail(err);
        }

        done();
    });
}