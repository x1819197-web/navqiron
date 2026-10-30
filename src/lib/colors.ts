function parseHex(hex: string): [number, number, number] {
  let value = hex.replace("#", "").trim();
  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const num = Number.parseInt(value.slice(0, 6), 16);
  if (Number.isNaN(num)) return [12, 53, 42];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function darkenHex(hex: string, amount = 0.35): string {
  const [r, g, b] = parseHex(hex);
  const mix = (channel: number, target: number) =>
    Math.round(channel + (target - channel) * amount);
  return `rgb(${mix(r, 12)}, ${mix(g, 53)}, ${mix(b, 42)})`;
}
