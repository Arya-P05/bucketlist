// Theme values
export type Theme = "light" | "dark" | "system";

// Function to get current theme from localStorage
export const getTheme = (): Theme => {
  if (typeof window === "undefined") return "system";

  const savedTheme = localStorage.getItem("theme") as Theme;
  return savedTheme || "system";
};

// Function to set theme in localStorage
export const setTheme = (theme: Theme): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem("theme", theme);
  applyTheme(theme);
};

// Function to apply theme to document
export const applyTheme = (theme: Theme): void => {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

// Initialize theme on page load
export const initTheme = (): void => {
  const theme = getTheme();
  applyTheme(theme);

  // Add listener for system preference changes
  if (theme === "system") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        applyTheme("system");
      });
  }
};
