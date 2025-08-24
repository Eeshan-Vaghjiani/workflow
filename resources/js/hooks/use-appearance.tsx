import { useState, useEffect } from "react";

export type Theme = "light" | "dark" | "system";
export type Appearance = Theme;

function getSystemTheme(): "light" | "dark" {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Helper function to set a cookie
function setCookie(name: string, value: string, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value}${expires}; path=/`;
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

        // Log for debugging
        console.log("Theme changed:", {
            theme,
            effectiveTheme,
            systemPrefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches
        });

        // Store the theme in localStorage
        localStorage.setItem("theme", theme);

        // Also set a cookie for server-side rendering
        setCookie("appearance", theme);

        // Remove transition class after a short delay
        setTimeout(() => {
            root.classList.remove("theme-transition");
        }, 300);

        // If switching to system mode, consider reloading the page to ensure
        // server-side rendering picks up the correct theme
        if (theme === "system") {
            const previousTheme = localStorage.getItem("previous_theme");
            if (previousTheme && previousTheme !== "system") {
                // Store the current URL
                const currentUrl = window.location.href;
                // Reload the page after a short delay
                setTimeout(() => {
                    window.location.href = currentUrl;
                }, 50);
            }
        }

        // Store the current theme for future reference
        localStorage.setItem("previous_theme", theme);

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
            const newTheme = getSystemTheme();
            root.classList.add(newTheme);

            console.log("System theme changed:", {
                newTheme,
                prefersDark: mediaQuery.matches
            });

            // Remove transition class after animation completes
            setTimeout(() => {
                root.classList.remove("theme-transition");
            }, 300);
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    // Force apply the correct theme on initial load
    useEffect(() => {
        if (theme === "system") {
            const root = window.document.documentElement;
            const systemTheme = getSystemTheme();

            if (systemTheme === "light" && root.classList.contains("dark")) {
                root.classList.remove("dark");
                root.classList.add("light");
            } else if (systemTheme === "dark" && !root.classList.contains("dark")) {
                root.classList.remove("light");
                root.classList.add("dark");
            }
        }
    }, []);

    // Wrapper to set the theme and update the DOM
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return { 
        theme, 
        setTheme,
        appearance: theme, // alias for compatibility
        updateAppearance: setTheme // alias for compatibility
    };
}
