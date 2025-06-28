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
            // Always default to system if no theme is stored
            const storedTheme = localStorage.getItem("theme") as Theme;
            if (!storedTheme) {
                localStorage.setItem("theme", "system");
                return "system";
            }
            return storedTheme;
        }
        return "system";
    });

    // Update the theme when it changes
    useEffect(() => {
        const root = window.document.documentElement;

        // Add transition class for smooth theme changes
        root.classList.add("theme-transition");

        // Remove previous classes
        root.classList.remove("light", "dark");

        // Apply new theme
        const effectiveTheme = theme === "system" ? getSystemTheme() : theme;
        root.classList.add(effectiveTheme);

        // Store the theme in localStorage
        localStorage.setItem("theme", theme);

        // Remove transition class after a short delay
        setTimeout(() => {
            root.classList.remove("theme-transition");
        }, 300);
    }, [theme]);

    // Update theme when system preference changes
    useEffect(() => {
        if (theme !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            const root = window.document.documentElement;

            // Add transition for system theme changes
            root.classList.add("theme-transition");

            root.classList.remove("light", "dark");
            root.classList.add(getSystemTheme());

            // Remove transition class after animation completes
            setTimeout(() => {
                root.classList.remove("theme-transition");
            }, 300);
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
