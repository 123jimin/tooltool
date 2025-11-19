export interface CachedFunction<ArgsType extends unknown[], ReturnType> {
    (...args: ArgsType): Promise<ReturnType>;
}

export function cached<ArgsType extends unknown[], T>(
    fn: (...args: ArgsType) => Promise<T>,

): CachedFunction<ArgsType, T> {
    throw new Error("Not yet implemented!");
}