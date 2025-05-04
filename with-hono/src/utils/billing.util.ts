import { HTTPException } from "hono/http-exception";
import { env } from "../env.js";
import { LosaGameDB } from "../db/LosaGame.js";

export const throwIfInvalidMakeCodeNo = (makeCodeNo: number) => {
  if (makeCodeNo !== env.BILLING_CODE_NO) {
    throw new HTTPException(400, { message: "Invalid makeCodeNo" });
  }
};

export const getUserWithValidation = async (
  userNo: number,
  userID: string,
  nickName?: string
) => {
  const user = await LosaGameDB.selectFrom("userMemberDB")
    .innerJoin("userCashDB", "userMemberDB.accountIDX", "userCashDB.accountIDX")
    .innerJoin(
      "userLoginDB",
      "userMemberDB.accountIDX",
      "userLoginDB.accountIDX"
    )
    .where("userMemberDB.accountIDX", "=", userNo)
    .where("userID", "=", userID.toLowerCase())
    .selectAll()
    .executeTakeFirst();

  if (!user || (nickName && user.nickName !== nickName)) {
    throw new HTTPException(400, { message: "Invalid user" });
  }
  if (user.limitType === 100) {
    throw new HTTPException(400, { message: "Account has been banned" });
  }
  if (user.gameServerID <= 0) {
    throw new HTTPException(400, { message: "User has not logged in yet" });
  }

  return user;
};

export const updateUserCash = async (accountIDX: number, newAmt: number) => {
  const updated = await LosaGameDB.updateTable("userCashDB")
    .set({ amtCash: newAmt })
    .where("userCashDB.accountIDX", "=", accountIDX)
    .outputAll("inserted")
    .executeTakeFirst();

  if (!updated) {
    throw new HTTPException(500, { message: "Failed to update cash" });
  }

  return updated;
};
