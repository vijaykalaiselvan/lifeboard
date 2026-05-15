import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Life Dashboard",
  description: "Your personal life dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-gray-950 text-gray-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
