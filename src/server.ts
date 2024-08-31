import { configs } from "./configs.js";
import { styleText } from "@jondotsoy/style-text";
import { serviceGenerator as createRouterService } from "./utils/service_generator.js";

const serviceRouter = await createRouterService(import("./services.js"));

const server = Bun.serve({
  hostname: configs.server.host,
  port: configs.server.port,
  fetch: async (req) =>
    (await serviceRouter.fetch(req)) ?? new Response(null, { status: 404 }),
});

console.log(`Server ready on ${styleText("green", server.url.toString())}`);
