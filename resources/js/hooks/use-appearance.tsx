import { useState, useEffect } from "react";

export type Theme = "light" | "dark" | "system";
export type Appearance = Theme;

function getSystemTheme(): "light" | "dark" {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useAppearance() {
    // Get the theme from local storage or default to system
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== "undefined") {
            const storedTheme = localStorage.getItem("theme") as Theme;
            return storedTheme || "system";
        }
        return "system";
    });

    // Update the theme when it changes
    useEffect(() => {
        const root = window.document.documentElement;

        // Remove previous classes
        root.classList.remove("light", "dark");

        // Apply new theme
        const effectiveTheme = theme === "system" ? getSystemTheme() : theme;
        root.classList.add(effectiveTheme);

        // Store the theme in localStorage
        localStorage.setItem("theme", theme);
    }, [theme]);

    // Update theme when system preference changes
    useEffect(() => {
        if (theme !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            const root = window.document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(getSystemTheme());
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    // Wrapper to set the theme and update the DOM
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return { theme, setTheme };
}
