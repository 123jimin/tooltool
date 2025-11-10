export function range(start: number, end?: number, step?: number): Generator<number>;
export function range(start: bigint, end?: bigint, step?: bigint): Generator<bigint>;
export function* range(raw_start: number|bigint, raw_end?: number|bigint, raw_step?: number|bigint): Generator<number|bigint> {
    if(typeof raw_start === 'bigint') {
        if(raw_end == null) {
            raw_end = raw_start;
            raw_start = 0n;
        }

        const start = BigInt(raw_start);
        const end = BigInt(raw_end);
        const step = raw_step == null ? (start <= end ? 1n : -1n) : BigInt(raw_step);

        if(step === 0n) throw new Error("Step cannot be zero.");
        if(step > 0n) {
            for(let i = start; i < end; i += step) {
                yield i;
            }
        } else {
            for(let i = start; i > end; i += step) {
                yield i;
            }
        }
    } else {
        if(raw_end == null) {
            raw_end = raw_start;
            raw_start = 0;
        }

        const start = Number(raw_start);
        const end = Number(raw_end);
        const step = raw_step == null ? (start <= end ? 1 : -1) : Number(raw_step);

        if(step === 0) throw new Error("Step cannot be zero.");
        if(step > 0) {
            for(let i = start; i < end; i += step) {
                yield i;
            }
        } else {
            for(let i = start; i > end; i += step) {
                yield i;
            }
        }
    }
}