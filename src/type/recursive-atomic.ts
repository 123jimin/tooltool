// Shared structural classification for recursive types; not part of the public barrel.
export type RecursiveAtomic =
    Date
    |RegExp
    |ReadonlyMap<unknown, unknown>
    |ReadonlySet<unknown>
    |((...args: never[]) => unknown);
