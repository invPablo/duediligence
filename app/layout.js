import "./globals.css";

export const metadata = {
  title: "Traqcker — Stock Analysis",
  description: "Deep fundamental analysis for serious investors. SEC filings, proprietary scoring, Graham DCF.",
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}