import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { ProceduresProvider } from '@/contexts/ProceduresContext';

// Force import Tailwind CSS
if (typeof window === 'undefined') {
  require('./globals.css');
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LaySoTuDong",
  description: "Hệ thống lấy số tự động cho các cơ quan hành chính",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ProceduresProvider>
          {children}
        </ProceduresProvider>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          style={{
            width: '600px',
            maxWidth: '600px'
          }}
          toastStyle={{
            width: '100%',
            maxWidth: '800px',
            fontSize: '22px',
            minHeight: '80px'
          }}
        />
      </body>
    </html>
  );
}
