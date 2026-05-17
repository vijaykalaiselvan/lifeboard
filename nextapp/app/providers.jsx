"use client";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/AuthContext";

export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
