import { NestedArray } from "../type";

export type TransformFunction<T> = (t: T) => T|undefined;
export type TransformAsyncFunction<T> = (t: T) => Promise<T|undefined>;

export function applyTransforms<T>(obj: T, ...fns: NestedArray<TransformFunction<T>>): T {
    for(const fn of fns) {
        if(Array.isArray(fn)) {
            obj = applyTransforms(obj, ...fn);
        } else {
            const res = fn(obj);
            if(res !== (void 0)) obj = res;
        }
    }

    return obj;
}

export async function applyAsyncTransforms<T>(obj: T, ...fns: NestedArray<TransformAsyncFunction<T>|TransformFunction<T>>): Promise<T> {
    for(const fn of fns) {
        if(Array.isArray(fn)) {
            obj = await applyAsyncTransforms(obj, ...fn);
        } else {
            const res = await fn(obj);
            if(res !== (void 0)) obj = res;
        }
    }

    return obj;
}