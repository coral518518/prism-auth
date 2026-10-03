import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  tokens,
} from "@fluentui/react-components";
import { DeleteRegular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import type { Domain } from "../../../lib/api";

interface DeleteDomainDialogProps {
  domain: Domain;
  onDelete: (id: string) => void;
  // Pre-translated confirmation copy; defaults to the personal-domain
  // wording. Team views pass their own so the i18n key stays literal at
  // the call site, where the static key checker can verify it.
  description?: string;
}

export function DeleteDomainDialog({
  domain,
  onDelete,
  description,
}: DeleteDomainDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog>
      <DialogTrigger disableButtonEnhancement>
        <Button icon={<DeleteRegular />} size="small" appearance="subtle" />
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{t("domains.removeDomain")}</DialogTitle>
          <DialogContent>
            {description ??
              t("domains.removeDomainDesc", { domain: domain.domain })}
          </DialogContent>
          <DialogActions>
            <DialogTrigger>
              <Button>{t("common.cancel")}</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              style={{ background: tokens.colorPaletteRedBackground3 }}
              onClick={() => onDelete(domain.id)}
            >
              {t("common.remove")}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
