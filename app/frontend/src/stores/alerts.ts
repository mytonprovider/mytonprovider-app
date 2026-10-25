import {
  type AlertTypeMap,
  type ThresholdMap,
  defaultAlertTypes,
  defaultThresholds,
} from "@/data/alerts";
import type { AlertKey } from "@/i18n/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AlertsState {
  enabled: boolean;
  types: AlertTypeMap;
  thresholds: ThresholdMap;
  setEnabled: (enabled: boolean) => void;
  toggleType: (key: AlertKey) => void;
  setThreshold: (key: AlertKey, value: number) => void;
  setAll: (enabled: boolean, types: AlertTypeMap, thresholds: ThresholdMap) => void;
}

export const useAlerts = create<AlertsState>()(
  persist(
    (set) => ({
      enabled: true,
      types: defaultAlertTypes(),
      thresholds: defaultThresholds(),
      setEnabled: (enabled) => set({ enabled }),
      toggleType: (key) => set((state) => ({ types: { ...state.types, [key]: !state.types[key] } })),
      setThreshold: (key, value) => set((state) => ({ thresholds: { ...state.thresholds, [key]: value } })),
      setAll: (enabled, types, thresholds) => set({ enabled, types, thresholds }),
    }),
    {
      name: "mtp-alerts",
      merge: (persisted, current) => {
        const state = { ...current, ...(persisted as Partial<AlertsState>) };
        return { ...state, types: { ...defaultAlertTypes(), ...state.types } };
      },
    },
  ),
);
