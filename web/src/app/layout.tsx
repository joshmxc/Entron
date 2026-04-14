import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import IntlProvider from "@/components/IntlProvider";
import StoreProvider from "@/components/StoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entron - Event Guest Manager",
  description: "Usimamizi wa wageni na QR scanning kwa matukio",
  manifest: "/manifest.json",
appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Entron" },
};

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let locale = "sw";
  try {
    const cookieStore = await cookies();
    locale = cookieStore.get("NEXT_LOCALE")?.value ?? "sw";
  } catch {
    // No request context during static prerender — use default locale
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let messages: any = {};
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    messages = {};
  }

  return (
    <html lang={locale}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Apply dark class before paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('entron-theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if((t||p)==='dark')document.documentElement.classList.add('dark');}catch(e){}})();` }} />
      </head>
      <body>
        <StoreProvider>
          <IntlProvider locale={locale} messages={messages}>
            {children}
          </IntlProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
