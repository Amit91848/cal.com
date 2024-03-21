import { createNextApiHandler } from "@calcom/trpc/server/createNextApiHandler";
import { bookingLimitsRouter } from "@calcom/trpc/server/routers/viewer/bookingLimits/_router";

export default createNextApiHandler(bookingLimitsRouter);
