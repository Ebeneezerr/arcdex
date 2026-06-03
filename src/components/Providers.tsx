'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletProvider } from "../features/wallet";
import { DashboardProvider } from "../features/analytics";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <DashboardProvider>{children}</DashboardProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}