import type { ReactNode } from "react";
import "@/styles/globals.css";

export const metadata = {
    title: "DashTrack",
    description: "Platform Monitoring & Tracking",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}
