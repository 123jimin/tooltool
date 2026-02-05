/**
 * A double-ended queue with amortized O(1) insertion and removal at both ends.
 *
 * Uses a sparse index map so head and tail grow independently without array shifts.
 *
 * @typeParam T - Item type.
 *
 * @example
 * ```ts
 * const deque = new Deque<number>();
 * deque.push(1, 2);
 * deque.unshift(0);
 * deque.pop(); // 2
 * ```
 */
export class Deque<T> {
    #item_map = new Map<number, T>();
    #head_index = 0;
    #tail_index = 0;

    /** Number of items in the deque. */
    get length(): number {
        return this.#tail_index - this.#head_index;
    }

    /**
     * Appends items to the tail.
     *
     * @param items - Items to append (in order).
     * @returns The new length.
     */
    push(...items: T[]): number {
        for (const item of items) {
            this.#item_map.set(this.#tail_index, item);
            this.#tail_index += 1;
        }

        return this.length;
    }
    
    /**
     * Inserts items at the head.
     *
     * @param items - Items to insert; first argument becomes the new head.
     * @returns The new length.
     */
    unshift(...items: T[]): number {
        for (let index = items.length - 1; index >= 0; --index) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.#item_map.set(--this.#head_index, items[index]!);
        }

        return this.length;
    }
    
    /**
     * Removes and returns the tail item.
     *
     * @returns The removed item, or `null` if empty.
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
     * Removes and returns the head item.
     *
     * @returns The removed item, or `null` if empty.
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
     * Retrieves the item at the given index.
     *
     * Supports negative indices (`-1` = tail). Non-integers are truncated toward zero.
     *
     * @param index - Position in the deque.
     * @returns The item, or `null` if out of range.
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