import { Range } from "@myton/ui";
import { THRESHOLD_MAX, THRESHOLD_MIN } from "@/data/alerts";
import styles from "./ThresholdSlider.module.css";

interface ThresholdSliderProps {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function ThresholdSlider({ label, value, disabled, onChange }: ThresholdSliderProps) {
  const text = `≥ ${value}%`;
  return (
    <div className={styles.row}>
      <div className={styles.area} data-no-drag>
        <Range
          label={label}
          valueText={text}
          min={THRESHOLD_MIN}
          max={THRESHOLD_MAX}
          step={1}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
      <span className={styles.value}>{text}</span>
    </div>
  );
}
