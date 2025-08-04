import { ClerkProvider } from '@clerk/nextjs';
import localFont from "next/font/local";
import Navbar from "../components/Navbar";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata = {
  title: "Codehub - Your AI-Powered Coding Platform",
  description: "Codehub is your go-to platform for AI-assisted coding.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning> 
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <Navbar />
          <main>
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}