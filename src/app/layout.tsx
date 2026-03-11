import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import { AuthMockProvider } from "@/components/AuthMockProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Lotto Insight",
  description: "Data-driven lotto analysis platform",
  metadataBase: new URL("https://lottoinsight.kr"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>

        {/* 사이트 전체 인증 컨텍스트 */}
        <AuthMockProvider>
          {children}
        </AuthMockProvider>

        {/* Toast 알림 */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2500,
            style: {
              background: "#131a2d",
              color: "#ffffff",
              border: "1px solid rgba(212, 175, 55, 0.2)",
            },
          }}
        />

        {/* TossPayments SDK */}
        <Script
          src="https://js.tosspayments.com/v2/standard"
          strategy="afterInteractive"
        />

      </body>
    </html>
  );
}