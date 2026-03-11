import { LottoDraw } from "@/types/lotto";

const STORAGE_KEY = "lotto-admin-draws";

export function getAdminDraws(): LottoDraw[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as LottoDraw[];
  } catch {
    return [];
  }
}

export function saveAdminDraw(draw: LottoDraw) {
  if (typeof window === "undefined") return;

  const existing = getAdminDraws();
  const filtered = existing.filter((item) => item.round !== draw.round);
  const next = [draw, ...filtered].sort((a, b) => b.round - a.round);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function deleteAdminDraw(round: number) {
  if (typeof window === "undefined") return;

  const existing = getAdminDraws();
  const next = existing.filter((item) => item.round !== round);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}