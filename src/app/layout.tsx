import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Sports Academy", template: "%s · Sports Academy" },
  description: "Gestión de academia de baloncesto: equipos, atletas, entrenamientos, jornadas y convocatorias.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
