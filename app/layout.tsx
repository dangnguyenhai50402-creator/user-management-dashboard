import { Toaster } from "react-hot-toast";
import "./globals.css";
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import QueryProvider from "./providers/query-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
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
