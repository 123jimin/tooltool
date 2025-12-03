/**
 * Accesses a nested record at the given path, returning both the current value and a setter function.
 *
 * @typeParam T The type of the value to be accessed.
 * 
 * @param obj The nested record to access
 * @param path An array of strings representing the path to the desired value
 * @returns A tuple containing:
 *   - `value`: The value at the path, or `undefined` if the path does not exist
 *   - `setValue`: A function that sets a new value at the path, creating intermediate objects as needed
 *
 * @example
 * const obj = { a: { b: { c: 42 } } };
 * const [value, setValue] = recordAccess<number>(obj, ['a', 'b', 'c']);
 * console.log(value); // 42
 * setValue(100);
 * console.log(obj.a.b.c); // 100
 */
export function recordAccess<T = unknown>(
    obj: Record<string, unknown>,
    ...path: Array<string|string[]>
): [T | undefined, (value: T) => void] {
    const flat_path = path.flat();

    let current: unknown = obj;
    for (const key of flat_path) {
        if (current == null || typeof current !== 'object') {
            current = (void 0);
            break;
        }
        current = (current as Record<string, unknown>)[key];
    }

    const setValue = (value: T): void => {
        if (flat_path.length === 0) {
            return;
        }

        let target: Record<string, unknown> = obj;

        for (let i = 0; i < flat_path.length-1; i++) {
            const key = flat_path[i];
            if (target[key] == null || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key] as Record<string, unknown>;
        }

        target[flat_path[flat_path.length-1]] = value;
    };

    return [current as T | undefined, setValue];
}