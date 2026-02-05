/** A yield event. @typeParam Y - Yielded value type. */
export type AsyncYieldEvent<Y> = {type: 'yield'; value: Y};

/** A return event. @typeParam R - Return value type. */
export type AsyncReturnEvent<R> = {type: 'return'; value: R};

/** A throw event. @typeParam T - Error type (default: `unknown`). */
export type AsyncThrowEvent<T=unknown> = {type: 'throw'; value: T};

/**
 * Union of generator events: yield, return, or throw.
 *
 * @typeParam Y - Yielded value type.
 * @typeParam R - Return value type.
 * @typeParam T - Error type (default: `unknown`).
 */
export type AsyncEvent<Y, R, T=unknown> = AsyncYieldEvent<Y> | AsyncReturnEvent<R> | AsyncThrowEvent<T>;
