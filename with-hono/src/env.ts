import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    APP_PORT: z.coerce.number().default(3000),
    BILLING_CODE_NO: z.coerce.number().int().positive().default(100103),

    //start DB
    DB_HOST_1: z.string().default("localhost"),
    DB_PORT_1: z.coerce.number().int().positive().default(1433),
    DB_USER_1: z.string().default("sa"),
    DB_PASSWORD_1: z.string().default(""),
    DB_NAME_1: z.string().default("LosaGame"),
    DB_HOST_2: z.string().default("localhost"),
    DB_PORT_2: z.coerce.number().int().positive().default(1433),
    DB_USER_2: z.string().default("sa"),
    DB_PASSWORD_2: z.string().default(""),
    DB_NAME_2: z.string().default("LosaLogData"),
    DB_HOST_3: z.string().default("localhost"),
    DB_PORT_3: z.coerce.number().int().positive().default(1433),
    DB_USER_3: z.string().default("sa"),
    DB_PASSWORD_3: z.string().default(""),
    DB_NAME_3: z.string().default("LosaAdmin"),
    DB_ENCRYPT: z.coerce.boolean().default(true),
    DB_TRUST_SERVER_CERTIFICATE: z.coerce.boolean().default(true),
    DB_CONNECTION_TIMEOUT: z.coerce.number().int().positive().default(15000),

    //end DB
  },
  runtimeEnv: process.env,
});
