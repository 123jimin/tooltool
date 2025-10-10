import { assert } from 'chai';
import { toAsyncGenerator, generatorToPromise } from './index.js';

describe('toAsyncGenerator', function () {
    it('should yield and return values correctly', async function () {
        const gen = toAsyncGenerator<number, string>(({ yeet, done }) => {
            yeet(1);
            yeet(2);
            done('finished');
        });

        assert.deepStrictEqual(await gen.next(), { value: 1, done: false });
        assert.deepStrictEqual(await gen.next(), { value: 2, done: false });
        assert.deepStrictEqual(await gen.next(), { value: 'finished', done: true });
    });

    it('should handle asynchronous events', async function () {
        const gen = toAsyncGenerator<string, number>(({ yeet, done }) => {
            setTimeout(() => yeet('a'), 10);
            setTimeout(() => yeet('b'), 20);
            setTimeout(() => done(42), 30);
        });

        const yields: string[] = [];
        let result;
        while (!(result = await gen.next()).done) {
            yields.push(result.value);
        }

        assert.deepStrictEqual(yields, ['a', 'b']);
        assert.strictEqual(result.value, 42);
    });

    it('should handle thrown errors via fail()', async function () {
        const error = new Error('test error');
        const gen = toAsyncGenerator(({ fail, done }) => {
            fail(error);
            done(null);
        });

        try {
            await gen.next();
            assert.fail('should have thrown');
        } catch (e) {
            assert.strictEqual(e, error);
        }
    });

    it('should handle errors thrown synchronously inside the executor', async function () {
        const error = new Error('sync error');
        const gen = toAsyncGenerator(() => {
            throw error;
        });

        try {
            await gen.next();
            assert.fail('should have thrown');
        } catch (e) {
            assert.strictEqual(e, error);
        }
    });

    it('should handle immediate done', async function () {
        const gen = toAsyncGenerator<never, string>(({ done }) => {
            done('immediate');
        });

        assert.deepStrictEqual(await gen.next(), { value: 'immediate', done: true });
    });
});

describe('generatorToPromise', function () {
    async function* testGenerator(): AsyncGenerator<number, string> {
        yield 1;
        yield 2;
        return 'done';
    }

    it('should resolve with the return value of the generator', async function () {
        const result = await generatorToPromise(testGenerator());
        assert.strictEqual(result, 'done');
    });

    it('should call onYeet for each yielded value and resolve with the return value', async function () {
        const yields: number[] = [];
        const result = await generatorToPromise(testGenerator(), (y) => yields.push(y));

        assert.deepStrictEqual(yields, [1, 2]);
        assert.strictEqual(result, 'done');
    });

    it('should reject if the generator throws', async function () {
        const yields: number[] = [];
        const error = new Error('generator error');
        async function* failingGenerator(): AsyncGenerator<number, string> {
            yield 1;
            yield 2;
            throw error;
        }

        try {
            await generatorToPromise(failingGenerator(), (y) => yields.push(y));
            assert.fail('should have rejected');
        } catch (e) {
            assert.deepStrictEqual(yields, [1, 2]);
            assert.strictEqual(e, error);
        }
    });

    it('should reject if onYeet throws', async function () {
        const onYeetError = new Error('onYeet failed');
        const onYeet = (y: number) => {
            if (y === 2) {
                throw onYeetError;
            }
        };

        try {
            await generatorToPromise(testGenerator(), onYeet);
            assert.fail('should have rejected');
        } catch (e) {
            assert.strictEqual(e, onYeetError);
        }
    });
});
