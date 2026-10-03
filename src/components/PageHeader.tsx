// Shared page header: title + optional subtitle on the left, optional
// action buttons on the right. Keeps spacing and typography consistent
// across pages instead of each one rolling its own header row.

import { Text, Title2, makeStyles, tokens } from "@fluentui/react-components";
import type { ReactNode } from "react";

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "16px",
  },
  titles: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
});

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Override spacing, e.g. marginBottom: 0 inside flex-gap layouts. */
  style?: React.CSSProperties;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  style,
}: PageHeaderProps) {
  const styles = useStyles();
  return (
    <div className={styles.root} style={style}>
      <div className={styles.titles}>
        <Title2>{title}</Title2>
        {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
