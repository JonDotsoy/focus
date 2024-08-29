export const get = (obj: unknown, ...paths: PropertyKey[]): unknown => {
  if (paths.length === 0) return obj;
  const isObj = typeof obj === "object" && obj !== null;
  if (!isObj) return undefined;
  const [path, ...nextPaths] = paths;
  return get(Reflect.get(obj, path), ...nextPaths);
};

get.string = (obj: unknown, ...paths: PropertyKey[]) => {
  const value = get(obj, ...paths);
  if (typeof value !== "string") return undefined;
  return value;
};

get.number = (obj: unknown, ...paths: PropertyKey[]) => {
  const value = get(obj, ...paths);
  if (typeof value !== "number") return undefined;
  return value;
};
