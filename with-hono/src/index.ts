import { serve } from "@hono/node-server";
import { env } from "./env.js";
import HonoApp from "./core/hono.js";

serve(
  {
    fetch: HonoApp.fetch,
    port: env.APP_PORT,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
