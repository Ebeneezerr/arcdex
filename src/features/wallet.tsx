'use client';

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { createConfig, WagmiConfig } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains';
import { http } from 'viem';
import { defineChain } from 'viem';
import { ReactNode } from 'react';

// Define Arc Testnet
const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
    public: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Block Explorer',
      url: 'https://explorer.testnet.arc.network',
    },
  },
  testnet: true,
});

const chains = [arcTestnet, mainnet, polygon, arbitrum, optimism] as const;

const transports = {
  [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
  [mainnet.id]: http('https://eth.merkle.io'),
  [polygon.id]: http('https://polygon.drpc.org'),
  [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
  [optimism.id]: http('https://mainnet.optimism.io'),
};

const { connectors } = getDefaultWallets({
  appName: 'AstroDEX DEX',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'hydra-dex-arc-testnet',
});

const wagmiConfig = createConfig({
  connectors,
  chains,
  transports,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider>{children}</RainbowKitProvider>
    </WagmiConfig>
  );
}
