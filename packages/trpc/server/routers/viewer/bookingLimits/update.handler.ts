import { prisma } from "@calcom/prisma";

import type { TrpcSessionUser } from "../../../trpc";
import type { TUpdateInputSchema } from "./update.schema";

type UpdateOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TUpdateInputSchema;
};

export const updateHandler = async ({ ctx, input }: UpdateOptions) => {
  console.log("reached updated Handler log");
  const { id, bookingLimits, ...rest } = input;

  // const limits = await prisma.bookingLimits.findFirst({
  //   where: {
  //     id,
  //   },
  // });

  // if (!limits) {
  //   return null;
  // }

  if (!id) {
    return prisma.bookingLimits.create({
      data: {
        ...input,
        userId: ctx.user.id,
      },
    });
  }

  // if (periodType) {
  //   data.periodType = handlePeriodType(periodType);
  // }

  // if (bookingLimits) {
  //   const isValid = validateIntervalLimitOrder(bookingLimits);
  //   if (!isValid)
  //     throw new TRPCError({ code: "BAD_REQUEST", message: "Booking limits must be in ascending order." });
  //   data.bookingLimits = bookingLimits;
  // }

  // if (durationLimits) {
  //   const isValid = validateIntervalLimitOrder(durationLimits);
  //   if (!isValid)
  //     throw new TRPCError({ code: "BAD_REQUEST", message: "Duration limits must be in ascending order." });
  //   data.durationLimits = durationLimits;
  // }

  // return await prisma.bookingLimits.update({
  //   where: {
  //     id,
  //   },
  //   data,
  // });

  // return await prisma.bookingLimits.upsert({
  //   where: {
  //     id: id,
  //     userId: ctx.user.id,
  //   },
  //   create: {
  //     ...data,
  //   },
  //   update: {
  //     ...data,
  //   },
  // });

  return "WIP";
};

export default updateHandler;
