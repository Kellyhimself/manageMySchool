import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		screens: {
  			'sm-mobile': '359px',    // Small-Medium Mobile
  			'md-mobile': '410px',    // Medium Mobile
  			'desktop': '481px',      // Desktop
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: '#1E88E5',    // Primary Blue
  				dark: '#1565C0',       // Darker shade for hover
  				light: '#42A5F5',      // Lighter shade for active
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: '#2ECC71',    // Success Green
  				dark: '#27AE60',       // Darker shade for hover
  				light: '#58D68D',      // Lighter shade for active
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: '#F39C12',    // Attention Orange
  				dark: '#D68910',       // Darker shade for hover
  				light: '#F5B041',      // Lighter shade for active
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			neutral: {
  				white: '#FFFFFF',      // Pure White
  				gray: '#4A4A4A',       // Text Gray
  				light: '#F5F5F5',      // Light Gray for backgrounds
  				dark: '#2D2D2D',       // Dark Gray for text
  			},
  			error: {
  				DEFAULT: '#E74C3C',    // Error Red
  				dark: '#C0392B',       // Darker shade for hover
  				light: '#EC7063',      // Lighter shade for active
  			},
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [animate],
} satisfies Config;

export default config;
