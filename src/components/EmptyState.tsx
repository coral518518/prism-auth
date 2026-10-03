// Shared empty-state block for lists and tables: muted icon in a circle,
// title, optional description, optional call-to-action.

import { Text, makeStyles, tokens } from "@fluentui/react-components";
import type { ReactNode } from "react";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "8px",
    padding: "48px 16px",
  },
  iconCircle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
    fontSize: "28px",
    marginBottom: "8px",
  },
  description: {
    color: tokens.colorNeutralForeground3,
    maxWidth: "380px",
  },
  action: {
    marginTop: "8px",
  },
});

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      {icon && <div className={styles.iconCircle}>{icon}</div>}
      <Text size={400} weight="semibold">
        {title}
      </Text>
      {description && (
        <Text size={300} className={styles.description}>
          {description}
        </Text>
      )}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
