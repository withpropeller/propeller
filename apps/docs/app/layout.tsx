import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DocsTopBar, DocsSidebar } from "@/components/docs/nav";
import { DOCS_SECTIONS } from "@/components/docs/sections";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://withpropeller.com"),
  title: {
    default: "Propeller — China–Africa payment corridor",
    template: "%s · Propeller",
  },
  description:
    "Propeller is the Merchant of Record for the China–Africa payment corridor. Naira in, USDC out — compliance, FX, and settlement handled end-to-end.",
  openGraph: {
    type: "website",
    siteName: "Propeller",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`antialiased ${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col m-0 bg-paper text-ink font-sans">
        <DocsTopBar />
        <div className="docs-shell grid min-h-[calc(100vh-56px)]"
             style={{ gridTemplateColumns: "260px 1fr 240px" }}>
          <style>{`
            @media (max-width: 1080px) { .docs-shell { grid-template-columns: 240px 1fr !important; } .docs-shell > .toc { display: none !important; } }
            @media (max-width: 720px)  { .docs-shell { grid-template-columns: 1fr !important; } .docs-shell > .docs-side { display: none !important; } }
          `}</style>
          <DocsSidebar sections={DOCS_SECTIONS} />
          {children}
        </div>
      </body>
    </html>
  );
}
