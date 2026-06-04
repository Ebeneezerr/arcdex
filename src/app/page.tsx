'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import themeConfig from '../theme.config.json';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSwitchChain, useAccount } from 'wagmi';
import { deployments, defaultNetwork } from '../lib/deployments';
import {
  astrodexConfig,
  getEnabledAstroDEXModuleKeys,
  tokenAName,
  tokenASymbol,
  tokenBName,
  tokenBSymbol,
} from '../lib/dexConfig';
import { getModuleLabelByKey, getModuleIconByKey } from '@/lib/moduleMetadata';
import AdaptiveLayout from '../components/AdaptiveLayout';
import SwapComponent from '../features/swap/Swap';
import LiquidityComponent from '../features/liquidity/Liquidity';
import FaucetComponent from '../features/faucet/Faucet';
import { Staking as StakingComponent } from '../features/staking/Staking';
import LeaderboardComponent from '../features/leaderboard/Leaderboard';

export default function Home() {
  const router = useRouter();
  const [activeNetwork, setActiveNetwork] = useState(defaultNetwork);
  const [activeTab, setActiveTab] = useState('swap');
  const [showConnectionPrompt, setShowConnectionPrompt] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { switchChain } = useSwitchChain();
  const { address: userAddress, isConnected } = useAccount();

  const dexName = astrodexConfig.name || process.env.NEXT_PUBLIC_DEX_NAME || 'AstroDEX';
  const logoLetter = astrodexConfig.name?.charAt(0).toUpperCase() ?? dexName.charAt(0).toUpperCase() ?? 'D';
  const deployerAddress = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS?.toLowerCase() || '';
  const isDeployer = isConnected && userAddress?.toLowerCase() === deployerAddress;

  const logoFontFamily = useMemo(() => {
    const fontMap: Record<string, string> = {
      cyber: "'Orbitron', sans-serif",
      neo: "'Inter', sans-serif",
      organic: "'Poppins', sans-serif",
      classic: "'Times New Roman', serif",
      modern: "'Space Grotesk', sans-serif",
    };

    const personality = (themeConfig as { dnaPersonality?: string }).dnaPersonality?.toString().toLowerCase();
    return fontMap[personality ?? 'neo'] || fontMap.neo;
  }, []);

  useEffect(() => {
    let active = true;
    const candidates = ['/logo.png', '/logo.webp', '/logo.jpg', '/logo.jpeg', '/logo.svg'];

    async function detectLogo() {
      for (const candidate of candidates) {
        try {
          const response = await fetch(candidate, { method: 'HEAD' });
          if (response.ok && active) {
            setLogoUrl(candidate);
            return;
          }
        } catch {
          // ignore missing asset
        }
      }

      if (active) {
        setLogoUrl(null);
      }
    }

    detectLogo();
    return () => {
      active = false;
    };
  }, []);

  const networkList = useMemo(() => Object.keys(deployments), []);
  const deployment = deployments[activeNetwork as keyof typeof deployments] || { contracts: {}, network: activeNetwork };
  const contracts = deployment.contracts || {};
  const { router: routerAddress, bridge, faucet, stakeRewards, lendingPool, demoTrading, pointsTracker } = contracts;

  const activeDeployment = deployments[activeNetwork as keyof typeof deployments] || { tokens: [] };
  const deploymentTokens = activeDeployment.tokens || [];

  const resolveTokenAddress = (symbol: string, fallbackIndex: number) => {
    const configAddress = astrodexConfig.tokens?.find((token) => token.symbol === symbol)?.address || '';
    if (configAddress && ethers.isAddress(configAddress)) return configAddress;
    const deployedAddress = deploymentTokens.find((token: any) => token.symbol === symbol)?.address || '';
    if (deployedAddress && ethers.isAddress(deployedAddress)) return deployedAddress;
    const fallbackAddress = astrodexConfig.tokens?.[fallbackIndex]?.address || '';
    return ethers.isAddress(fallbackAddress) ? fallbackAddress : '';
  };

  const tokenA = resolveTokenAddress(tokenASymbol, 0);
  const tokenB = resolveTokenAddress(tokenBSymbol, 1);
  const extraTokens = astrodexConfig.tokens?.slice(2) ?? [];

  const enabledModuleKeys = getEnabledAstroDEXModuleKeys();
  const moduleTabs = useMemo(
    () => enabledModuleKeys.map((key) => ({ key, label: `${getModuleIconByKey(key)} ${getModuleLabelByKey(key)}` })),
    [enabledModuleKeys]
  );

  const basicTabs = [
    { key: 'swap', label: '🔄 Swap', requiresConnection: true },
    { key: 'liquidity', label: '💧 Liquidity', requiresConnection: true },
    { key: 'faucet', label: '🚰 Faucet', requiresConnection: false },
    { key: 'staking', label: '🏅 Staking', requiresConnection: true },
    { key: 'leaderboard', label: '🏆 Leaderboard', requiresConnection: false }
  ];

  const allTabs = useMemo(() => {
    const seen = new Set<string>();
    return [...basicTabs, ...moduleTabs].filter((tab) => {
      if (seen.has(tab.key)) return false;
      seen.add(tab.key);
      return true;
    });
  }, [basicTabs, moduleTabs]);

  useEffect(() => {
    if (!isConnected) return;
    setShowConnectionPrompt(false);
  }, [isConnected]);

  const handleNetworkChange = (value: string) => {
    setActiveNetwork(value);
    if (switchChain) {
      switchChain({ chainId: undefined as any });
    }
  };

  const handleTabClick = (key: string) => {
    const tab = allTabs.find((item) => item.key === key) as any;
    if (tab && tab.requiresConnection && !isConnected) {
      setShowConnectionPrompt(true);
      return;
    }
    setShowConnectionPrompt(false);
    setActiveTab(key);
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={`${dexName} logo`} className="h-12 w-12 rounded-3xl object-cover shadow-lg shadow-violet-500/20" />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-blue-400 text-2xl font-bold shadow-lg shadow-violet-500/10"
                style={{ fontFamily: logoFontFamily }}
              >
                {logoLetter}
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{dexName.toUpperCase()}</p>
              <h1 className="text-2xl font-semibold">{dexName}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-200">
              Network: {activeNetwork}
            </div>
            {isDeployer && (
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-blue-400"
              >
                Admin
              </button>
            )}
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-8 shadow-[0_30px_80px_-50px_rgba(59,130,246,0.4)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-400/70">DEX Overview</p>
              <h2 className="mt-3 text-4xl font-bold text-white">Launch-ready trading for {tokenASymbol}/{tokenBSymbol}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                A modern {dexName} shell with wallet connect, network awareness, and live module navigation.
                Connect your wallet to explore swap, liquidity, faucet, analytics, and enabled modules.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-900/90 p-4 text-sm text-slate-200 ring-1 ring-slate-700">
                <p className="uppercase tracking-[0.2em] text-slate-500">{tokenAName}</p>
                <p className="mt-2 text-2xl font-semibold">{tokenASymbol}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/90 p-4 text-sm text-slate-200 ring-1 ring-slate-700">
                <p className="uppercase tracking-[0.2em] text-slate-500">{tokenBName}</p>
                <p className="mt-2 text-2xl font-semibold">{tokenBSymbol}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/90 p-4 text-sm text-slate-200 ring-1 ring-slate-700">
                <p className="uppercase tracking-[0.2em] text-slate-500">Modules</p>
                <p className="mt-2 text-2xl font-semibold">{enabledModuleKeys.length || '0'}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950/80 p-4 shadow-lg shadow-slate-950/20">
          <div className="flex flex-wrap gap-2">
            {allTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? 'bg-blue-500 text-slate-950 shadow-xl shadow-blue-500/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {showConnectionPrompt && (
          <section className="mt-6 rounded-3xl border border-amber-700 bg-amber-950/80 p-6 text-amber-100">
            <h3 className="text-lg font-semibold">Wallet connection required</h3>
            <p className="mt-2 text-sm text-amber-200">
              This feature requires a connected wallet. Use the connect button in the header to continue.
            </p>
          </section>
        )}

        <section className="mt-8 grid gap-6">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8">
              <h3 className="text-2xl font-semibold text-white">{activeTab === 'swap' ? 'Swap' : activeTab === 'liquidity' ? 'Liquidity' : activeTab === 'faucet' ? 'Faucet' : activeTab === 'analytics' ? 'Analytics' : activeTab}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {activeTab === 'swap'
                  ? 'A secure interface for routing token swaps through your deployed router.'
                  : activeTab === 'liquidity'
                  ? 'Add or remove liquidity between the primary token pair.'
                  : activeTab === 'faucet'
                  ? 'Request tokens from the configured faucet.'
                  : activeTab === 'analytics'
                  ? 'View deployment health, token pairs, and network status.'
                  : 'Explore the selected module in your deployment.'}
              </p>

              <div className="mt-8">
                {activeTab === 'swap' && (
                  <SwapComponent routerAddress={routerAddress} tokenA={tokenA} tokenB={tokenB} tokenAName={tokenAName} tokenASymbol={tokenASymbol} tokenBName={tokenBName} tokenBSymbol={tokenBSymbol} network={activeNetwork} />
                )}

                {activeTab === 'liquidity' && (
                  <LiquidityComponent routerAddress={routerAddress} tokenA={tokenA} tokenB={tokenB} />
                )}

                {activeTab === 'faucet' && (
                  <FaucetComponent faucetAddress={faucet} tokenA={tokenA} tokenB={tokenB} />
                )}

                {activeTab === 'staking' && (
                  <StakingComponent stakingRewardsAddress={stakeRewards} tokenA={tokenA} tokenB={tokenB} tokenAName={tokenAName} tokenASymbol={tokenASymbol} tokenBName={tokenBName} tokenBSymbol={tokenBSymbol} />
                )}
                {activeTab === 'leaderboard' && (
                  <LeaderboardComponent pointsTrackerAddress={pointsTracker || '0x97c18678914B627aEaA9920e85e2E8f6B4CA5F74'} />
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Token Summary</p>
                <p className="mt-3 text-xl font-semibold text-white">{tokenASymbol} / {tokenBSymbol}</p>
                <p className="mt-2 text-sm text-slate-400">Primary pair addresses and deployment details are driven from the deployment config file.</p>
              </div>
              {extraTokens.length > 0 && (
                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Additional Assets</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {extraTokens.map((token, idx) => (
                      <span key={idx} className="rounded-2xl bg-slate-800 px-3 py-2 text-sm text-slate-200">
                        {token.symbol}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deployment notes and admin panels moved to /admin */}
        </section>

        <AdaptiveLayout />
      </main>

      <footer className="border-t border-slate-800 bg-[#050816] py-6 px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{dexName} · Built for deployment workflows.</p>
          <p>Connected wallet: {isConnected ? userAddress : 'not connected'}</p>
        </div>
      </footer>
    </div>
  );
}
