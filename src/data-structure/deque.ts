/**
 * Represents a double-ended queue (deque) with amortized O(1) insertion and removal at both ends.
 * The implementation stores items inside a sparse index map so the head and tail can grow independently without costly array shifts.
 *
 * @typeParam T - Type of item stored inside the deque.
 *
 * @example
 * const deque = new Deque<number>();
 * deque.push(1, 2);
 * deque.unshift(0);
 * deque.pop(); // 2
 */
export class Deque<T> {
    #item_map = new Map<number, T>();
    #head_index = 0;
    #tail_index = 0;

    /**
     * Current number of items held by the deque.
     *
     * @example
     * const deque = new Deque<string>();
     * deque.push("a");
     * deque.length; // 1
     */
    get length(): number {
        return this.#tail_index - this.#head_index;
    }

    /**
     * Appends items to the tail of the deque.
     *
     * @param items - Items to append, in the order they should appear.
     * @returns The updated deque length.
     *
     * @example
     * const deque = new Deque<number>();
     * deque.push(1, 2); // 2
     */
    push(...items: T[]): number {
        for (const item of items) {
            this.#item_map.set(this.#tail_index, item);
            this.#tail_index += 1;
        }

        return this.length;
    }
    
    /**
     * Inserts items at the head of the deque.
     *
     * @param items - Items to insert, where the first argument becomes the new head.
     * @returns The updated deque length.
     *
     * @example
     * const deque = new Deque<number>();
     * deque.unshift(2, 3); // 2
     * deque.unshift(1); // 3
     */
    unshift(...items: T[]): number {
        for (let index = items.length - 1; index >= 0; --index) {
            this.#item_map.set(--this.#head_index, items[index]);
        }

        return this.length;
    }
    
    /**
     * Removes and returns the item at the tail of the deque.
     *
     * @returns The removed item, or `null` if the deque is empty.
     *
     * @example
     * const deque = new Deque<number>();
     * deque.push(1, 2);
     * deque.pop(); // 2
     */
    pop(): T | null {
        if (this.length === 0) {
            return null;
        }

        const target_index = this.#tail_index - 1;
        const value = this.#item_map.get(target_index) ?? null;
        this.#item_map.delete(target_index);
        this.#tail_index = target_index;

        return value;
    }

    /**
     * Removes and returns the item at the head of the deque.
     *
     * @returns The removed item, or `null` if the deque is empty.
     *
     * @example
     * const deque = new Deque<number>();
     * deque.push(1, 2);
     * deque.shift(); // 1
     */
    shift(): T | null {
        if (this.length === 0) {
            return null;
        }

        const target_index = this.#head_index;
        const value = this.#item_map.get(target_index) ?? null;
        this.#item_map.delete(target_index);
        ++this.#head_index;

        return value;
    }
    
    /**
     * Retrieves the item at the provided position.
     * 
     * An index of `-1` returns the tail item, `0` returns the head, and any
     * non-integer input is truncated toward zero.
     *
     * @param index - Requested position inside the deque.
     * @returns The referenced item or `null` when the position is out of range.
     *
     * @example
     * const deque = new Deque<number>();
     * deque.push(10, 20, 30);
     * deque.at(-1); // 30
     */
    at(index: number): T | null {
        const size = this.length;
        if (size === 0) {
            return null;
        }

        const numeric_index = Number(index);
        const integer_index = Number.isNaN(numeric_index)
            ? 0
            : Math.trunc(numeric_index);
        const relative_index = integer_index < 0 ? size + integer_index : integer_index;

        if (relative_index < 0 || relative_index >= size) {
            return null;
        }

        const storage_index = this.#head_index + relative_index;
        return this.#item_map.get(storage_index) ?? null;
    }
}