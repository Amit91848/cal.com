import type { useOrgBranding } from "@calcom/ee/organizations/context/provider";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { MembershipRole } from "@calcom/prisma/enums";
import { Avatar, Label, Loader, Sheet, SheetContent, SheetFooter, Skeleton } from "@calcom/ui";

import { DisplayInfo } from "./DisplayInfo";
import type { EditSchema } from "./EditUserForm";
import { EditForm } from "./EditUserForm";
import { SheetFooterControls } from "./SheetFooterControls";

export interface SheetUser {
  // teams?: { accepted?: boolean; name?: string; id?: number, slug?: string | null }[];
  name?: string | null;
  username?: string | null;
  email?: string;
  bio?: string | null;
  role?: MembershipRole;
  timeZone?: string;
  id?: number | string;
}

interface Props {
  user?: SheetUser;
  avatarURL: string;
  schedulesNames?: string[];
  teamNames?: string[];
  isPending: boolean;
  onOpenChange: () => void;
  orgBranding?: ReturnType<typeof useOrgBranding>;
  updateFunction: (update: EditSchema) => void;
  editMode: boolean;
}

export function EditUserSheet({
  user,
  avatarURL,
  schedulesNames,
  teamNames,
  isPending,
  onOpenChange,
  orgBranding,
  updateFunction,
  editMode,
}: Props) {
  const { t } = useLocale();
  return (
    <Sheet open={true} onOpenChange={onOpenChange}>
      <SheetContent position="right" size="default">
        {!isPending && user ? (
          <div className="flex h-full flex-col">
            {!editMode ? (
              <div className="flex-grow">
                <div className="mt-4 flex items-center gap-2">
                  <Avatar
                    asChild
                    className="h-[36px] w-[36px]"
                    alt={`${user?.name} avatar`}
                    imageSrc={avatarURL}
                  />
                  <div className="space-between flex flex-col leading-none">
                    <Skeleton loading={isPending} as="p" waitForTranslation={false}>
                      <span className="text-emphasis text-lg font-semibold">
                        {user?.name ?? "Nameless User"}
                      </span>
                    </Skeleton>
                    <Skeleton loading={isPending} as="p" waitForTranslation={false}>
                      <p className="subtle text-sm font-normal">
                        {orgBranding?.fullDomain ?? WEBAPP_URL}/{user?.username}
                      </p>
                    </Skeleton>
                  </div>
                </div>
                <div className="mt-6 flex flex-col space-y-5">
                  <DisplayInfo label={t("email")} value={user?.email ?? ""} displayCopy />
                  <DisplayInfo
                    label={t("bio")}
                    badgeColor="gray"
                    value={user?.bio ? user?.bio : t("user_has_no_bio")}
                  />
                  <DisplayInfo label={t("role")} value={user?.role ?? ""} asBadge badgeColor="blue" />
                  <DisplayInfo label={t("timezone")} value={user?.timeZone ?? ""} />
                  <div className="flex flex-col">
                    <Label className="text-subtle mb-1 text-xs font-semibold uppercase leading-none">
                      {t("availability_schedules")}
                    </Label>
                    <div className="flex flex-col">
                      {schedulesNames
                        ? schedulesNames.map((scheduleName) => (
                            <span
                              key={scheduleName}
                              className="text-emphasis inline-flex items-center gap-1 text-sm font-normal leading-5">
                              {scheduleName}
                            </span>
                          ))
                        : t("user_has_no_schedules")}
                    </div>
                  </div>

                  <DisplayInfo
                    label={t("teams")}
                    displayCount={teamNames?.length ?? 0}
                    value={
                      teamNames && teamNames?.length === 0 ? [t("user_isnt_in_any_teams")] : teamNames ?? "" // TS wtf
                    }
                    asBadge={teamNames && teamNames?.length > 0}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4 flex-grow">
                <EditForm
                  selectedUser={user}
                  avatarUrl={avatarURL}
                  domainUrl={orgBranding?.fullDomain ?? WEBAPP_URL}
                  updateFunction={updateFunction}
                />
              </div>
            )}
            <SheetFooter className="mt-auto">
              <SheetFooterControls />
            </SheetFooter>
          </div>
        ) : (
          <Loader />
        )}
      </SheetContent>
    </Sheet>
  );
}
