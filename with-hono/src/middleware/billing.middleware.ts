import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { LosaAdminDB } from "../db/LosaAdmin.js";

const billingMiddleware = createMiddleware(async (c, next) => {
  const Authorization = c.req.header("Authorization");

  if (!Authorization) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }

  const token = Authorization.split(" ")[1];
  const tokenFromDB = await LosaAdminDB.selectFrom("service_security_key")
    .where("type", "=", "billing")
    .selectAll()
    .executeTakeFirst();

  if (!token || token !== tokenFromDB?.token) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }

  await next();
});

export default billingMiddleware;
