import { BottomBar } from "@/components/BottomBar";
import { Card, cx, FieldGroup, Toggle } from "@myton/ui";
import { MainButton } from "@/components/MainButton";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ThresholdSlider } from "@/components/ThresholdSlider";
import { ALERT_GROUPS, defaultThreshold } from "@/data/alerts";
import { saveAlerts, setAlertThreshold, setAlertsEnabled, toggleAlertType } from "@/data/sync";
import { useTranslation } from "react-i18next";
import { useAlerts } from "@/stores/alerts";
import { useNavigate } from "react-router";
import styles from "./Alerts.module.css";
import list from "@/styles/list.module.css";

export function Alerts() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const enabled = useAlerts((s) => s.enabled);
  const types = useAlerts((s) => s.types);
  const thresholds = useAlerts((s) => s.thresholds);

  const onSave = () => {
    saveAlerts();
    navigate(-1);
  };

  return (
    <Screen
      header={<ScreenHeader title={t("alertTitle")} onBack={() => navigate(-1)} />}
      bottom={
        <BottomBar>
          <MainButton label={t("save")} onClick={onSave} />
        </BottomBar>
      }
    >
      <Card pad="row" className={styles.masterCard}>
        <div className={styles.masterMain}>
          <div className={styles.masterLabel}>{t("alertMasterLabel")}</div>
          <div className={styles.masterSub}>{t("alertMasterSub")}</div>
        </div>
        <Toggle checked={enabled} onChange={setAlertsEnabled} label={t("alertMasterLabel")} />
      </Card>

      <div className={cx(styles.typesWrap, !enabled && styles.typesWrapOff)}>
        {ALERT_GROUPS.map((group) => (
          <FieldGroup key={group.key} title={t(`alertGroups.${group.key}`)} className={list.group}>
            {group.types.map((type) => {
              const on = types[type.key];
              return (
                <div key={type.key}>
                  <div className={styles.typeToggleRow}>
                    <div className={styles.typeMain}>
                      <div className={styles.typeLabel}>{t(`alertNames.${type.key}`)}</div>
                      <div className={styles.typeDesc}>{t(`alertDescs.${type.key}`)}</div>
                    </div>
                    <Toggle checked={on} onChange={() => toggleAlertType(type.key)} label={t(`alertNames.${type.key}`)} />
                  </div>
                  {type.threshold && (
                    <div className={cx(styles.sliderWrap, !on && styles.sliderWrapOff)}>
                      <ThresholdSlider
                        label={t(`alertNames.${type.key}`)}
                        disabled={!on}
                        value={thresholds[type.key] ?? defaultThreshold(type.key)}
                        onChange={(value) => setAlertThreshold(type.key, value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </FieldGroup>
        ))}
      </div>
    </Screen>
  );
}
