import * as tedious from "tedious";
import * as tarn from "tarn";
import { Kysely, MssqlDialect } from "kysely";
import type { LosaGame_Log } from "./types/LosaGame_Log.js";

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
            password: "password",
            userName: "username",
          },
          type: "default",
        },
        options: {
          database: "some_db",
          port: 1433,
          trustServerCertificate: true,
        },
        server: "localhost",
      }),
  },
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const LosaGameLogDB = new Kysely<LosaGame_Log>({
  dialect,
});
