import { z } from "zod";

export const GetcashSchema = z.object({
  makeCodeNo: z.coerce.number().int().positive(),
  userNo: z.coerce.number().int().positive(),
  userId: z.string().min(4),
});

export const PaymentSchema = z.object({
  makeCodeNo: z.coerce.number().int().positive(),
  userNo: z.coerce.number().int().positive(),
  userId: z.string().min(4),
  charId: z.string(),
  clientIp: z.string().ip(),
  clientPort: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive(),
  itemCnt: z.coerce.number().int().positive(),
  itemUnitPrice: z.coerce.number().int().positive(),
  gameServerNo: z.coerce.number().int().positive(),
  worldNo: z.coerce.number().int().positive(),
  statProperty1: z.string().optional().default(""),
  statProperty2: z.string().optional().default(""),
  statProperty3: z.string().optional().default(""),
  location: z.literal("GAME"),
});
export const GiftPaymentSchema = PaymentSchema.extend({
  receiveUserNo: z.coerce.number().int().positive(),
  receiveUserId: z.string().min(4),
  receiveCharId: z.string(),
});

export type GetcashSchema = z.infer<typeof GetcashSchema>;
export type PaymentSchema = z.infer<typeof PaymentSchema>;
export type GiftPaymentSchema = z.infer<typeof GiftPaymentSchema>;
