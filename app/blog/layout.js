export const metadata = {
  title: 'Blog — Investing Concepts Explained Simply | Traqcker',
  description: 'ROIC, DCF valuation, P/E ratios and other fundamentals explained without jargon or spreadsheets.',
  openGraph: {
    title: 'Traqcker Blog — Investing Concepts Explained Simply',
    description: 'ROIC, DCF valuation, P/E ratios and other fundamentals explained without jargon or spreadsheets.',
    url: 'https://traqcker.com/blog',
    siteName: 'Traqcker',
    images: [{ url: '/og-screenshot.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Traqcker Blog',
    description: 'ROIC, DCF valuation, P/E ratios and other fundamentals explained without jargon or spreadsheets.',
    images: ['/og-screenshot.png'],
  },
  alternates: { canonical: 'https://traqcker.com/blog' },
};

export default function BlogLayout({ children }) {
  return children;
}
