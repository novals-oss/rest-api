import * as tedious from "tedious";
import * as tarn from "tarn";
import { Kysely, MssqlDialect } from "kysely";
import type { LosaAdmin } from "./types/LosaAdmin.js";
import { env } from "../env.js";

const dialect = new MssqlDialect({
  tarn: {
    ...tarn,
    options: {
      min: 0,
      max: 10,
    },
  },
  tedious: {
    ...tedious,
    connectionFactory: () =>
      new tedious.Connection({
        authentication: {
          options: {
            password: env.DB_PASSWORD_3,
            userName: env.DB_USER_3,
          },
          type: "default",
        },
        options: {
          database: env.DB_NAME_3,
          port: env.DB_PORT_3,
          encrypt: env.DB_ENCRYPT,
          trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
        },
        server: env.DB_HOST_3,
      }),
  },
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const LosaAdminDB = new Kysely<LosaAdmin>({
  dialect,
});
