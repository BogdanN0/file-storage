import { QueryProvider } from "./api/providers/QueryProvider";

export const metadata = {
  title: "File Storage",
  description: "Next.js + NestJS File Storage",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
