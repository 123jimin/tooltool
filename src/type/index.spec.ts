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

        it("preserves disjoint object union branches", () => {
            type Source =
                {kind: "left"; left: {value: number}}
                |{kind: "right"; right: {label: string}};
            assertEqualType<
                RecursivePartial<Source>,
                {kind?: "left"; left?: {value?: number}}
                |{kind?: "right"; right?: {label?: string}}
            >();

            // @ts-expect-error A known discriminator must retain its matching branch.
            ({kind: "left", right: {}} satisfies RecursivePartial<Source>);
        });

        it("preserves atomic built-ins and callable signatures through optional unions", () => {
            type Atomic =
                Date
                |RegExp
                |Map<string, {value: number}>
                |ReadonlyMap<string, {value: number}>
                |Set<{value: number}>
                |ReadonlySet<{value: number}>
                |((value: number) => string);
            assertEqualType<RecursivePartial<Atomic>, Atomic>();
            assertEqualType<
                RecursivePartial<{nested?: {value: Atomic|null; enabled: boolean}|null}>,
                {nested?: {value?: Atomic|null; enabled?: boolean}|null}
            >();
        });

        it("makes structural data optional without removing method call signatures", () => {
            type Source = {
                value: number;
                format(radix: number): string;
            };
            assertEqualType<
                RecursivePartial<Source>,
                {value?: number; format?: (radix: number) => string}
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

        it("keeps array union branches separate instead of mixing their elements", () => {
            type Source =
                Array<{kind: "left"; value: number}>
                |Array<{kind: "right"; label: string}>;
            assertEqualType<
                RecursivePartial<Source>,
                Array<{kind?: "left"; value?: number}>
                |Array<{kind?: "right"; label?: string}>
            >();

            // @ts-expect-error One array cannot mix elements from distinct array branches.
            ([{kind: "left"}, {kind: "right"}] satisfies RecursivePartial<Source>);
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

        it("preserves never and unknown", () => {
            assertEqualType<RecursivePartial<never>, never>();
            assertEqualType<RecursivePartial<unknown>, unknown>();
        });
    });
});
