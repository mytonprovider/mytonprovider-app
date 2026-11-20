import { Check } from "lucide-react";
import { buttonClass, cx } from "@myton/ui";
import styles from "./MainButton.module.css";

type MainButtonTone = "accent" | "destructive";
type MainButtonState = "idle" | "loading" | "success";

interface MainButtonProps {
  label: string;
  tone?: MainButtonTone;
  state?: MainButtonState;
  disabled?: boolean;
  onClick?: () => void;
}

export function MainButton({
  label,
  tone = "accent",
  state = "idle",
  disabled = false,
  onClick,
}: MainButtonProps) {
  const busy = state === "loading" || state === "success";
  const idleDisabled = disabled && !busy;
  const clickable = !idleDisabled && !busy;

  const className = buttonClass(
    { variant: tone === "destructive" ? "danger" : "primary", size: "xl", block: true },
    cx(state === "success" && styles.success, busy && styles.busy),
  );

  return (
    <button
      type="button"
      className={className}
      onClick={clickable ? onClick : undefined}
      disabled={idleDisabled}
    >
      {state === "loading" && <span className={styles.spinner} />}
      {state === "success" && <Check size={20} color="var(--btn-ink)" />}
      {state === "idle" && <span>{label}</span>}
    </button>
  );
}
