/**
 * Asserts that a code path is unreachable; throws if executed.
 *
 * Use for exhaustiveness checking in switch statements. TypeScript will error
 * if all cases aren't handled.
 *
 * @param value - Should be `never` if all cases are handled.
 * @throws Always throws with the unexpected value.
 *
 * @example
 * ```ts
 * type Fruit = 'apple' | 'banana';
 *
 * function getColor(fruit: Fruit): string {
 *     switch (fruit) {
 *         case 'apple': return 'red';
 *         case 'banana': return 'yellow';
 *     }
 *     return unreachable(fruit); // Compile error if case missing
 * }
 * ```
 */
export function unreachable(value: never): never {
    const unk_value = value as unknown;
    let repr: string;
    
    if((typeof unk_value === 'object') && unk_value !== null) {
        try {
            repr = JSON.stringify(unk_value);
        } catch {
            repr = String(unk_value);
        }
    } else {
        repr = String(unk_value);
    }

    throw new Error(`Unreachable code reached with value: '${repr}'`);
}