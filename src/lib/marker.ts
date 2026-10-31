import { iconSvg } from "./icons";
import type { FreeFriend, MapPoint } from "./types";

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

export function markerHtml(point: MapPoint, active = false): string {
  const pinClass = point.kind === "place" ? "map-pin map-pin--place" : "map-pin";
  const iconSize = point.kind === "place" ? 17 : 18;
  return `<div class="map-pin-wrap${active ? " is-active" : ""}" style="--pin:${point.color}" role="button" tabindex="0" aria-label="${escapeHtml(point.title)}">
    <span class="map-pin-label">${escapeHtml(point.title)}</span>
    <span class="${pinClass}">${iconSvg(point.icon, iconSize, 2.1)}</span>
  </div>`;
}

export function friendMarkerHtml(friend: FreeFriend): string {
  const note = friend.note ? ` · ${friend.note}` : "";
  return `<div class="friend-pin" role="button" tabindex="0" aria-label="${escapeHtml(friend.name)}">
    <span class="friend-pin__avatar">${escapeHtml(friend.initials)}</span>
    <span class="friend-pin__label">${escapeHtml(friend.name)}${escapeHtml(note)}</span>
  </div>`;
}
