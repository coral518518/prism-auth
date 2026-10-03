// 404 page rendered for any unmatched route. Shipped from the SSR catch-all
// with a 404 status so it's a real "not found" response and not just a
// client-side flash after navigation.

import {
  Button,
  Text,
  Title2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: tokens.colorNeutralBackground1,
    padding: "16px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    padding: "48px 40px",
    borderRadius: "8px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    background: tokens.colorNeutralBackground2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    textAlign: "center",
  },
  code: {
    fontFamily: "monospace",
    fontSize: "72px",
    lineHeight: 1,
    color: tokens.colorBrandForeground1,
    letterSpacing: "-2px",
  },
  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
});

export function NotFound() {
  const styles = useStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Text className={styles.code} weight="semibold">
          404
        </Text>
        <Title2>{t("notFound.title")}</Title2>
        <Text style={{ color: tokens.colorNeutralForeground3 }}>
          {t("notFound.description")}
        </Text>
        <div className={styles.actions}>
          <Button onClick={() => navigate(-1)}>{t("notFound.goBack")}</Button>
          <Button appearance="primary" onClick={() => navigate("/")}>
            {t("notFound.goHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}
