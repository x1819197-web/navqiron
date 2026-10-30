import type { TransitKind, TransitStop } from "./types";

const BUS_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 17h16"/><path d="M6 17V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10"/><path d="M6 10h12"/><path d="M8 20v-2"/><path d="M16 20v-2"/></svg>';

const KIND_LABEL: Record<TransitKind, string> = {
  metro: "Metro bekati",
  bus: "Avtobus bekati",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char] ?? char;
  });
}

export function transitStopHtml(kind: TransitKind): string {
  if (kind === "metro") {
    return '<span class="transit-pin transit-pin--metro">M</span>';
  }
  return `<span class="transit-pin transit-pin--bus">${BUS_ICON}</span>`;
}

export function transitPopupHtml(stop: TransitStop): string {
  return `<div class="transit-popup__body"><span class="transit-popup__kind">${KIND_LABEL[stop.kind]}</span><p class="transit-popup__name">${escapeHtml(stop.name)}</p></div>`;
}
