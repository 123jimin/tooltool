/**
 * Represents a JSON scalar value.
 */
export type JSONScalar = null | boolean | number | string;

/**
 * Represents a JSON array.
 */
export type JSONArray = JSONValue[];

/**
 * Represents a JSON object.
 */
export type JSONObject = { [key: string]: JSONValue };

/**
 * Represents any valid JSON value.
 */
export type JSONValue = JSONScalar | JSONArray | JSONObject;