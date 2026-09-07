/** A JSON scalar shape; `number` cannot exclude non-finite values at the type level. */
export type JSONScalar = null | boolean | number | string;

/** A JSON array. */
export type JSONArray = JSONValue[];

/** A JSON object. */
export type JSONObject = {[key: string]: JSONValue};

/**
 * Represents the recursive shape of JSON data.
 *
 * @remarks
 * Does not validate runtime serializability, finite numbers, or absence of cycles.
 */
export type JSONValue = JSONScalar | JSONArray | JSONObject;
