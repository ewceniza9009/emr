import type { Metadata, Viewport } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "HALKYONE",
  description: "Enterprise-grade Clinical Electronic Medical Record system.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function() {
            try {
              const savedTheme = localStorage.getItem("halkyone-theme");
              if (savedTheme === "light") {
                document.documentElement.classList.add("light");
              } else {
                document.documentElement.classList.add("dark");
              }
            } catch (e) {}
          })()
        `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${outfit.variable} ${jetbrains.variable} antialiased`}
      >
        <NextTopLoader
          color="#14b8a6"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #14b8a6, 0 0 5px #14b8a6"
        />
        <Providers>{children}</Providers>
        <div id="modal-root" />
      </body>
    </html>
  );
}

