"use client";

import { Controller, useForm } from "react-hook-form";

import { IntervalLimitsManager } from "@calcom/features/booking-limits/components/IntervalLimits";
import type { FormValues } from "@calcom/features/booking-limits/lib/types";
import SectionBottomActions from "@calcom/features/settings/SectionBottomActions";
import { getLayout } from "@calcom/features/settings/layouts/SettingsLayout";
import { classNames } from "@calcom/lib";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import type { RouterOutputs } from "@calcom/trpc/react";
import {
  Meta,
  SkeletonButton,
  SkeletonContainer,
  SkeletonText,
  Form,
  showToast,
  Button,
  SettingsToggle,
} from "@calcom/ui";

import PageWrapper from "@components/PageWrapper";

const SkeletonLoader = ({ title, description }: { title: string; description: string }) => {
  return (
    <SkeletonContainer>
      <Meta title={title} description={description} borderInShellHeader={false} />
      <div className="border-subtle mt-6 flex items-center rounded-t-xl border p-6 text-sm">
        <SkeletonText className="h-8 w-1/3" />
      </div>
      <div className="border-subtle space-y-6 border-x px-4 py-6 sm:px-6">
        <div className="[&>*]:bg-emphasis flex w-full items-center justify-center gap-x-2 [&>*]:animate-pulse">
          <div className="h-32 flex-1 rounded-md p-5" />
          <div className="h-32 flex-1 rounded-md p-5" />
          <div className="h-32 flex-1 rounded-md p-5" />
        </div>
        <div className="flex justify-between">
          <SkeletonText className="h-8 w-1/3" />
          <SkeletonText className="h-8 w-1/3" />
        </div>

        <SkeletonText className="h-8 w-full" />
      </div>
      <div className="rounded-b-lg">
        <SectionBottomActions align="end">
          <SkeletonButton className="mr-6 h-8 w-20 rounded-md p-5" />
        </SectionBottomActions>
      </div>
    </SkeletonContainer>
  );
};

const BookingsViewWrapper = () => {
  const { data: user, isPending } = trpc.viewer.me.useQuery();

  const { t } = useLocale();

  if (isPending || !user)
    return <SkeletonLoader title={t("bookings")} description={t("bookings_page_description")} />;

  return <BookingsView user={user} />;
};

const BookingsView = ({ user }: { user: RouterOutputs["viewer"]["me"] }) => {
  const utils = trpc.useContext();
  const { t } = useLocale();
  // const { bookingLimits } = user;
  // const [periodDates] = useState<{ startDate: Date; endDate: Date }>({
  //   startDate: new Date(bookingLimits?.periodStartDate || Date.now()),
  //   endDate: new Date(bookingLimits?.periodEndDate || Date.now()),
  // });

  const formMethods = useForm<FormValues>({
    defaultValues: {
      bookingLimits: user.bookingLimits?.bookingLimits || undefined,
      //   id: bookingLimits?.id,
      //   afterEventBuffer: bookingLimits?.afterEventBuffer,
      //   beforeEventBuffer: bookingLimits?.beforeEventBuffer,
      //   minimumBookingNotice: bookingLimits?.minimumBookingNotice,
      //   periodType: bookingLimits?.periodType,
      //   periodCountCalendarDays: bookingLimits?.periodCountCalendarDays ? true : false,
      //   periodDates: {
      //     startDate: periodDates.startDate,
      //     endDate: periodDates.endDate,
      //   },
      //   periodDays: bookingLimits?.periodDays ?? undefined,
      // },
      // durationLimits: bookingLimits?.durationLimits,
    },
  });
  const {
    formState: { isDirty, isSubmitting },
  } = formMethods;
  // const formMethods = useFormContext<FormValues>();

  const mutation = trpc.viewer.bookingLimits.update.useMutation({
    onSuccess: async () => {
      await utils.viewer.me.invalidate();
      // reset(getValues());
      showToast(t("settings_updated_successfully"), "success");
      // await update(res);

      // if (res.locale) {
      //   window.calNewLocale = res.locale;
      // }
    },
    onError(error, _, context) {
      console.log("error: ", error);
      console.log("context: ", context);
    },
  });
  const isDisabled = isSubmitting || !isDirty;

  return (
    <div>
      <Meta title={t("bookings")} description={t("bookings_page_description")} borderInShellHeader={false} />

      <div className="border-subtle mt-6 flex items-center rounded-t-lg border p-6 text-sm">
        <div>
          <p className="text-default text-base font-semibold">{t("theme")}</p>
          <p className="text-default">{t("theme_applies_note")}</p>
        </div>
      </div>
      <Form
        handleSubmit={(values) => {
          console.log("values: ", values);
          mutation.mutate({
            ...values,
          });
        }}
        form={formMethods}>
        {/* <div className="border-subtle flex flex-col justify-between border-x px-6 py-8 sm:flex-row"> */}
        <Controller
          name="bookingLimits"
          render={({ field: { value } }) => {
            const isChecked = Object.keys(value ?? {}).length > 0;
            return (
              <>
                <SettingsToggle
                  toggleSwitchAtTheEnd={true}
                  labelClassName="text-sm"
                  title={t("limit_booking_frequency")}
                  //   {...bookingLimitsLocked}
                  description={t("limit_booking_frequency_description")}
                  checked={isChecked}
                  onCheckedChange={(active) => {
                    if (active) {
                      formMethods.setValue(
                        "bookingLimits",
                        {
                          PER_DAY: 1,
                        },
                        { shouldDirty: true }
                      );
                    } else {
                      formMethods.setValue("bookingLimits", {}, { shouldDirty: true });
                    }
                    console.log("active: ", active);
                  }}
                  switchContainerClassName={classNames(
                    "border-subtle mt-6 rounded-lg border py-6 px-4 sm:px-6 rounded-b-none"
                  )}
                  childrenClassName="lg:ml-0">
                  <div className="border-subtle border border-t-0 p-6">
                    <IntervalLimitsManager
                      disabled={false}
                      propertyName="bookingLimits"
                      defaultLimit={1}
                      step={1}
                    />
                  </div>
                </SettingsToggle>
              </>
            );
          }}
        />
        {/* </div> */}
        <SectionBottomActions className="mb-6" align="end">
          <Button
            loading={mutation.isPending}
            disabled={isDisabled}
            type="submit"
            data-testid="update-theme-btn"
            color="primary">
            {t("update")}
          </Button>
        </SectionBottomActions>
      </Form>
    </div>
  );
};

BookingsViewWrapper.getLayout = getLayout;
BookingsViewWrapper.PageWrapper = PageWrapper;

export default BookingsViewWrapper;
