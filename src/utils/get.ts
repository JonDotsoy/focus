export const get = (obj: unknown, ...paths: PropertyKey[]): unknown => {
  if (paths.length === 0) return obj;
  const isObj = typeof obj === "object" && obj !== null;
  if (!isObj) return undefined;
  const [path, ...nextPaths] = paths;
  return get(Reflect.get(obj, path), ...nextPaths);
};

const types = [
  "string",
  "number",
  "boolean",
  "function",
  "bigint",
  "symbol",
] as const;
const createValidatorPrimitiveType =
  <T>(type: (typeof types)[number]) =>
  (obj: unknown, ...paths: PropertyKey[]): undefined | T => {
    const value = get(obj, ...paths);
    if (typeof value !== type) return undefined;
    return value as T;
  };

const createValidatorCustomType =
  <T>(test: (value: unknown) => boolean) =>
  (obj: unknown, ...paths: PropertyKey[]): undefined | T => {
    const value = get(obj, ...paths);
    if (!test(value)) return undefined;
    return value as T;
  };

get.string = createValidatorPrimitiveType<string>("string");
get.number = createValidatorPrimitiveType<number>("number");
get.boolean = createValidatorPrimitiveType<boolean>("boolean");
get.function = createValidatorPrimitiveType<Function>("function");
get.bigint = createValidatorPrimitiveType<bigint>("bigint");
get.symbol = createValidatorPrimitiveType<symbol>("symbol");
get.array = createValidatorCustomType<Array<unknown>>((value) =>
  Array.isArray(value),
);
get.date = createValidatorCustomType<Date>((value) => {
  if (value instanceof Date) return true;
  if (typeof value === "string") return !isNaN(Date.parse(value));
  return false;
});
