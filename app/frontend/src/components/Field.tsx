import { Lock } from "lucide-react";
import { SearchField, TextField } from "@myton/ui";
import type { KeyboardEvent, ReactNode } from "react";

interface FieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  glyph?: "search" | "lock";
  password?: boolean;
  maxLength?: number;
  invalid?: boolean;
  enterKeyHint?: "search" | "done";
  onEnter?: () => void;
  onClear?: () => void;
  trailing?: ReactNode;
  className?: string;
}

// Keys, addresses and passwords: the phone keyboard must not capitalise or "correct" them.
const RAW_INPUT = { autoCapitalize: "off", autoCorrect: "off", spellCheck: false } as const;

export function Field({
  value,
  onChange,
  placeholder,
  glyph,
  password,
  maxLength,
  invalid,
  enterKeyHint,
  onEnter,
  onClear,
  trailing,
  className,
}: FieldProps) {
  const onKeyDown = onEnter && ((event: KeyboardEvent) => event.key === "Enter" && onEnter());

  if (glyph === "search")
    return (
      <SearchField
        {...RAW_INPUT}
        className={className}
        value={value}
        onChange={onChange}
        label={placeholder ?? ""}
        onClear={onClear}
        invalid={invalid}
        enterKeyHint={enterKeyHint}
        onKeyDown={onKeyDown}
      />
    );

  return (
    <TextField
      {...RAW_INPUT}
      className={className}
      type={password ? "password" : "text"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      invalid={invalid}
      enterKeyHint={enterKeyHint}
      onKeyDown={onKeyDown}
      leading={glyph === "lock" && <Lock size={18} color="var(--text-2)" />}
      trailing={trailing}
    />
  );
}
