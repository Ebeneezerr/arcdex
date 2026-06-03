
import type { Metadata } from 'next';
import '../styles/theme.css';
import '../styles/health-banner.css';
import './globals.css';
import { Providers } from '../components/Providers';

const dexName = process.env.NEXT_PUBLIC_DEX_NAME || 'AstroDEX';

export const metadata: Metadata = {
  title: `${dexName} · DEX Shell`,
  description: `${dexName} frontend shell for Arc Testnet deployments. Connect wallets, explore modules, and monitor DEX state.`,
  keywords: `DEX, ${dexName}, Arc Testnet, liquidity, tokens, modules, swap`,
  authors: [{ name: `${dexName} Team` }],
  openGraph: {
    title: `${dexName} · DEX Shell`,
    description: `A ${dexName} frontend shell for Arc Testnet deployments.`,
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#020617] text-slate-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
