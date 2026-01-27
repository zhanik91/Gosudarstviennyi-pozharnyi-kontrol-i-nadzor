export const THEME_STORAGE_KEY = "theme";

export type Theme = "light" | "dark";

export const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
};

export const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("light", theme === "light");
};

export const persistTheme = (theme: Theme) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
};
