import React, { CSSProperties, ReactNode } from 'react';
import './globals.css';
import { Navbar } from '../components/layout/Navbar';

export const metadata = {
  title: 'TDV MAFIA | Elit Onlayn Mafiya Platforması',
  description: 'Azərbaycanın ən möhtəşəm onlayn sosial deduksiya və mafiya mühərriki. 40–50 nəfərlik All-In rejimi, asimmetrik mini-oyunlar və 75s Gemini AI mühafizəsi.',
};

const rootStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  minHeight: '100vh',
  backgroundColor: '#07090e',
  backgroundImage: `
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(220, 38, 38, 0.16), transparent 70%),
    radial-gradient(circle 700px at 10% 100%, rgba(220, 38, 38, 0.07), transparent 65%),
    radial-gradient(circle 600px at 90% 70%, rgba(217, 119, 6, 0.06), transparent 65%)
  `,
  backgroundAttachment: 'fixed',
  color: '#f1f5f9',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html lang="az">
      <head>
        <link rel="icon" type="image/jpeg" href="/assets/tdv-logo.jpg" />
        <link rel="apple-touch-icon" href="/assets/tdv-logo.jpg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body style={rootStyle}>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 70px)' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
