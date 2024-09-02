import { cors, Router } from "artur";
import { get } from "./get.js";

const resultOrError = <T>(
  promise: T | Promise<T>,
): Promise<[unknown, never] | [null, T]> =>
  Promise.resolve(promise)
    .then((r) => [null, r])
    .catch((e) => [e, null]) as any;

type LikeURL = { toString(): string };

type RPCService<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends (...args: infer A) => infer R
        ? (...args: A) => Promise<Awaited<R>>
        : never;
      // T[K] //(...args: Parameters<T[K]>) => Promise<Awaited<ReturnType<T[K]>>>
    }
  : never;

export const createHTTPServer = async <T>(service: T | Promise<T>) => {
  const serviceCore = await service;

  const router = new Router({
    middlewares: [
      cors({
        origin: "http://localhost:1420",
      }),
    ],
  });

  router.use("POST", "/invoke", {
    fetch: async (req) => {
      const url = new URL(req.url);

      const serviceName = url.searchParams.get("function");
      if (!serviceName)
        return Response.json(
          { error: "Missing function name" },
          { status: 400 },
        );

      const body = await req.json();

      const args = get.array(body, "args") ?? [];
      const service = get.function(serviceCore, serviceName);
      if (!service)
        return Response.json(
          { error: `Function ${serviceName} not found` },
          { status: 404 },
        );

      const [error, result] = await resultOrError(service(...args));

      if (error) {
        console.error(error);
        if (error instanceof Error)
          return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ error: "unknown error" }, { status: 500 });
      }

      return Response.json({ result });
    },
  });

  return router;
};

export const createHTTPClient = <T>(url: LikeURL): RPCService<T> => {
  const baseURL = new URL(url.toString());
  const invokeFunction = async (functionName: string, args: any[]) => {
    const url = new URL("./invoke", baseURL);
    url.searchParams.set("function", functionName);
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ args }),
    });

    const payload = await res.json();
    const error = get.string(payload, "error");
    const result = get(payload, "result");
    if (error) throw new Error(error);
    return result;
  };

  const t: any = new Proxy(
    {},
    {
      get(_, functionName: string) {
        if (functionName === "then") return;
        if (typeof functionName !== "string") return;

        return (...args: any[]) => invokeFunction(functionName, args);
      },
    },
  );

  return t;
};
