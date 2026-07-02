import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          press: "hsl(var(--primary-press))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        trust: {
          DEFAULT: "hsl(var(--trust))",
          foreground: "hsl(var(--trust-foreground))",
        },
        premium: {
          DEFAULT: "hsl(var(--premium))",
          foreground: "hsl(var(--premium-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Job lifecycle — mirrors public.job_status (see index.css). */
        status: {
          requested: "hsl(var(--status-requested))",
          accepted: "hsl(var(--status-accepted))",
          "en-route": "hsl(var(--status-en-route))",
          arrived: "hsl(var(--status-arrived))",
          "awaiting-part": "hsl(var(--status-awaiting-part))",
          completed: "hsl(var(--status-completed))",
          "visit-fee": "hsl(var(--status-visit-fee))",
          disputed: "hsl(var(--status-disputed))",
          cancelled: "hsl(var(--status-cancelled))",
        },
        map: {
          land: "hsl(var(--map-land))",
          road: "hsl(var(--map-road))",
          casing: "hsl(var(--map-casing))",
          water: "hsl(var(--map-water))",
          park: "hsl(var(--map-park))",
          building: "hsl(var(--map-building))",
        },
        /* sidebar.tsx (unused shell) rides the core tokens — no extra vars. */
        sidebar: {
          DEFAULT: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: "hsl(var(--primary))",
          "primary-foreground": "hsl(var(--primary-foreground))",
          accent: "hsl(var(--accent))",
          "accent-foreground": "hsl(var(--accent-foreground))",
          border: "hsl(var(--border))",
          ring: "hsl(var(--ring))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 6px)", /* 26px — sheet tops */
        lg: "var(--radius)",             /* 20px — cards */
        md: "calc(var(--radius) - 4px)", /* 16px — buttons, inputs */
        sm: "calc(var(--radius) - 8px)", /* 12px — chips, small controls */
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "-apple-system", "sans-serif"],
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
