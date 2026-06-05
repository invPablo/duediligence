import "./globals.css";

export const metadata = {
  title: "TERMINAL — Stock Analysis",
  description: "Professional fundamental analysis. No opinions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}