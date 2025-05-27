export interface PageRangeInfo {
    start: number;
    end: number;
    max: number;
}

/**
 * Call `fn` with batches of data fetched from `fetcher`.
 * @param batch_size Maximum number of pages to fetch at once. If <= 0, fetch all pages at once.
 * @param fetcher Function that fetches data for a given page.
 * @param fn Function that processes a batch of data.
 */
export async function paginated<T>(
    batch_size: number,
    fetcher: (page: number) => Promise<{max_page: number; data: T}>,
    fn: (batch: T[], page_range_info: PageRangeInfo) => Promise<void>,
) {
    let curr_page = 0;
    let max_page = 1;

    while(curr_page < max_page) {
        const curr_start = curr_page;
        const fetch_promise_list: Array<Promise<{max_page: number; data: T}>> = [];
        
        for(let i = 0; (batch_size <= 0 || i < batch_size) && curr_page < max_page; ++i, ++curr_page) {
            fetch_promise_list.push(fetcher(curr_page));
        }

        const fetch_data = await Promise.all(fetch_promise_list);
        if(fetch_data.length === 0) break;

        const last_fetch_data = fetch_data.at(-1);
        if(!last_fetch_data) break; // Should never happen.

        max_page = last_fetch_data.max_page;

        await fn(
            fetch_data.map(x => x.data),
            {start: curr_start, end: curr_page, max: max_page},
        );
    }
}