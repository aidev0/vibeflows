import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { ChatProvider } from './context/ChatContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VibeFlows",
  description: "Workflow Visualization and Chat",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </UserProvider>
      </body>
    </html>
  );
}
