import {assert} from "chai";
import ts from "typescript";

import {
    createExponentialBackoffDelay,
    getDelayForExponentialBackoff,
    type RetryInfo,
    retryWithDelay,
} from "./retry.ts";

function getRetryTypeWitnesses(): Record<string, string> {
    const virtual_path = ts.sys.resolvePath("src/function/retry-type-regression.ts").replaceAll("\\", "/");
    const source = `
        import {createExponentialBackoffDelay, retryWithDelay} from "./retry.ts";
        const options = {init_delay: 0, max_attempts: 1};
        const delay = createExponentialBackoffDelay(options);
        const result = retryWithDelay(async () => 42, delay);
        const unlimited_delay = createExponentialBackoffDelay({init_delay: 0, max_attempts: 0});
        type DelayCanForfeit = boolean extends Awaited<ReturnType<typeof delay>> ? true : false;
        type RetryCanBeNull = null extends Awaited<typeof result> ? true : false;
        type UnlimitedDelayIsVoid = void extends Awaited<ReturnType<typeof unlimited_delay>> ? true : false;
    `;
    const options: ts.CompilerOptions = {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        strict: true,
        noEmit: true,
        allowImportingTsExtensions: true,
        skipLibCheck: true,
        types: [],
    };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile;
    host.getSourceFile = (file_name, language_version, on_error, should_create_new_source_file) =>
        file_name.replaceAll("\\", "/") === virtual_path
            ? ts.createSourceFile(file_name, source, language_version, true)
            : getSourceFile(file_name, language_version, on_error, should_create_new_source_file);
    const program = ts.createProgram([virtual_path], options, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.deepStrictEqual(diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")), []);
    const checker = program.getTypeChecker();
    const witnesses: Record<string, string> = {};
    for(const statement of program.getSourceFile(virtual_path)!.statements) {
        if(ts.isTypeAliasDeclaration(statement)) {
            witnesses[statement.name.text] = checker.typeToString(checker.getTypeAtLocation(statement.name));
        }
    }
    return witnesses;
}

describe("function/retry", () => {
    describe("retryWithDelay", () => {
        it("should work as advertised", async () => {
            let calls = 0;
            const result = await retryWithDelay(async () => {
                if(++calls < 3) throw new Error("temporary failure");
                return "ready";
            }, createExponentialBackoffDelay({init_delay: 0, max_attempts: 3}));
            assert.strictEqual(result, "ready");
            assert.strictEqual(calls, 3);
        });

        it("should return an initial success without invoking the delay", async () => {
            const result = await retryWithDelay(async (info) => {
                assert.strictEqual(info.attempts, 0);
                assert.strictEqual(info.error, void 0);
                return 42;
            }, async () => { assert.fail("a successful attempt must not trigger a delay"); });
            assert.strictEqual(result, 42);
        });

        it("should pass the latest failure and failure count to subsequent attempts", async () => {
            const errors = [new Error("first failure"), new Error("second failure")];
            const attempts: RetryInfo[] = [];
            const delays: RetryInfo[] = [];
            const result = await retryWithDelay(async (info) => {
                attempts.push({...info});
                if(info.attempts < errors.length) throw errors[info.attempts];
                return "done";
            }, async (info) => { delays.push({...info}); });
            assert.strictEqual(result, "done");
            assert.deepStrictEqual(attempts, [
                {attempts: 0},
                {attempts: 1, error: errors[0]},
                {attempts: 2, error: errors[1]},
            ]);
            assert.deepStrictEqual(delays, attempts.slice(1));
        });

        it("should stop immediately when the delay forfeits", async () => {
            let calls = 0;
            const result = await retryWithDelay(async () => {
                ++calls;
                throw new Error("stop");
            }, async () => false);
            assert.strictEqual(result, null);
            assert.strictEqual(calls, 1);
        });

        it("should propagate delay errors without retrying them", async () => {
            const error = new Error("delay failed");
            let calls = 0;
            await retryWithDelay(async () => {
                ++calls;
                throw new Error("attempt failed");
            }, async () => { throw error; }).then(
                () => assert.fail("expected delay rejection"),
                (reason: unknown) => { assert.strictEqual(reason, error); },
            );
            assert.strictEqual(calls, 1);
        });
    });

    describe("createExponentialBackoffDelay", () => {
        it("should work as advertised", async () => {
            let calls = 0;
            const delay = createExponentialBackoffDelay({init_delay: 0, max_attempts: 5});
            const result = await retryWithDelay(async () => {
                ++calls;
                throw new Error("unavailable");
            }, delay);
            assert.strictEqual(result, null);
            assert.strictEqual(calls, 5);
        });

        it("should count the initial call toward the attempt limit and forfeit without sleeping", async () => {
            const timeout_descriptor = Object.getOwnPropertyDescriptor(globalThis, "setTimeout")!;
            let sleeps = 0;
            Object.defineProperty(globalThis, "setTimeout", {
                configurable: true,
                value: (callback: () => void) => {
                    ++sleeps;
                    queueMicrotask(callback);
                    return 0;
                },
            });
            try {
                let calls = 0;
                const result = await retryWithDelay(async () => {
                    ++calls;
                    throw new Error("only attempt");
                }, createExponentialBackoffDelay({init_delay: 10, max_attempts: 1}));
                assert.strictEqual(result, null);
                assert.strictEqual(calls, 1);
                assert.strictEqual(sleeps, 0);
            } finally {
                Object.defineProperty(globalThis, "setTimeout", timeout_descriptor);
            }
        });

        it("should keep retrying when max_attempts is nonpositive", async () => {
            for(const max_attempts of [0, -1]) {
                let calls = 0;
                const result = await retryWithDelay(async () => {
                    if(++calls < 3) throw new Error("retry");
                    return "recovered";
                }, createExponentialBackoffDelay({init_delay: 0, max_attempts}));
                assert.strictEqual(result, "recovered");
                assert.strictEqual(calls, 3);
            }
        });
    });

    describe("getDelayForExponentialBackoff", () => {
        it("should grow from the initial delay and remain capped at max_delay", () => {
            const options = {init_delay: 10, multiplier: 3, max_delay: 80};
            assert.deepStrictEqual([1, 2, 3, 4].map((attempts) => getDelayForExponentialBackoff(options, attempts)), [10, 30, 80, 80]);
            assert.strictEqual(getDelayForExponentialBackoff({init_delay: 100, max_delay: 20}, 1), 20);
            assert.strictEqual(getDelayForExponentialBackoff({init_delay: 10}, 4), 80);
        });
    });

    context("deferred overload regressions", () => {
        let witnesses: Record<string, string>;
        before(function () {
            this.timeout(10_000);
            witnesses = getRetryTypeWitnesses();
        });

        it("should infer a boolean-capable delay for an options variable with positive max_attempts", () => {
            assert.strictEqual(witnesses["DelayCanForfeit"], "true");
        });

        it("should infer a nullable retry result for an options variable with positive max_attempts", () => {
            assert.strictEqual(witnesses["RetryCanBeNull"], "true");
        });

        it("should infer a void delay for a nonpositive max_attempts literal, matching unlimited runtime behavior", () => {
            assert.strictEqual(witnesses["UnlimitedDelayIsVoid"], "true");
        });
    });
});
