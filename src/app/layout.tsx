import type { Metadata } from "next";
import { Space_Grotesk, Fira_Code } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-space-grotesk",
});

const firaCode = Fira_Code({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-fira-code",
});

export const metadata: Metadata = {
    title: "sysadmin@ar-bue-1",
    description: "Manuel Wald — DevOps / Sysadmin engineer. Infraestructura crítica, CI/CD y homelab propio.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={`${spaceGrotesk.variable} ${firaCode.variable}`}>
                {children}
            </body>
        </html>
    );
}
