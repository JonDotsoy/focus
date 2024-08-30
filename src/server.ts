import { Router, cors } from "artur";
import { configs } from "./configs.js";
import { styleText } from "@jondotsoy/style-text";
import { store, timers } from "./db/store.js";

const router = new Router({
  middlewares: [
    cors()
  ]
});

router.use("GET", "/timer", {
  fetch: async () => {
    return Response.json(await timers.getTimers());
  },
});

router.use("GET", "/timer/current", {
  fetch: async () => {
    const timer = await timers.currentTime();
    return Response.json(timer);
  },
});

router.use("POST", "/timer/stop", {
  fetch: async () => {
    const timer = await timers.stopTimer();
    return Response.json({});
  },
});

router.use("POST", "/timer", {
  fetch: async (req) => {
    const url = new URL(req.url);
    const title = url.searchParams.get("title");
    if (!title)
      return new Response(`Missing title on query params`, { status: 400 });

    const timer = await timers.createTimer(title);

    return Response.json(timer, { status: 201 });
  },
});

router.use("PUT", "/timer/note", {
  fetch: async (req) => {
    const url = new URL(req.url);
    const note = url.searchParams.get("note");
    if (!note)
      return new Response(`Missing note on query params`, { status: 400 });

    const timer = await timers.updateNote(note);

    return Response.json(timer, { status: 201 });
  },
});

const server = Bun.serve({
  hostname: configs.server.host,
  port: configs.server.port,
  fetch: async (req) =>
    (await router.fetch(req)) ?? new Response(null, { status: 404 }),
});

console.log(`Server ready on ${styleText("green", server.url.toString())}`);
