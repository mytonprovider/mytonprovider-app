import { FieldGroup, FieldRow } from "@myton/ui";
import type { ReactNode } from "react";
import list from "@/styles/list.module.css";

export interface Field {
  label: ReactNode;
  value: ReactNode;
  title?: string;
}

export function FieldCard({ title, rows }: { title: string; rows: Field[] }) {
  return (
    <FieldGroup title={title} className={list.group}>
      {rows.map((row, index) => (
        <FieldRow key={index} label={row.label} value={row.value} title={row.title} />
      ))}
    </FieldGroup>
  );
}
