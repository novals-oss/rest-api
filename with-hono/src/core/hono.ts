import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import billingRoute from "../routes/billing.route.js";
import launcherRoute from "../routes/launcher.route.js";

const HonoApp = new Hono();

HonoApp.use(logger());
HonoApp.use(prettyJSON());
HonoApp.use(secureHeaders());

HonoApp.notFound((c) => c.json({ error: "Not Found" }, 404));

HonoApp.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  return c.json({ error: "Internal Server Error" }, 500);
});

HonoApp.route("/billing", billingRoute);
HonoApp.route("/launcher", launcherRoute);

showRoutes(HonoApp, {
  verbose: false,
  colorize: true,
});

export default HonoApp;
