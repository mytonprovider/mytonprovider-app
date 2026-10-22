import { appPersist } from "@/lib/storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SubscriptionsState {
  subscribed: string[];
  subscribe: (pubkey: string) => void;
  unsubscribe: (pubkey: string) => void;
  setAll: (pubkeys: string[]) => void;
}

export const useSubscriptions = create<SubscriptionsState>()(
  persist(
    (set) => ({
      subscribed: [],
      subscribe: (pubkey) =>
        set((state) =>
          state.subscribed.includes(pubkey) ? state : { subscribed: [...state.subscribed, pubkey] },
        ),
      unsubscribe: (pubkey) =>
        set((state) => ({ subscribed: state.subscribed.filter((p) => p !== pubkey) })),
      setAll: (pubkeys) => set({ subscribed: pubkeys }),
    }),
    appPersist("mtp-subscriptions"),
  ),
);
