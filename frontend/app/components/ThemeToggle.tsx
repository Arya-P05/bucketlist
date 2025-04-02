"use client";

import { useState, useEffect } from "react";
import { Theme, getTheme, setTheme } from "../utils/theme";

export default function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTheme(getTheme());
  }, []);

  // Don't render anything until the component has mounted to avoid hydration mismatch
  if (!mounted) return null;

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    setCurrentTheme(theme);
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex space-x-1">
        <button
          onClick={() => handleThemeChange("light")}
          className={`p-1.5 rounded-md ${
            currentTheme === "light"
              ? "bg-secondary text-secondary-fg"
              : "text-foreground/70 hover:bg-secondary/50"
          }`}
          title="Light mode"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </button>

        <button
          onClick={() => handleThemeChange("dark")}
          className={`p-1.5 rounded-md ${
            currentTheme === "dark"
              ? "bg-secondary text-secondary-fg"
              : "text-foreground/70 hover:bg-secondary/50"
          }`}
          title="Dark mode"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>

        <button
          onClick={() => handleThemeChange("system")}
          className={`p-1.5 rounded-md ${
            currentTheme === "system"
              ? "bg-secondary text-secondary-fg"
              : "text-foreground/70 hover:bg-secondary/50"
          }`}
          title="System preference"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
