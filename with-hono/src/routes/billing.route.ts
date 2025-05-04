import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import {
  GetcashSchema,
  GiftPaymentSchema,
  PaymentSchema,
} from "../schemas/billing.schema.js";
import {
  getUserWithValidation,
  throwIfInvalidMakeCodeNo,
  updateUserCash,
} from "../utils/billing.util.js";

const billingRoute = new Hono();

billingRoute.post(
  "/getcash",
  zValidator("form", GetcashSchema, (value) => {
    if (!value.success)
      throw new HTTPException(400, { message: "Invalid Request" });
  }),
  async (c) => {
    const { makeCodeNo, userId, userNo } = c.req.valid("form");
    throwIfInvalidMakeCodeNo(makeCodeNo);

    const user = await getUserWithValidation(userNo, userId);

    return c.json({
      result: "success",
      userNo: user.accountIDX,
      realCash: user.amtCash,
      bonusCash: 0,
    });
  }
);

billingRoute.post(
  "/payment",
  zValidator("form", PaymentSchema, (value) => {
    console.log(value);
    if (!value.success)
      throw new HTTPException(400, { message: "Invalid Request" });
  }),
  async (c) => {
    const data = c.req.valid("form");
    throwIfInvalidMakeCodeNo(data.makeCodeNo);

    const total = data.itemUnitPrice * data.itemCnt;

    if (!Number.isSafeInteger(total)) {
      throw new HTTPException(400, {
        message: "Invalid payment amount",
      });
    }

    const user = await getUserWithValidation(
      data.userNo,
      data.userId,
      data.charId
    );

    if (user.amtCash < total) {
      throw new HTTPException(400, { message: "Not enough cash" });
    }

    const decresedCash = user.amtCash - total;

    const updated = await updateUserCash(user.accountIDX, decresedCash);

    return c.json({
      result: "success",
      userNo: user.accountIDX,
      realCash: updated.amtCash,
      bonusCash: 0,
      chargedCashAmt: total,
      itemInfos: [
        {
          itemID: data.itemId,
          itemCnt: data.itemCnt,
          itemPrice: data.itemUnitPrice,
          chargeNo: Date.now(),
        },
      ],
    });
  }
);

billingRoute.post(
  "/gift",
  zValidator("form", GiftPaymentSchema, (value) => {
    if (!value.success)
      throw new HTTPException(400, { message: "Invalid Request" });
  }),
  async (c) => {
    const data = c.req.valid("form");
    throwIfInvalidMakeCodeNo(data.makeCodeNo);

    const total = data.itemCnt * data.itemUnitPrice;

    if (!Number.isSafeInteger(total)) {
      throw new HTTPException(400, {
        message: "Invalid payment amount",
      });
    }

    const sender = await getUserWithValidation(
      data.userNo,
      data.userId,
      data.charId
    );

    if (sender.amtCash < total) {
      throw new HTTPException(400, { message: "Not enough cash" });
    }

    const receiver = await getUserWithValidation(
      data.receiveUserNo,
      data.receiveUserId,
      data.receiveCharId
    );

    const decresedCash = sender.amtCash - total;

    const updated = await updateUserCash(sender.accountIDX, decresedCash);

    return c.json({
      result: "success",
      userNo: sender.accountIDX,
      realCash: updated.amtCash,
      bonusCash: 0,
      chargedCashAmt: total,
      itemInfos: [
        {
          itemID: data.itemId,
          itemCnt: data.itemCnt,
          itemPrice: data.itemUnitPrice,
          chargeNo: Date.now(),
        },
      ],
    });
  }
);

export default billingRoute;
