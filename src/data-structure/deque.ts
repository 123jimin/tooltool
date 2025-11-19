/**
 * A doubly-ended queue. (TODO)
 */
export class Deque<T> {
    #data: T[] = [];

    get length(): number {
        return this.#data.length;
    }

    push(...items: T[]): number {
        return this.#data.push(...items);
    }

    shift(): T | null {
        return this.#data.shift() || null;
    }
}