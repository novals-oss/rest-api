import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { LosaGameDB } from "../db/LosaGame.js";
import bcrypt from "bcryptjs";
import { zValidator } from "@hono/zod-validator";
import { launcherSchema } from "../schemas/launcher.schema.js";
import launcherMiddleware from "../middleware/launcher.middleware.js";
import { Encode15 } from "../lib/ioencrypt/ioEcnrypt.js";
import { NationType } from "../lib/ioencrypt/seed_constant.js";

const launcherRoute = new Hono();

launcherRoute.use("*", launcherMiddleware);

launcherRoute.post(
  "/",
  zValidator("json", launcherSchema, (value, c) => {
    if (!value.success) {
      throw new HTTPException(400, {
        message: "Invalid Request",
      });
    }
  }),
  async (c) => {
    const { username, password, publicIP } = c.req.valid("json");

    //check server status

    const launcherInfo = await LosaGameDB.selectFrom("define_launcher_info")
      .orderBy("regDate", "desc")
      .selectAll()
      .executeTakeFirst();

    if (!launcherInfo) {
      throw new HTTPException(400, {
        message: "Failed to get launcher info. Please contact support.",
      });
    }

    if (launcherInfo.status !== 1) {
      //check whitelisted user
      const whiteListedUser = await LosaGameDB.selectFrom(
        "define_launcher_whitelist"
      )
        .where("username", "=", username.toLowerCase())
        .selectAll()
        .executeTakeFirst();

      if (!whiteListedUser) {
        throw new HTTPException(400, {
          message:
            "Server currently is under maintenance. Please try again later.",
        });
      }
    }

    //serverinfo
    const serverInfo = await LosaGameDB.selectFrom("define_game_server")
      .orderBy("regDate", "desc")
      .selectAll()
      .execute();

    if (!serverInfo || serverInfo.length === 0) {
      throw new HTTPException(400, {
        message: "Failed to get server info. Please contact support.",
      });
    }

    const serverKey = await LosaGameDB.selectFrom("define_encode_key")
      .orderBy("regDate", "desc")
      .selectAll()
      .executeTakeFirst();

    if (!serverKey) {
      throw new HTTPException(400, {
        message: "Failed to get server key. Please contact support.",
      });
    }

    const existUser = await LosaGameDB.selectFrom("userMemberDB")
      .where("userID", "=", username.toLowerCase())
      .innerJoin(
        "userLoginDB",
        "userLoginDB.accountIDX",
        "userMemberDB.accountIDX"
      )
      .innerJoin(
        "userGameDB",
        "userGameDB.accountIDX",
        "userMemberDB.accountIDX"
      )
      .selectAll()
      .executeTakeFirst();

    if (!existUser) {
      throw new HTTPException(404, {
        message: "Account not found.",
      });
    }

    if (existUser.limitType === 100) {
      throw new HTTPException(400, {
        message: `Your account has been banned until ${existUser.limitDate.toLocaleString()}.\nPlease contact support for more information.`,
      });
    }

    const isValidPassword = await bcrypt.compare(password, existUser.userPWD);

    if (!isValidPassword) {
      throw new HTTPException(400, {
        message: "Invalid password.",
      });
    }

    const updateLogin = await LosaGameDB.updateTable("userLoginDB")
      .set({
        userIP: publicIP,
        connDate: new Date(),
      })
      .where("userLoginDB.accountIDX", "=", existUser.accountIDX)
      .executeTakeFirst();

    if (!updateLogin) {
      console.error("Failed to update login info!", username);
      throw new HTTPException(500, {
        message: "Failed to update login info!",
      });
    }

    //enable this if you want to skip tutorial step in game
    if (existUser?.userState >= 0) {
      const updateState = await LosaGameDB.updateTable("userGameDB")
        .set({
          userState: -1,
        })
        .where("userGameDB.accountIDX", "=", existUser.accountIDX)
        .outputAll("inserted")
        .executeTakeFirst();

      if (!updateState) {
        console.error("Failed to update user state!", username);
        throw new HTTPException(500, {
          message: "Failed to update user state!",
        });
      }
    }

    const randSvrID = serverInfo[Math.floor(Math.random() * serverInfo.length)];

    const encryptedUserKey = Encode15(
      existUser.encodeKey,
      serverKey.encodeKey,
      NationType.NT_KOREA
    );

    const ecnryptedUserID = Encode15(
      existUser.userID,
      serverKey.encodeKey,
      NationType.NT_KOREA
    );

    const encryptedUserIP = Encode15(
      publicIP,
      serverKey.encodeKey,
      NationType.NT_KOREA
    );

    let result = `EDEW3940FVDP4950,10,20,30,1,autoupgrade_info.ini,1000,0,1,0,?${encryptedUserKey}${ecnryptedUserID}?0?${encryptedUserKey}${encryptedUserIP}?${randSvrID}?2010,7,15,1?10201?`;

    return c.json({
      message: "success",
      AppName: "lostsaga.exe", //lostsaga.exe
      result,
    });
  }
);

export default launcherRoute;
