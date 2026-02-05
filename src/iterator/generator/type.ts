/**
 * Represents a yield event in an async generator execution.
 * 
 * @typeParam Y - The type of the yielded value
 * 
 * @see {@link AsyncEvent}
 * @see {@link AsyncGeneratorExecutor}
 */
export type AsyncYieldEvent<Y> = {type: 'yield'; value: Y};

/**
 * Represents a return event in an async generator execution.
 * 
 * @typeParam R - The type of the return value
 * 
 * @see {@link AsyncEvent}
 * @see {@link AsyncGeneratorExecutor}
 */
export type AsyncReturnEvent<R> = {type: 'return'; value: R};

/**
 * Represents a throw (error) event in an async generator execution.
 * 
 * @typeParam T - The type of the thrown value/error (default: `unknown`)
 * 
 * @see {@link AsyncEvent}
 * @see {@link AsyncGeneratorExecutor}
 */
export type AsyncThrowEvent<T=unknown> = {type: 'throw'; value: T};

/**
 * Union type representing all possible events in an async generator execution.
 * 
 * An event can be:
 * - A {@link AsyncYieldEvent | yield event} - producing a value
 * - A {@link AsyncReturnEvent | return event} - completing with a final value
 * - A {@link AsyncThrowEvent | throw event} - throwing an error
 * 
 * @typeParam Y - The type of yielded values
 * @typeParam R - The type of the return value
 * @typeParam T - The type of thrown values/errors (default: `unknown`)
 * 
 * @see {@link AsyncGeneratorExecutor}
 */
export type AsyncEvent<Y, R, T=unknown> = AsyncYieldEvent<Y> | AsyncReturnEvent<R> | AsyncThrowEvent<T>;
