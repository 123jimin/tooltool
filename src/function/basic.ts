/**
 * Delay for a given amount of time.
 * @param time_ms Time to delay in milliseconds.
 */
export async function delay(time_ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => { resolve(); }, time_ms);
    });
}

/**
 * Call a function and return its return value.
 * @param fn Function to call.
 * @returns The return value of the function.
 */
export function call<ReturnType>(fn: () => ReturnType): ReturnType {
    return fn();
}