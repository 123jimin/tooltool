import {assertEqualType, type RecursivePartial} from "./index.ts";

describe("type/index", () => {
    describe("RecursivePartial", () => {
        it("should work as advertised", () => {
            assertEqualType<
                RecursivePartial<{settings?: {theme: string; size: number}|null}>,
                {settings?: {theme?: string; size?: number}|null}
            >();
        });

        it("recurses through optional and nullable nested properties without dropping nullish members", () => {
            type Source = {
                settings?: {
                    palette: {accent: string; background: string}|null|undefined;
                    enabled: boolean;
                }|null;
            };
            type Expected = {
                settings?: {
                    palette?: {accent?: string; background?: string}|null|undefined;
                    enabled?: boolean;
                }|null;
            };
            assertEqualType<RecursivePartial<Source>, Expected>();
            assertEqualType<RecursivePartial<Source|null|undefined>, Expected|null|undefined>();
        });

        it("retains primitive union members while making object members partial", () => {
            assertEqualType<
                RecursivePartial<{value: string; nested: {count: number}}|false|null>,
                {value?: string; nested?: {count?: number}}|false|null
            >();
        });

        it("keeps mutable arrays and recursively transforms their nullable elements", () => {
            assertEqualType<
                RecursivePartial<Array<{id: number; details?: {label: string; count: number}|null}|null>|undefined>,
                Array<{id?: number; details?: {label?: string; count?: number}|null}|null>|undefined
            >();
            assertEqualType<
                RecursivePartial<[{id: number}, {name: string}]>,
                Array<{id?: number}|{name?: string}>
            >();
        });

        it("preserves readonly mapped-array and tuple behavior", () => {
            assertEqualType<
                RecursivePartial<readonly {id: number}[]>,
                readonly ({id?: number}|undefined)[]
            >();
            assertEqualType<
                RecursivePartial<readonly [{id: number}, {name: string}]>,
                readonly [{id?: number}?, {name?: string}?]
            >();
        });
    });
});
