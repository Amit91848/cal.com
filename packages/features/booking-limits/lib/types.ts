// import type { PeriodType } from "@calcom/prisma/enums";
import type { IntervalLimit } from "@calcom/types/Calendar";

export type FormValues = {
  id?: number;
  bookingLimits: IntervalLimit;
  // minimumBookingNotice: number;
  // minimumBookingNoticeInDurationType: number;
  // beforeEventBuffer: number;
  // afterEventBuffer: number;
  // periodType: PeriodType;
  // periodDays: number;
  // periodCountCalendarDays: boolean;
  // periodDates: { startDate: Date; endDate: Date };
  // durationLimits: IntervalLimit;
};
