import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Lifeboard",
  description: "Your personal life dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
