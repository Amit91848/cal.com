import authedProcedure from "../../../procedures/authedProcedure";
import { importHandler, router } from "../../../trpc";
import { ZUpdateInputSchema } from "./update.schema";

const NAMESPACE = "bookingLimits";

const namespaced = (s: string) => `${NAMESPACE}.${s}`;

export const bookingLimitsRouter = router({
  update: authedProcedure.input(ZUpdateInputSchema).mutation(async (opts) => {
    console.log("opts: ", opts);
    const handler = await importHandler(namespaced("update"), () => import("./update.handler"));
    return handler(opts);
  }),
});
