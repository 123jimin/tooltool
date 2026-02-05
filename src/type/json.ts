/** A JSON scalar: `null`, `boolean`, `number`, or `string`. */
export type JSONScalar = null | boolean | number | string;

/** A JSON array. */
export type JSONArray = JSONValue[];

/** A JSON object. */
export type JSONObject = { [key: string]: JSONValue };

/** Any valid JSON value. */
export type JSONValue = JSONScalar | JSONArray | JSONObject;