import ExpandMore from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import type { ReactNode } from "react";
import { SECTIONS, type SectionId } from "../strings/sections";
import { UI } from "../strings/ui";

/** A step's heading (focused when the step opens) and lede, then its content. */
export function SectionShell({ id, children }: Readonly<{ id: SectionId; children: ReactNode }>) {
  const section = SECTIONS.find((item) => item.id === id) ?? SECTIONS[0];
  const position = SECTIONS.indexOf(section) + 1;
  return (
    <section className="gcc-section">
      <header className="gcc-section__header">
        <p className="gcc-section__index" aria-hidden="true">
          {String(position).padStart(2, "0")}
        </p>
        <h2 id={`gcc-step-${id}`} tabIndex={-1} className="gcc-section__title">
          {section.title}
        </h2>
        <p className="gcc-section__lede">{section.lede}</p>
      </header>
      {children}
    </section>
  );
}

/** A titled group of fields in a responsive grid. */
export function FieldGroup({
  title,
  children,
  wide,
}: Readonly<{ title?: string; children: ReactNode; wide?: boolean }>) {
  return (
    <fieldset className="gcc-group">
      {title && <legend className="gcc-group__title">{title}</legend>}
      <div className={wide ? "gcc-grid gcc-grid--wide" : "gcc-grid"}>{children}</div>
    </fieldset>
  );
}

/** Detailed financial assumptions, collapsed until asked for. */
export function Advanced({
  children,
  title = UI.common.advanced,
}: Readonly<{ children: ReactNode; title?: string }>) {
  return (
    <Accordion
      disableGutters
      slotProps={{ transition: { unmountOnExit: true } }}
      className="gcc-advanced"
    >
      <AccordionSummary expandIcon={<ExpandMore />}>{title}</AccordionSummary>
      <AccordionDetails>
        <div className="gcc-grid">{children}</div>
      </AccordionDetails>
    </Accordion>
  );
}
