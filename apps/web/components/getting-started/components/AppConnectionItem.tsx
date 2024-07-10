import { InstallAppButtonWithoutPlanCheck } from "@calcom/app-store/components";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import type { App } from "@calcom/types/App";
import { Badge, Button } from "@calcom/ui";

interface IAppConnectionItem {
  title: string;
  description?: string;
  logo: string;
  type: App["type"];
  installed?: boolean;
  isDefault?: boolean;
  defaultInstall?: boolean;
  slug?: string;
}

const AppConnectionItem = (props: IAppConnectionItem) => {
  const { title, logo, type, installed, isDefault, defaultInstall, slug } = props;
  const { t } = useLocale();
  const setDefaultConferencingApp = trpc.viewer.appsRouter.setDefaultConferencingApp.useMutation();
  return (
    <div className="flex flex-row items-center justify-between p-5">
      <div className="flex items-center space-x-3">
        <img src={logo} alt={title} className="h-8 w-8" />
        <p className="text-sm font-bold">{title}</p>
        {isDefault && <Badge variant="green">{t("default")}</Badge>}
      </div>
      <InstallAppButtonWithoutPlanCheck
        type={type}
        options={{
          onSuccess: () => {
            if (defaultInstall && slug) {
              setDefaultConferencingApp.mutate({ slug });
            }
          },
        }}
        render={(buttonProps) => (
          <Button
            {...buttonProps}
            color="secondary"
            disabled={installed}
            type="button"
            loading={buttonProps?.isPending}
            onClick={(event) => {
              // Save cookie key to return url step
              document.cookie = `return-to=${window.location.href};path=/;max-age=3600;SameSite=Lax`;
              buttonProps && buttonProps.onClick && buttonProps?.onClick(event);
            }}>
            {installed ? t("installed") : t("connect")}
          </Button>
        )}
      />
    </div>
  );
};

export { AppConnectionItem };
