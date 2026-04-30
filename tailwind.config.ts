import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Neutros base (fondo blanco, tabla, superficie)
          white: "#FFFFFF",
          surface: "#F9F9F9",
          border: "#E5E5E5",

          // Texto
          "text-primary": "#111111",
          "text-secondary": "#6B7280",
          "text-muted": "#9CA3AF",

          // Acción principal (botón "Agregar", negro casi puro de la imagen)
          black: "#1A1A1A",
          "black-hover": "#333333",

          // Stock: verde (existencia alta)
          "stock-ok-bg": "#D1FAE5",
          "stock-ok-text": "#065F46",

          // Stock: amarillo (existencia baja ≤ 3)
          "stock-low-bg": "#FEF3C7",
          "stock-low-text": "#92400E",

          // Stock: rojo (sin existencia = 0)
          "stock-empty-bg": "#FDE8E8",
          "stock-empty-text": "#C53030",

          // Botón borrar
          danger: "#C53030",
          "danger-border": "#F0A0A0",
          "danger-hover-bg": "#FDE8E8",
        },

        // ── Bordes y radios ───────────────────────────────────────────────────
        borderRadius: {
          DEFAULT: "6px",
          md: "8px",
          lg: "12px",
        },

        // ── Sombras sutiles ───────────────────────────────────────────────────
        boxShadow: {
          dropdown: "0 4px 16px rgba(0, 0, 0, 0.08)",
          modal: "0 8px 32px rgba(0, 0, 0, 0.12)",
        },

        // ── Animaciones ───────────────────────────────────────────────────────
        keyframes: {
          "fade-in": {
            "0%": { opacity: "0", transform: "translateY(-4px)" },
            "100%": { opacity: "1", transform: "translateY(0)" },
          },
          "modal-in": {
            "0%": { opacity: "0", transform: "scale(0.97)" },
            "100%": { opacity: "1", transform: "scale(1)" },
          },
        },
        animation: {
          "fade-in": "fade-in 0.15s ease-out",
          "modal-in": "modal-in 0.2s ease-out",
        },

        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
