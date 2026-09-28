import type { Metadata } from "next";
import { Landing } from "@/components/landing";
import { content } from "@/lib/landing-content";

export const metadata: Metadata = {
  title: { absolute: content.es.metaTitle },
  description: content.es.metaDescription,
  alternates: { languages: { es: "/", en: "/en" } },
};

export default function Page() {
  return <Landing locale="es" />;
}
