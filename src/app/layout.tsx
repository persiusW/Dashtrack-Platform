import "./globals.css";
import Providers from "@/contexts/ThemeProvider";

export const metadata = { title: "DasHttp Track", description: "Activation tracking and attribution" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}