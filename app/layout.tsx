import { Toaster } from "react-hot-toast";
import "./globals.css";
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import QueryProvider from "./providers/query-provider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={cn("font-sans", geist.variable)}>
      <body>
        <QueryProvider>
          <MantineProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 2000,
            }}
          />
        </MantineProvider>
        </QueryProvider>        
      </body>
    </html>
  );
}
