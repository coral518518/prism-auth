// Shared UI used by both personal Domains and team DomainsTable flows.

import { Button, Tab, TabList, Text, tokens } from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import { LabeledLine } from "../../components/LabeledLine";
import type {
  Domain,
  DomainAddResponse,
  VerificationMethod,
} from "../../lib/api";

interface DnsAddedInfoProps {
  info: DomainAddResponse;
  onDismiss: () => void;
}

export function DnsAddedInfo({ info, onDismiss }: DnsAddedInfoProps) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        background: tokens.colorNeutralBackground3,
      }}
    >
      <Text weight="semibold" block>
        {t("domains.dnsInstructions", { domain: info.domain })}
      </Text>
      <div
        style={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <LabeledLine label={t("domains.dnsType")}>TXT</LabeledLine>
        <LabeledLine label={t("domains.dnsName")} mono>
          {info.txt_record}
        </LabeledLine>
        <LabeledLine label={t("domains.dnsValue")} mono>
          {info.txt_value}
        </LabeledLine>
      </div>
      <Button size="small" onClick={onDismiss} style={{ marginTop: 12 }}>
        {t("common.dismiss")}
      </Button>
    </div>
  );
}

interface VerificationInstructionsProps {
  domain: Domain;
  method: VerificationMethod;
  onMethodChange: (m: VerificationMethod) => void;
}

export function VerificationInstructions({
  domain,
  method,
  onMethodChange,
}: VerificationInstructionsProps) {
  const { t } = useTranslation();
  const token = domain.verification_token;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 6,
        background: tokens.colorNeutralBackground3,
      }}
    >
      <TabList
        size="small"
        selectedValue={method}
        onTabSelect={(_, d) => onMethodChange(d.value as VerificationMethod)}
      >
        <Tab value="dns-txt">{t("domains.method.dns-txt")}</Tab>
        <Tab value="http-file">{t("domains.method.http-file")}</Tab>
        <Tab value="html-meta">{t("domains.method.html-meta")}</Tab>
      </TabList>

      {method === "dns-txt" && (
        <>
          <Text size={200} weight="semibold">
            {t("domains.addDnsTxtRecord")}
          </Text>
          <LabeledLine label={t("domains.dnsType")}>TXT</LabeledLine>
          <LabeledLine label={t("domains.dnsName")} mono>
            _prism-verify.{domain.domain}
          </LabeledLine>
          <LabeledLine label={t("domains.dnsValue")} mono>
            prism-verify={token}
          </LabeledLine>
        </>
      )}

      {method === "http-file" && (
        <>
          <Text size={200} weight="semibold">
            {t("domains.addHttpFile")}
          </Text>
          <LabeledLine label={t("domains.httpUrl")} mono>
            https://{domain.domain}/.well-known/prism-verify-{token}.txt
          </LabeledLine>
          <LabeledLine label={t("domains.httpContent")} mono>
            prism-verify={token}
          </LabeledLine>
        </>
      )}

      {method === "html-meta" && (
        <>
          <Text size={200} weight="semibold">
            {t("domains.addHtmlMeta")}
          </Text>
          <Text size={200}>
            {t("domains.htmlMetaHint", { domain: domain.domain })}
          </Text>
          <Text
            size={200}
            font="monospace"
          >{`<meta name="prism-verify" content="${token}">`}</Text>
        </>
      )}
    </div>
  );
}
