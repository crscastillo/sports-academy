export const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
};

export const num = (fd: FormData, k: string) => {
  const s = str(fd, k);
  if (s === null) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";

export const list = (fd: FormData, k: string) =>
  fd.getAll(k).filter((v): v is string => typeof v === "string" && v !== "");
