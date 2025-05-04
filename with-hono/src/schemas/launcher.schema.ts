import { z } from "zod";

export const launcherSchema = z.object({
  username: z
    .string()
    .toLowerCase()
    .min(4, {
      message: "Username must be at least 4 characters.",
    })
    .max(16, {
      message: "Username must be less than 16 characters.",
    })
    .regex(/^[a-zA-Z0-9]+$/, {
      message: "Username can only contain letters and numbers.",
    }),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters long",
    })
    .max(16, {
      message: "Password must be less than 16 characters.",
    }),
  publicIP: z.string().ip({
    version: "v4",
    message: "Invalid IP Address",
  }),
});

export type launcherSchema = z.infer<typeof launcherSchema>;
