"use client";

import React, { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { astrodexConfig } from '@/lib/dexConfig';
import { ComprehensiveDashboard, ModuleHealthPanel } from "@/features/analytics";

const LOGO_CANDIDATES = ['/logo.png', '/logo.webp', '/logo.jpg', '/logo.jpeg', '/logo.svg'];

function useAdminTx() {
  const { data: walletClient } = useWalletClient();
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function execute(contractAddress: string, abi: string[], method: string, args: unknown[] = []) {
    if (!walletClient) { setStatus('Wallet not connected'); return false; }
    if (!contractAddress) { setStatus('Contract address not configured'); return false; }
    try {
      const provider = new ethers.BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      setStatus('Sending transaction...');
      const tx = await contract[method](...args);
      setTxHash(tx.hash);
      setStatus('Confirming...');
      await tx.wait();
      setStatus('Success');
      return true;
    } catch (err: any) {
      const msg = err?.reason || err?.data?.message || err?.message || String(err);
      if (msg.includes('user rejected')) setStatus('Rejected by user');
      else setStatus('Error: ' + msg);
      return false;
    }
  }

  return { execute, status, txHash, setStatus, setTxHash };
}

function useAdminRead() {
  const { data: walletClient } = useWalletClient();
  const [status, setStatus] = useState<string | null>(null);

  async function execute(contractAddress: string, abi: string[], method: string, args: unknown[] = []) {
    if (!walletClient) { setStatus('Wallet not connected'); return null; }
    if (!contractAddress) { setStatus('Contract address not configured'); return null; }
    try {
      const provider = new ethers.BrowserProvider(walletClient as any);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const result = await contract[method](...args);
      setStatus(null);
      return result;
    } catch (err: any) {
      const msg = err?.reason || err?.data?.message || err?.message || String(err);
      setStatus('Error: ' + msg);
      return null;
    }
  }

  return { execute, status, setStatus };
}

const ROUTER_PAUSE_ABI = [
  'function pause() external',
  'function unpause() external',
  'function paused() external view returns (bool)',
];

const FACTORY_FEE_ABI = [
  'function defaultFee() external view returns (uint256)',
  'function setFee(uint256 newFee) external',
];

const ROUTER_MAX_SLIPPAGE_ABI = [
  'function maxSlippagePercent() external view returns (uint256)',
  'function setMaxSlippagePercent(uint256 _maxSlippagePercent) external',
];

const STAKING_FLUSH_ABI = [
  'function flushPenaltiesToRewards() external',
  'function fundRewards(uint256 amount) external',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
];

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const deployer = (process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || "").toLowerCase();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [pauseConfirmation, setPauseConfirmation] = useState('');
  const [feeInput, setFeeInput] = useState('');
  const [slippageInput, setSlippageInput] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [routerPaused, setRouterPaused] = useState<boolean | null>(null);
  const [currentFee, setCurrentFee] = useState<string | null>(null);
  const [currentSlippage, setCurrentSlippage] = useState<string | null>(null);
  const [penaltyReserve, setPenaltyReserve] = useState<string | null>(null);

  const contracts = astrodexConfig.contracts || {};
  const routerAddress = contracts.router || '';
  const factoryAddress = contracts.factory || '';
  const stakingAddress = contracts.stakingRewards || '';
  const rewardTokenAddress = astrodexConfig.tokens?.[1]?.address || '';
  const rewardTokenSymbol = astrodexConfig.tokens?.[1]?.symbol || 'Reward';
  const hasWalletProvider = typeof window !== 'undefined' && typeof (window as Window & { ethereum?: unknown }).ethereum !== 'undefined';

  const pauseTx = useAdminTx();
  const feeTx = useAdminTx();
  const slippageTx = useAdminTx();
  const flushTx = useAdminTx();
  const fundTx = useAdminTx();

  const adminRead = useAdminRead();

  useEffect(() => {
    let active = true;

    async function detectLogo() {
      for (const candidate of LOGO_CANDIDATES) {
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

  const loadRouterPaused = async () => {
    if (!routerAddress) return;
    const result = await adminRead.execute(routerAddress, ROUTER_PAUSE_ABI, 'paused');
    if (typeof result === 'boolean') {
      setRouterPaused(result);
    }
  };

  const loadFactoryFee = async () => {
    if (!factoryAddress) return;
    const result = await adminRead.execute(factoryAddress, FACTORY_FEE_ABI, 'defaultFee');
    if (result !== null && typeof result !== 'undefined') {
      setCurrentFee(result.toString());
    }
  };

  const loadRouterMaxSlippage = async () => {
    if (!routerAddress) return;
    const result = await adminRead.execute(routerAddress, ROUTER_MAX_SLIPPAGE_ABI, 'maxSlippagePercent');
    if (result !== null && typeof result !== 'undefined') {
      setCurrentSlippage(result.toString());
    }
  };

  const loadPenaltyReserve = async () => {
    if (!stakingAddress) return;
    const result = await adminRead.execute(stakingAddress, STAKING_FLUSH_ABI, 'penaltyReserve');
    if (result !== null && typeof result !== 'undefined') {
      setPenaltyReserve(result.toString());
    }
  };

  useEffect(() => {
    if (isConnected && address && hasWalletProvider) {
      loadRouterPaused();
      loadFactoryFee();
      loadRouterMaxSlippage();
      loadPenaltyReserve();
    }
  }, [isConnected, address, hasWalletProvider]);

  const handlePauseRouter = async () => {
    if (pauseTx.status === 'Sending transaction...' || pauseTx.status === 'Confirming...') return;
    if (pauseConfirmation.trim().toUpperCase() !== 'PAUSE') {
      pauseTx.setStatus('Enter PAUSE to confirm');
      return;
    }

    const success = await pauseTx.execute(routerAddress, ROUTER_PAUSE_ABI, 'pause');
    if (success) {
      setPauseConfirmation('');
      await loadRouterPaused();
    }
  };

  const handleUnpauseRouter = async () => {
    if (pauseTx.status === 'Sending transaction...' || pauseTx.status === 'Confirming...') return;
    const success = await pauseTx.execute(routerAddress, ROUTER_PAUSE_ABI, 'unpause');
    if (success) {
      await loadRouterPaused();
    }
  };

  const handleSetFee = async () => {
    if (feeTx.status === 'Sending transaction...' || feeTx.status === 'Confirming...') return;
    const feeValue = Number(feeInput);
    if (Number.isNaN(feeValue) || !Number.isFinite(feeValue)) {
      feeTx.setStatus('Enter a valid fee in basis points');
      return;
    }
    if (feeValue < 0 || feeValue >= 10000) {
      feeTx.setStatus('Fee must be between 0 and 9999');
      return;
    }

    const success = await feeTx.execute(factoryAddress, FACTORY_FEE_ABI, 'setFee', [feeValue]);
    if (success) {
      setFeeInput('');
      await loadFactoryFee();
    }
  };

  const handleSetMaxSlippage = async () => {
    if (slippageTx.status === 'Sending transaction...' || slippageTx.status === 'Confirming...') return;
    const slippageValue = Number(slippageInput);
    if (Number.isNaN(slippageValue) || !Number.isFinite(slippageValue)) {
      slippageTx.setStatus('Enter a valid slippage percent');
      return;
    }
    if (slippageValue < 0 || slippageValue > 100) {
      slippageTx.setStatus('Slippage must be between 0 and 100');
      return;
    }

    const success = await slippageTx.execute(routerAddress, ROUTER_MAX_SLIPPAGE_ABI, 'setMaxSlippagePercent', [slippageValue]);
    if (success) {
      setSlippageInput('');
      await loadRouterMaxSlippage();
    }
  };

  const handleFlushPenalties = async () => {
    if (flushTx.status === 'Sending transaction...' || flushTx.status === 'Confirming...') return;
    const success = await flushTx.execute(stakingAddress, STAKING_FLUSH_ABI, 'flushPenaltiesToRewards');
    if (success) {
      flushTx.setStatus('Success');
      await loadPenaltyReserve();
    }
  };

  const handleFundRewards = async () => {
    if (fundTx.status === 'Sending transaction...' || fundTx.status === 'Confirming...') return;
    if (!fundAmount) {
      fundTx.setStatus('Enter an amount to fund');
      return;
    }
    if (!walletClient) {
      fundTx.setStatus('Wallet not connected');
      return;
    }
    if (!rewardTokenAddress || !stakingAddress) {
      fundTx.setStatus('Reward token or staking contract address missing');
      return;
    }

    try {
      const amount = ethers.parseEther(fundAmount);
      const provider = new ethers.BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(rewardTokenAddress, ERC20_ABI, signer);

      fundTx.setStatus('Approving token spend...');
      const approveTx = await tokenContract.approve(stakingAddress, amount);
      await approveTx.wait();

      fundTx.setStatus('Funding reward reserve...');
      const stakingContract = new ethers.Contract(stakingAddress, STAKING_FLUSH_ABI, signer);
      const tx = await stakingContract.fundRewards(amount);
      fundTx.setTxHash(tx.hash);
      await tx.wait();
      fundTx.setStatus('Success');
      setFundAmount('');
    } catch (err: any) {
      const msg = err?.reason || err?.data?.message || err?.message || String(err);
      if (msg.includes('user rejected')) fundTx.setStatus('Rejected by user');
      else fundTx.setStatus('Error: ' + msg);
    }
  };

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadMessage('Please upload a valid image file.');
      return;
    }

    setIsUploading(true);
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed.');
      }

      const uploadedUrl = `${data.url}?t=${Date.now()}`;
      setPreviewUrl(uploadedUrl);
      setLogoUrl(uploadedUrl);
      setUploadMessage('Logo uploaded successfully.');
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  if (!hasWalletProvider) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <div className="max-w-xl w-full p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Wallet provider unavailable</h2>
          <p className="text-sm text-slate-300">Please install or enable a wallet provider to use admin controls.</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <div className="max-w-xl w-full p-8">
          <h2 className="text-2xl font-semibold mb-4">Admin Access Required</h2>
          <p className="mb-4 text-sm text-slate-300">Please connect the deployer wallet to access admin controls.</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (!address || address.toLowerCase() !== deployer) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <div className="max-w-xl w-full p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
          <p className="text-sm text-slate-300">Your connected wallet does not match the configured deployer address.</p>
        </div>
      </div>
    );
  }

  const isPausePending = pauseTx.status === 'Sending transaction...' || pauseTx.status === 'Confirming...';
  const isFeePending = feeTx.status === 'Sending transaction...' || feeTx.status === 'Confirming...';
  const isSlippagePending = slippageTx.status === 'Sending transaction...' || slippageTx.status === 'Confirming...';
  const isFlushPending = flushTx.status === 'Sending transaction...' || flushTx.status === 'Confirming...';
  const isFundPending = fundTx.status === 'Sending transaction...' || fundTx.status === 'Confirming...';

  return (
    <div className="min-h-screen bg-[#050816] text-white p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">AstroDEX — Admin</h1>
        <p className="text-sm text-slate-400 mt-1">Deployer: {address}</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.8fr_1fr] mb-8">
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
              <h2 className="text-xl font-semibold text-white">Emergency Pause / Unpause</h2>
              <p className="mt-2 text-sm text-slate-400">Pause or unpause the router contract to stop swaps immediately.</p>

              <div className="mt-4 space-y-4">
                <div className="text-sm text-slate-300">Current status: {routerPaused === null ? 'Loading...' : routerPaused ? 'Paused' : 'Active'}</div>
                <label className="block text-sm text-slate-300">
                  Confirm pause by typing <span className="font-semibold">PAUSE</span> below.
                </label>
                <input
                  value={pauseConfirmation}
                  onChange={(event) => {
                    pauseTx.setStatus(null);
                    setPauseConfirmation(event.target.value);
                  }}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-slate-500"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handlePauseRouter}
                    disabled={!routerAddress || routerPaused === true || isPausePending}
                    className="rounded-3xl bg-red-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    {isPausePending ? 'Pausing...' : 'Pause Router'}
                  </button>
                  <button
                    type="button"
                    onClick={handleUnpauseRouter}
                    disabled={!routerAddress || routerPaused === false || isPausePending}
                    className="rounded-3xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40"
                  >
                    {isPausePending ? 'Unpausing...' : 'Unpause Router'}
                  </button>
                </div>
                {pauseTx.status && <p className="text-sm text-slate-300">{pauseTx.status}</p>}
                {pauseTx.txHash && (
                  <a href={`https://explorer.testnet.arc.network/tx/${pauseTx.txHash}`} target="_blank" rel="noreferrer" className="text-sm text-sky-300 underline">
                    View transaction
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
              <h2 className="text-xl font-semibold text-white">Swap Fee</h2>
              <p className="mt-2 text-sm text-slate-400">Update the factory swap fee in basis points.</p>

              <div className="mt-4 space-y-4">
                <div className="text-sm text-slate-300">Current fee: {currentFee === null ? 'Loading...' : `${currentFee} bps`}</div>
                <label className="block text-sm text-slate-300">New fee (0-9999)</label>
                <input
                  value={feeInput}
                  onChange={(event) => {
                    feeTx.setStatus(null);
                    setFeeInput(event.target.value);
                  }}
                  type="number"
                  min={0}
                  max={9999}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-slate-500"
                />
                <button
                  type="button"
                  onClick={handleSetFee}
                  disabled={!factoryAddress || isFeePending}
                  className="w-full rounded-3xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40"
                >
                  {isFeePending ? 'Updating fee...' : 'Set Swap Fee'}
                </button>
                {feeTx.status && <p className="text-sm text-slate-300">{feeTx.status}</p>}
                {feeTx.txHash && (
                  <a href={`https://explorer.testnet.arc.network/tx/${feeTx.txHash}`} target="_blank" rel="noreferrer" className="text-sm text-sky-300 underline">
                    View transaction
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
              <h2 className="text-xl font-semibold text-white">Max Slippage</h2>
              <p className="mt-2 text-sm text-slate-400">Set the router maximum permitted slippage percentage.</p>

              <div className="mt-4 space-y-4">
                <div className="text-sm text-slate-300">Current max slippage: {currentSlippage === null ? 'Loading...' : `${currentSlippage}%`}</div>
                <label className="block text-sm text-slate-300">Slippage percent (0-100)</label>
                <input
                  value={slippageInput}
                  onChange={(event) => {
                    slippageTx.setStatus(null);
                    setSlippageInput(event.target.value);
                  }}
                  type="number"
                  min={0}
                  max={100}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-slate-500"
                />
                <button
                  type="button"
                  onClick={handleSetMaxSlippage}
                  disabled={!routerAddress || isSlippagePending}
                  className="w-full rounded-3xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40"
                >
                  {isSlippagePending ? 'Updating slippage...' : 'Set Max Slippage'}
                </button>
                {slippageTx.status && <p className="text-sm text-slate-300">{slippageTx.status}</p>}
                {slippageTx.txHash && (
                  <a href={`https://explorer.testnet.arc.network/tx/${slippageTx.txHash}`} target="_blank" rel="noreferrer" className="text-sm text-sky-300 underline">
                    View transaction
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
              <h2 className="text-xl font-semibold text-white">Flush Staking Penalties</h2>
              <p className="mt-2 text-sm text-slate-400">Move accumulated early-exit penalties back into the staking reward pool.</p>

              <div className="mt-4 space-y-4">
                <button
                  type="button"
                  onClick={handleFlushPenalties}
                  disabled={!stakingAddress || isFlushPending}
                  className="w-full rounded-3xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40"
                >
                  {isFlushPending ? 'Flushing...' : 'Flush Penalties to Rewards'}
                </button>
                {flushTx.status && <p className="text-sm text-slate-300">{flushTx.status}</p>}
                {flushTx.txHash && (
                  <a href={`https://explorer.testnet.arc.network/tx/${flushTx.txHash}`} target="_blank" rel="noreferrer" className="text-sm text-sky-300 underline">
                    View transaction
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
              <h2 className="text-xl font-semibold text-white">Fund Reward Reserve</h2>
              <p className="mt-2 text-sm text-slate-400">Approve and deposit reward token funds into staking reserve.</p>

              <div className="mt-4 space-y-4">
                <div className="text-sm text-slate-300">Reward token: {rewardTokenSymbol}</div>
                <label className="block text-sm text-slate-300">Amount to fund</label>
                <input
                  value={fundAmount}
                  onChange={(event) => {
                    fundTx.setStatus(null);
                    setFundAmount(event.target.value);
                  }}
                  type="text"
                  placeholder="0.0"
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-slate-500"
                />
                <button
                  type="button"
                  onClick={handleFundRewards}
                  disabled={!stakingAddress || !rewardTokenAddress || isFundPending}
                  className="w-full rounded-3xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40"
                >
                  {isFundPending ? 'Funding...' : 'Fund Reward Reserve'}
                </button>
                {fundTx.status && <p className="text-sm text-slate-300">{fundTx.status}</p>}
                {fundTx.txHash && (
                  <a href={`https://explorer.testnet.arc.network/tx/${fundTx.txHash}`} target="_blank" rel="noreferrer" className="text-sm text-sky-300 underline">
                    View transaction
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
            <h2 className="text-xl font-semibold text-white">Logo Upload</h2>
            <p className="mt-2 text-sm text-slate-400">Upload a custom deployment logo for the homepage header.</p>

            <div className="mt-6 flex flex-col gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Current logo" className="max-h-40 w-full rounded-3xl object-contain border border-slate-800 bg-slate-950 p-4" />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/80 text-slate-500">
                  No logo uploaded yet.
                </div>
              )}

              <label className="block rounded-3xl border border-slate-700 bg-slate-950/90 p-4 text-sm text-slate-200">
                <span className="font-semibold">Choose logo file</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="mt-3 w-full text-sm text-slate-100 file:mr-4 file:rounded-full file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-sm file:text-white"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>

              <div className="space-y-2 text-sm text-slate-300">
                <p>{uploadMessage || 'Choose an image and upload to replace the header logo.'}</p>
                {isUploading && <p>Uploading logo…</p>}
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
            <h3 className="text-lg font-semibold text-white">Deployment tools</h3>
            <p className="mt-3 text-sm text-slate-400">This admin page is reserved for the configured deployer address. Uploaded logos are persisted to the public assets directory.</p>
            <p className="mt-4 text-sm text-slate-400">After uploading a new logo, refresh the homepage to see it in the app header.</p>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ComprehensiveDashboard />
        </div>
        <div className="space-y-6">
          <ModuleHealthPanel />
          <div className="rounded-lg bg-slate-900 p-4 border border-slate-800">
            <h4 className="font-semibold mb-2">Governance Controls</h4>
            <p className="text-sm text-slate-400">Governance UI and proposal management tools go here.</p>
          </div>
          <div className="rounded-lg bg-slate-900 p-4 border border-slate-800">
            <h4 className="font-semibold mb-2">Risk Scores</h4>
            <p className="text-sm text-slate-400">Risk scoring and mitigation controls live here.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
