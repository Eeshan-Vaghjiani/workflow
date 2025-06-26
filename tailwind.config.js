/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
    './storage/framework/views/*.php',
    './resources/views/**/*.blade.php',
    './resources/js/**/*.tsx',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          50: '#E6F7F5',
          100: '#CCEFE9',
          200: '#99DFD4',
          300: '#66CEBF',
          400: '#33BEAA',
          500: '#00887A', // Primary base color
          600: '#007A6E',
          700: '#006B5F',
          800: '#005C51',
          900: '#004D43',
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
          coral: '#FFCCBC',
          hover: '#FFB8A1',
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        // New futuristic theme colors
        softBlue: {
          DEFAULT: '#D3E3FC',
          dark: '#0F1419',
        },
        ctaBright: {
          DEFAULT: '#77A6F7',
          dark: '#60A5FA',
        },
        neon: {
          green: '#00FFA3',
          pink: '#FF006E',
          blue: '#00D4FF',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(0, 0, 0, 0.3)',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.7 },
        },
        magnetic: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1.02)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "magnetic": "magnetic 0.3s ease-out",
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'magnetic': '0 20px 40px rgba(0,136,122,0.15)',
        'magnetic-dark': '0 20px 40px rgba(0,201,167,0.15)',
        'glow': '0 0 15px rgba(0,136,122,0.5)',
        'glow-dark': '0 0 15px rgba(0,255,163,0.5)',
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Add plugin for modern glassmorphism effects
    function({ addUtilities }) {
      const newUtilities = {
        '.glass-light': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
