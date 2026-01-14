/**
 * Asserts that a code path is unreachable and throws if executed.
 * 
 * Use this for exhaustiveness checking in switch statements and conditional branches.
 * TypeScript will produce a compile error if all cases aren't handled.
 * 
 * This is particularly useful when avoiding `default` cases in switch statements,
 * as `default` would mask missing cases when new values are added to a union type.
 * 
 * @param value - A value that should be `never` if all cases are handled.
 * @throws Always throws an error indicating unreachable code was executed.
 * 
 * @example
 * type Fruit = 'apple' | 'banana' | 'cherry';
 * 
 * function getFruitColor(fruit: Fruit): string {
 *     switch (fruit) {
 *         case 'apple': return 'red';
 *         case 'banana': return 'yellow';
 *         case 'cherry': return 'red';
 *     }
 *
 *     return unreachable(fruit);
 * }
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