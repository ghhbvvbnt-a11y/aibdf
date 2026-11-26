import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "FormCraft AI",
  description: "محرر استمارات وامتحانات بالعربية مع مساعد ذكاء اصطناعي",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f6b5c" };

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
