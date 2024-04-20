import type { ColumnDef } from "@tanstack/react-table";
import { signIn } from "next-auth/react";
import { useState, useReducer, useRef, useMemo } from "react";

import { EditUserSheet } from "@calcom/features/users/components/UserTable/EditSheet/EditUserSheet";
import { initialState, reducer } from "@calcom/features/users/components/UserTable/UserListTable";
import { classNames } from "@calcom/lib";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { MembershipRole } from "@calcom/prisma/enums";
import { trpc, type RouterOutputs } from "@calcom/trpc/react";
import useMeQuery from "@calcom/trpc/react/hooks/useMeQuery";
import {
  Avatar,
  Button,
  ButtonGroup,
  Checkbox,
  ConfirmationDialogContent,
  DataTable,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  Dropdown,
  DropdownItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  showToast,
  Tooltip,
} from "@calcom/ui";

import MemberChangeRoleModal from "./MemberChangeRoleModal";
import TeamAvailabilityModal from "./TeamAvailabilityModal";
import TeamPill, { TeamRole } from "./TeamPill";

type Team = RouterOutputs["viewer"]["teams"]["get"];

interface MemberListTableProps {
  team: Team;
  isOrgAdminOrOwner: boolean | undefined;
}

const useCurrentUserId = () => {
  const query = useMeQuery();
  const user = query.data;
  return user?.id;
};

const checkIfExist = (comp: string, query: string) =>
  comp.toLowerCase().replace(/\s+/g, "").includes(query.toLowerCase().replace(/\s+/g, ""));

export const MemberListTable = (props: MemberListTableProps) => {
  const { team, isOrgAdminOrOwner } = props;
  const { t, i18n } = useLocale();
  const utils = trpc.useUtils();
  const [query, setQuery] = useState<string>("");
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [showChangeMemberRoleModal, setShowChangeMemberRoleModal] = useState(false);
  const [showTeamAvailabilityModal, setShowTeamAvailabilityModal] = useState(false);
  const [showEditUserSheet, setShowEditUserSheet] = useState(false);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [sheetEditMode, setSheetEditMode] = useState(false);

  const currentUserId = useCurrentUserId();

  const removeMemberMutation = trpc.viewer.teams.removeMember.useMutation({
    async onSuccess() {
      await utils.viewer.teams.get.invalidate();
      await utils.viewer.eventTypes.invalidate();
      await utils.viewer.organizations.listMembers.invalidate();
      await utils.viewer.organizations.getMembers.invalidate();
      showToast(t("success"), "success");
    },
    async onError(err) {
      showToast(err.message, "error");
    },
  });

  const resendInvitationMutation = trpc.viewer.teams.resendInvitation.useMutation({
    onSuccess: () => {
      showToast(t("invitation_resent"), "success");
    },
    onError: (error) => {
      showToast(error.message, "error");
    },
  });

  const members = team?.members;
  const membersList = members
    ? members && query === ""
      ? members
      : members.filter((member) => {
          const email = member.email ? checkIfExist(member.email, query) : false;
          const username = member.username ? checkIfExist(member.username, query) : false;
          const name = member.name ? checkIfExist(member.name, query) : false;

          return email || username || name;
        })
    : [];

  const memorisedColumns = useMemo(() => {
    const ownersInTeam = () => {
      const { members } = team;
      const owners = members.filter(
        (member) => member["role"] === MembershipRole.OWNER && member["accepted"]
      );
      return owners.length;
    };
    const cols: ColumnDef<(typeof membersList)[0]>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
      },
      {
        id: "member",
        accessorFn: (data) => data?.email,
        header: `Member (${membersList.length})`,
        cell: ({ row }) => {
          const { username, email, avatarUrl, accepted, bookerUrl, name } = row.original;
          const bookerUrlWithoutProtocol = bookerUrl.replace(/^https?:\/\//, "");
          const bookingLink = !!username && `${bookerUrlWithoutProtocol}/${username}`;
          return (
            <div className="flex items-center gap-2">
              <Avatar size="sm" alt={username || email} imageSrc={`${avatarUrl}`} />
              <div className="">
                <div>{name || "No username"}</div>

                <div className="text-default flex items-center">
                  <span
                    className=" block text-sm"
                    data-testid={accepted ? "member-email" : `email-${email.replace("@", "")}-pending`}
                    data-email={email}>
                    {email}
                  </span>
                  {bookingLink && (
                    <>
                      <span className="text-default mx-2 block">•</span>
                      <a
                        target="_blank"
                        href={`${bookerUrl}/${username}`}
                        className="text-default block text-sm">
                        {bookingLink}
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "role",
        accessorFn: (data) => data.role,
        header: "Role",
        cell: ({ row, table }) => {
          const { role, accepted } = row.original;
          console.log("row: ", row.original);

          return (
            <div className="mb-1 flex cursor-pointer">
              {accepted ? (
                <TeamRole
                  onClick={() => {
                    table.getColumn("role")?.setFilterValue([role]);
                  }}
                  role={role}
                />
              ) : (
                <TeamPill
                  onClick={() => {
                    table.getColumn("role")?.setFilterValue(["PENDING"]);
                  }}
                  data-testid="member-pending"
                  color="orange"
                  text={t("pending")}
                />
              )}
            </div>
          );
        },
        filterFn: (rows, id, filterValue) => {
          if (filterValue.includes("PENDING")) {
            if (filterValue.length === 1) return !rows.original.accepted;
            else return !rows.original.accepted || filterValue.includes(rows.getValue(id));
          }

          // Show only the selected roles
          return filterValue.includes(rows.getValue(id));
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const {
            id,
            role,
            accepted,
            username,
            bookerUrl,
            disableImpersonation,
            email,
            avatarUrl,
            teams,
            schedules,
          } = row.original;
          const editMode =
            (team?.membership.role === MembershipRole.OWNER &&
              (role !== MembershipRole.OWNER || ownersInTeam() > 1 || id !== currentUserId)) ||
            (team?.membership.role === MembershipRole.ADMIN && role !== MembershipRole.OWNER) ||
            isOrgAdminOrOwner;

          const removeMember = () =>
            removeMemberMutation.mutate({
              teamId: team.id,
              memberId: id,
              isOrg: team.isOrganization,
            });

          const impersonationMode =
            editMode &&
            !disableImpersonation &&
            accepted &&
            process.env.NEXT_PUBLIC_TEAM_IMPERSONATION === "true";
          const resendInvitation = editMode && !accepted;
          const avatarURL = `${WEBAPP_URL}/${username}/avatar.png`;

          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center">
                <ButtonGroup combined containerProps={{ className: "border-default hidden md:flex" }}>
                  {accepted && (
                    <Tooltip content={t("view_public_page")}>
                      <Button
                        target="_blank"
                        href={`${bookerUrl}/${username}`}
                        color="secondary"
                        className={classNames(!editMode ? "rounded-r-md" : "")}
                        variant="icon"
                        StartIcon="external-link"
                        disabled={!accepted}
                      />
                    </Tooltip>
                  )}
                  {editMode && (
                    <Dropdown>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="radix-state-open:rounded-r-md"
                          color="secondary"
                          variant="icon"
                          StartIcon="ellipsis"
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <DropdownItem
                            type="button"
                            onClick={() => setShowEditUserSheet(true)}
                            StartIcon="pencil">
                            {t("edit")}
                          </DropdownItem>
                        </DropdownMenuItem>
                        {impersonationMode && (
                          <>
                            <DropdownMenuItem>
                              <DropdownItem
                                type="button"
                                onClick={() => setShowImpersonateModal(true)}
                                StartIcon="lock">
                                {t("impersonate")}
                              </DropdownItem>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {resendInvitation && (
                          <DropdownMenuItem>
                            <DropdownItem
                              type="button"
                              onClick={() => {
                                resendInvitationMutation.mutate({
                                  teamId: team?.id,
                                  email: email,
                                  language: i18n.language,
                                });
                              }}
                              StartIcon="send">
                              {t("resend_invitation")}
                            </DropdownItem>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <DropdownItem
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            color="destructive"
                            StartIcon="user-x">
                            {t("remove")}
                          </DropdownItem>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </Dropdown>
                  )}
                </ButtonGroup>
                <div className="flex md:hidden">
                  <Dropdown>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="icon" color="minimal" StartIcon="ellipsis" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem className="outline-none">
                        <DropdownItem
                          disabled={!accepted}
                          href={!accepted ? undefined : `/${username}`}
                          target="_blank"
                          type="button"
                          StartIcon="external-link">
                          {t("view_public_page")}
                        </DropdownItem>
                      </DropdownMenuItem>
                      {editMode && (
                        <>
                          <DropdownMenuItem>
                            <DropdownItem
                              type="button"
                              onClick={() => setShowChangeMemberRoleModal(true)}
                              StartIcon="pencil">
                              {t("edit")}
                            </DropdownItem>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <DropdownItem
                              type="button"
                              color="destructive"
                              onClick={() => setShowDeleteModal(true)}
                              StartIcon="user-x">
                              {t("remove")}
                            </DropdownItem>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </Dropdown>
                </div>
              </div>
              {editMode && (
                <Dialog open={showDeleteModal} onOpenChange={() => setShowDeleteModal((prev) => !prev)}>
                  <ConfirmationDialogContent
                    variety="danger"
                    title={t("remove_member")}
                    confirmBtnText={t("confirm_remove_member")}
                    onConfirm={removeMember}>
                    {t("remove_member_confirmation_message")}
                  </ConfirmationDialogContent>
                </Dialog>
              )}

              {showImpersonateModal && username && (
                <Dialog open={showImpersonateModal} onOpenChange={() => setShowImpersonateModal(false)}>
                  <DialogContent
                    type="creation"
                    title={t("impersonate")}
                    description={t("impersonation_user_tip")}>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await signIn("impersonation-auth", {
                          username: email,
                          teamId: team.id,
                        });
                        setShowImpersonateModal(false);
                      }}>
                      <DialogFooter showDivider className="mt-8">
                        <DialogClose color="secondary">{t("cancel")}</DialogClose>
                        <Button color="primary" type="submit">
                          {t("impersonate")}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              {showChangeMemberRoleModal && (
                <MemberChangeRoleModal
                  isOpen={showChangeMemberRoleModal}
                  currentMember={team.membership.role}
                  teamId={team?.id}
                  memberId={id}
                  initialRole={role as MembershipRole}
                  onExit={() => setShowChangeMemberRoleModal(false)}
                />
              )}
              {showTeamAvailabilityModal && (
                <Dialog
                  open={showTeamAvailabilityModal}
                  onOpenChange={() => setShowTeamAvailabilityModal(false)}>
                  <DialogContent type="creation" size="md">
                    <TeamAvailabilityModal team={team} member={row.original} />
                    <DialogFooter>
                      <Button onClick={() => setShowTeamAvailabilityModal(false)}>{t("done")}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              {showEditUserSheet && (
                <EditUserSheet
                  avatarURL={avatarUrl || avatarURL}
                  user={row.original}
                  editMode={sheetEditMode}
                  schedulesNames={schedules.map((s) => s.name)}
                  teamNames={teams.map((t) => t.team.name)}
                  onOpenChange={() => {
                    setSheetEditMode(true);
                    setShowEditUserSheet(false);
                  }}
                  isPending={false}
                  updateFunction={removeMember as any}
                />
              )}
              {/* Type '{ username: string | null; role: MembershipRole; profile: UserProfile; organizationId: number | null; organization: any; accepted: boolean; disableImpersonation: boolean; ... 9 more ...; nonProfileUsername: string | null; }' is missing the following properties from type '{ teams: { accepted: boolean; id: number; name: string; }[]; role: MembershipRole; id: number; username: string | null; name: string | null; email: string; bio: string | null; timeZone: string; schedules: { ...; }[]; }': timeZone, schedulests(2739) */}
            </div>
          );
        },
      },
    ];

    return cols;
  }, [
    membersList.length,
    team,
    t,
    currentUserId,
    isOrgAdminOrOwner,
    showDeleteModal,
    showImpersonateModal,
    showChangeMemberRoleModal,
    showTeamAvailabilityModal,
    showEditUserSheet,
    sheetEditMode,
    removeMemberMutation,
    resendInvitationMutation,
    i18n.language,
  ]);
  return (
    <div className="flex flex-col gap-y-3">
      {membersList?.length && team ? (
        <>
          <DataTable
            onSearch={(value) => setQuery(value)}
            data={membersList}
            filterableItems={[
              {
                tableAccessor: "role",
                title: "Role",
                options: [
                  { label: "Owner", value: MembershipRole.OWNER },
                  { label: "Admin", value: MembershipRole.ADMIN },
                  { label: "Member", value: MembershipRole.MEMBER },
                  { label: "Pending", value: "PENDING" },
                ],
              },
            ]}
            tableContainerRef={tableContainerRef}
            columns={memorisedColumns}
          />
        </>
      ) : null}
    </div>
  );
};

export default MemberListTable;
