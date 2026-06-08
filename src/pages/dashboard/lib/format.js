// Small currency formatters used everywhere.
// NOTE: existing code uses these as `fmtN(value)` / `fmtU(value)`.
// They format with locale separators only — no decimal control. Don't change behaviour.

export const fmtN = (n) => '₦' + Number(n).toLocaleString();
export const fmtU = (n) => '$' + Number(n).toLocaleString();
