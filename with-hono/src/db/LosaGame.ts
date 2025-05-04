import type { LosaGame } from "./types/LosaGame.js";
import * as tedious from "tedious";
import * as tarn from "tarn";
import { Kysely, MssqlDialect } from "kysely";
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
            password: env.DB_PASSWORD_1,
            userName: env.DB_USER_1,
          },
          type: "default",
        },
        options: {
          database: env.DB_NAME_1,
          port: env.DB_PORT_1,
          encrypt: env.DB_ENCRYPT,
          trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
        },
        server: env.DB_HOST_1,
      }),
  },
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const LosaGameDB = new Kysely<LosaGame>({
  dialect,
  log: ["error"],
});
