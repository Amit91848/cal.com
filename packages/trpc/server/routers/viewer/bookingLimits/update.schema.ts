import { z } from "zod";

import { intervalLimitsType } from "@calcom/prisma/zod-utils";

export const ZUpdateInputSchema = z.object({
  id: z.number().int().optional(),
  bookingLimits: intervalLimitsType.optional(),
});

export type TUpdateInputSchema = z.infer<typeof ZUpdateInputSchema>;
