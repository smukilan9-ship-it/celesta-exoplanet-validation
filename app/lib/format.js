export function formatScore(value, digits = 4) {
  return Number(value).toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatPercent(value, digits = 1) {
  return `${(Number(value) * 100).toFixed(digits)}%`;
}

export function titleCase(value) {
  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export const CLASS_COLORS = {
  CANDIDATE: "var(--lime)",
  CONFIRMED: "var(--blue)",
  "FALSE POSITIVE": "var(--coral)",
};
