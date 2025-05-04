import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { LosaAdminDB } from "../db/LosaAdmin.js";

const launcherMiddleware = createMiddleware(async (c, next) => {
  const Authorization = c.req.header("Authorization");

  if (!Authorization) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }

  const token = Authorization.split(" ")[1];
  const tokenFromDB = await LosaAdminDB.selectFrom("service_security_key")
    .where("type", "=", "launcher")
    .selectAll()
    .executeTakeFirst();

  if (!token || token !== tokenFromDB?.token) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }

  await next();
});

export default launcherMiddleware;
