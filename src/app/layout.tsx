import type { Metadata } from "next";
import { Poppins, Inter, Nunito, Roboto, Literata } from "next/font/google";
import "./globals.css";

// Note: "Lenard" from the spec is not an available Google Font, so Literata
// (a highly readable serif designed for long-form reading) is used in its
// place for long reading passages — swap the font name below if a licensed
// "Lenard" font file is added to the project later.
const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-poppins" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto" });
const literata = Literata({ subsets: ["latin"], variable: "--font-lenard" });

export const metadata: Metadata = {
  title: "AGORA QUIZ",
  description: "Agora Quiz — the online examination platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('agora-theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${poppins.variable} ${inter.variable} ${nunito.variable} ${roboto.variable} ${literata.variable} font-inter bg-agora-lightblue dark:bg-agora-dark text-agora-black dark:text-white transition-colors`}
      >
        {children}
      </body>
    </html>
  );
}
