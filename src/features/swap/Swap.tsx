import { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { useSwap } from './useSwap';
import { ERC20_ABI } from '../erc20';
import { TOKEN_LISTS } from '../../lib/tokenLists';
import { astrodexConfig } from '../../lib/dexConfig';
import { deployments } from '../../lib/deployments';
import routerArtifact from '../../contracts/abis/dex/Router.sol/Router.json';
const routerAbi = routerArtifact.abi;

type SwapProps = {
  routerAddress: string;
  tokenA: string;
  tokenB: string;
  tokenAName?: string;
  tokenASymbol: string;
  tokenBName?: string;
  tokenBSymbol: string;
  network: string;
};

type LoadingState = 'idle' | 'loading' | 'success' | 'error';
type ErrorType = 'network' | 'contract' | 'validation' | 'transaction' | null;

export default function Swap({ routerAddress, tokenA, tokenB, tokenAName, tokenASymbol, tokenBName, tokenBSymbol, network }: SwapProps) {
  const [fromToken, setFromToken] = useState(tokenA || tokenASymbol || '');
  const [toToken, setToToken] = useState(tokenB || tokenBSymbol || '');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [amountTouched, setAmountTouched] = useState(false);

  const inputStyle = {
    background: 'var(--color-surface, #0a0a1a)',
    color: 'var(--color-text-primary, #e0ffe0)',
    border: '1px solid var(--color-border, #003322)',
    borderRadius: '4px',
    padding: '8px 12px',
    width: '100%'
  };

  const selectStyle = {
    background: 'var(--color-surface, #0a0a1a)',
    color: 'var(--color-text-primary, #e0ffe0)',
    border: '1px solid var(--color-border, #003322)',
    borderRadius: '4px',
    padding: '8px 12px',
    width: '100%',
    cursor: 'pointer',
    appearance: 'none' as const
  };

  // Enhanced state management
  const [fromTokenMeta, setFromTokenMeta] = useState<{ label?: string; symbol?: string; decimals?: number }>({});
  const [toTokenMeta, setToTokenMeta] = useState<{ label?: string; symbol?: string; decimals?: number }>({});
  const [estimatedOut, setEstimatedOut] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [allowance, setAllowance] = useState<string>('0');
  const [walletAddress, setWalletAddress] = useState<string>('');

  // Loading and error states
  const [tokenMetaLoading, setTokenMetaLoading] = useState<LoadingState>('idle');
  const [estimateLoading, setEstimateLoading] = useState<LoadingState>('idle');
  const [balanceLoading, setBalanceLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<{ type: ErrorType; message: string } | null>(null);

  const { isConnected } = useAccount();
  const { swap, txStatus } = useSwap(routerAddress, routerAbi);

  const activeDeployment = deployments[network as keyof typeof deployments] || { tokens: [] };
  const fallbackTokens = (activeDeployment.tokens as Array<{ symbol: string; address: string }>) || [];

  const getTokenAddress = (symbol: string, explicitAddress: string) => {
    if (explicitAddress && ethers.isAddress(explicitAddress)) return explicitAddress;
    const configAddress = astrodexConfig.tokens?.find((token) => token.symbol === symbol)?.address || '';
    if (configAddress && ethers.isAddress(configAddress)) return configAddress;
    const deploymentAddress = fallbackTokens.find((token) => token.symbol === symbol)?.address || '';
    if (deploymentAddress && ethers.isAddress(deploymentAddress)) return deploymentAddress;
    return '';
  };

  const resolvedTokenA = getTokenAddress(tokenASymbol || tokenAName || 'TOKENA', tokenA);
  const resolvedTokenB = getTokenAddress(tokenBSymbol || tokenBName || 'TOKENB', tokenB);

  const tokenOptions = useMemo(() => {
    const list = TOKEN_LISTS[network as keyof typeof TOKEN_LISTS] || [];
    const usdcToken = list.find(token => token.symbol === 'USDC') || fallbackTokens.find(token => token.symbol === 'USDC');
    const usdcName = usdcToken && 'name' in usdcToken && usdcToken.name ? usdcToken.name : 'USD Coin';
    const explicitTokens = [
      { address: resolvedTokenA, symbol: tokenASymbol || tokenAName || 'TOKENA', name: tokenAName || 'Token A' },
      { address: resolvedTokenB, symbol: tokenBSymbol || tokenBName || 'TOKENB', name: tokenBName || 'Token B' },
      ...(usdcToken ? [{ address: usdcToken.address, symbol: usdcToken.symbol, name: usdcName }] : []),
    ];

    const normalizedTokens = explicitTokens
      .filter((token) => token.symbol)
      .map((token) => {
        const validAddress = token.address && ethers.isAddress(token.address) ? token.address : '';
        const value = validAddress || token.symbol;
        return { ...token, address: validAddress, value };
      });

    return Array.from(new Map(normalizedTokens.map((token) => [token.value, token])).values()).map((token) => ({
      label: `${token.symbol} (${token.name})`,
      value: token.value,
      symbol: token.symbol,
    }));
  }, [network, resolvedTokenA, resolvedTokenB, tokenASymbol, tokenBName, tokenAName, tokenBSymbol, fallbackTokens]);

  const defaultFromTokenValue = tokenOptions.find((option) => option.symbol === tokenASymbol)?.value || tokenOptions[0]?.value || '';
  const defaultToTokenValue = tokenOptions.find((option) => option.symbol === tokenBSymbol)?.value || tokenOptions.find((option) => option.value !== defaultFromTokenValue)?.value || '';

  useEffect(() => {
    const resolvedFrom = resolvedTokenA || defaultFromTokenValue;
    let resolvedTo = resolvedTokenB || defaultToTokenValue;

    if (resolvedTo && resolvedFrom && resolvedTo === resolvedFrom) {
      resolvedTo = tokenOptions.find((option) => option.value !== resolvedFrom)?.value || resolvedTo;
    }

    if (resolvedFrom) setFromToken(resolvedFrom);
    if (resolvedTo) setToToken(resolvedTo);
  }, [resolvedTokenA, resolvedTokenB, defaultFromTokenValue, defaultToTokenValue, tokenOptions]);

  const selectedFromToken = tokenOptions.find((option) => option.value === fromToken);
  const selectedToToken = tokenOptions.find((option) => option.value === toToken);
  const getLogoUrl = (symbol?: string) => symbol ? `/tokens/${symbol.toLowerCase()}.svg` : '';

  // Enhanced validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!selectedFromToken) errors.push('Invalid from token');
    if (!selectedToToken) errors.push('Invalid to token');
    if (fromToken === toToken) errors.push('Cannot swap same token');
    if (amountTouched && (!amount || isNaN(Number(amount)) || Number(amount) <= 0)) errors.push('Invalid amount');
    if (Number(amount) > Number(balance)) errors.push('Insufficient balance');
    if (Number(slippage) < 0 || Number(slippage) > 100) errors.push('Invalid slippage (0-100%)');
    return errors;
  }, [fromToken, toToken, amount, balance, slippage]);

  const canSwap = validationErrors.length === 0 && txStatus !== 'pending';

  // Enhanced token metadata loading with error handling
  useEffect(() => {
    async function loadTokenMeta(token: string, setMeta: React.Dispatch<React.SetStateAction<{ label?: string; symbol?: string; decimals?: number }>>) {
      if (!token || !ethers.isAddress(token)) {
        setMeta({});
        return;
      }

      setTokenMetaLoading('loading');
      try {
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const tokenContract = new ethers.Contract(token, ERC20_ABI, provider);

        const [symbol, name, decimals] = await Promise.all([
          tokenContract.symbol().catch(() => 'UNKNOWN'),
          tokenContract.name().catch(() => 'Unknown Token'),
          tokenContract.decimals().catch(() => 18)
        ]);

        setMeta({ symbol, label: name, decimals });
        setTokenMetaLoading('success');
        setError(null);
      } catch (err) {
        console.error('Failed to load token metadata:', err);
        setMeta({});
        setTokenMetaLoading('error');
        setError({ type: 'contract', message: 'Failed to load token information' });
      }
    }

    loadTokenMeta(fromToken, setFromTokenMeta);
  }, [fromToken]);

  useEffect(() => {
    async function loadTokenMeta(token: string, setMeta: React.Dispatch<React.SetStateAction<{ label?: string; symbol?: string; decimals?: number }>>) {
      if (!token || !ethers.isAddress(token)) {
        setMeta({});
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const tokenContract = new ethers.Contract(token, ERC20_ABI, provider);

        const [symbol, name, decimals] = await Promise.all([
          tokenContract.symbol().catch(() => 'UNKNOWN'),
          tokenContract.name().catch(() => 'Unknown Token'),
          tokenContract.decimals().catch(() => 18)
        ]);

        setMeta({ symbol, label: name, decimals });
        setError(null);
      } catch (err) {
        console.error('Failed to load token metadata:', err);
        setMeta({});
        setError({ type: 'contract', message: 'Failed to load token information' });
      }
    }

    loadTokenMeta(toToken, setToTokenMeta);
  }, [toToken]);

  // Track connected wallet address and refresh when accounts or chain changes.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setWalletAddress('');
      return;
    }

    let active = true;
    const provider = new ethers.BrowserProvider(window.ethereum as any);

    const updateWalletAddress = async () => {
      try {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        if (active) {
          setWalletAddress(address);
        }
      } catch {
        if (active) {
          setWalletAddress('');
        }
      }
    };

    updateWalletAddress();

    const onAccountsChanged = () => updateWalletAddress();
    const onChainChanged = () => updateWalletAddress();

    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);

    return () => {
      active = false;
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener('chainChanged', onChainChanged);
    };
  }, []);

  // Load user balance for fromToken and refresh periodically while connected
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    async function loadBalance() {
      if (!fromToken || !ethers.isAddress(fromToken) || !walletAddress || !window.ethereum) {
        setBalance('0');
        return;
      }

      setBalanceLoading('loading');
      try {
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const tokenContract = new ethers.Contract(fromToken, ERC20_ABI, provider);
        const balanceValue = await tokenContract.balanceOf(walletAddress);
        const decimals = fromTokenMeta.decimals || 18;
        if (!cancelled) {
          setBalance(ethers.formatUnits(balanceValue, decimals));
          setBalanceLoading('success');
        }
      } catch (err) {
        console.error('Failed to load balance:', err);
        if (!cancelled) {
          setBalance('0');
          setBalanceLoading('error');
        }
      }
    }

    if (fromToken && ethers.isAddress(fromToken) && walletAddress && isConnected && window.ethereum) {
      loadBalance();
      interval = setInterval(loadBalance, 15000);
    } else {
      setBalance('0');
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [fromToken, fromTokenMeta.decimals, walletAddress, isConnected]);

  // Enhanced output estimation with error handling
  useEffect(() => {
    async function estimateOutput() {
      if (!amount || !fromToken || !toToken || fromToken === toToken) {
        setEstimatedOut('');
        return;
      }

      setEstimateLoading('loading');
      try {
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const router = new ethers.Contract(routerAddress, routerAbi, provider);

        const fromDecimals = fromTokenMeta.decimals || 18;
        const parsedAmount = ethers.parseUnits(amount, fromDecimals);

        const amountsOut = await router.getAmountsOut(parsedAmount, [fromToken, toToken]);
        const toDecimals = toTokenMeta.decimals || 18;
        const outAmount = ethers.formatUnits(amountsOut[amountsOut.length - 1], toDecimals);

        setEstimatedOut(outAmount);
        setEstimateLoading('success');
        setError(null);
      } catch (err) {
        console.error('Failed to estimate output:', err);
        setEstimatedOut('');
        setEstimateLoading('error');
        setError({ type: 'contract', message: 'Failed to estimate swap output' });
      }
    }

    if (amount && fromToken && toToken && fromToken !== toToken && window.ethereum) {
      estimateOutput();
    }
  }, [amount, fromToken, toToken, routerAddress, routerAbi, fromTokenMeta.decimals, toTokenMeta.decimals]);

  const displayFromToken = fromTokenMeta.symbol ? `${fromTokenMeta.symbol} (${fromTokenMeta.label})` : fromToken;
  const displayToToken = toTokenMeta.symbol ? `${toTokenMeta.symbol} (${toTokenMeta.label})` : toToken;

  return (
    <div className="p-6 bg-white rounded shadow w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">Swap</h2>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="font-semibold">Error</div>
          <div className="text-sm">{error.message}</div>
        </div>
      )}

      {/* From Token Selection */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">From Token</label>
          {selectedFromToken?.symbol && (
            <img
              src={getLogoUrl(selectedFromToken.symbol)}
              alt={`${selectedFromToken.symbol} logo`}
              width={20}
              height={20}
              className="rounded-full"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </div>
        {tokenOptions.length > 0 ? (
          <select
            style={selectStyle}
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            disabled={tokenMetaLoading === 'loading'}
          >
            {tokenOptions.map((token) => (
              <option key={token.value} value={token.value}>
                {token.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            style={inputStyle}
            placeholder="From Token Address (0x...)"
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
          />
        )}
        {tokenMetaLoading === 'loading' && <div className="text-xs text-gray-500 mt-1">Loading token info...</div>}
        {tokenMetaLoading === 'error' && <div className="text-xs text-red-500 mt-1">Failed to load token info</div>}
      </div>

      {/* To Token Selection */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">To Token</label>
          {selectedToToken?.symbol && (
            <img
              src={getLogoUrl(selectedToToken.symbol)}
              alt={`${selectedToToken.symbol} logo`}
              width={20}
              height={20}
              className="rounded-full"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </div>
        {tokenOptions.length > 0 ? (
          <select
            style={selectStyle}
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            disabled={tokenMetaLoading === 'loading'}
          >
            {tokenOptions.map((token) => (
              <option key={token.value} value={token.value}>
                {token.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            style={inputStyle}
            placeholder="To Token Address (0x...)"
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
          />
        )}
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Amount</label>
        <div className="relative">
          <input
            style={inputStyle}
            placeholder="0.0"
            value={amount}
            onChange={e => {
              if (!amountTouched) setAmountTouched(true);
              setAmount(e.target.value);
            }}
            type="number"
            step="any"
          />
          <div className="absolute right-2 top-2 text-xs text-slate-400">
            {balanceLoading === 'loading' ? '...' : `Balance: ${balance}`}
          </div>
        </div>
        {balanceLoading === 'error' && <div className="text-xs text-red-500 mt-1">Failed to load balance</div>}
      </div>

      {/* Slippage Tolerance */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Slippage Tolerance (%)</label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="100"
          style={inputStyle}
          value={slippage}
          onChange={e => setSlippage(e.target.value)}
        />
      </div>

      {/* Output Estimation */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="text-sm text-gray-600">Estimated Output</div>
        {estimateLoading === 'loading' && <div className="text-sm">Calculating...</div>}
        {estimateLoading === 'error' && <div className="text-sm text-red-500">Failed to estimate</div>}
        {estimateLoading === 'success' && estimatedOut && (
          <div className="text-lg font-semibold">
            {estimatedOut} {toTokenMeta.symbol || 'tokens'}
          </div>
        )}
        {!estimatedOut && estimateLoading === 'idle' && (
          <div className="text-sm text-gray-400">Enter amount to see estimate</div>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="font-semibold text-yellow-800 mb-1">Please fix:</div>
          <ul className="text-sm text-yellow-700 list-disc list-inside">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Swap Button */}
      <button
        className={`px-4 py-3 rounded w-full font-semibold transition-colors ${
          canSwap
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        onClick={() => swap(fromToken, toToken, amount, Number(slippage))}
        disabled={!canSwap}
      >
        {txStatus === 'pending' ? 'Swapping...' : 'Swap Tokens'}
      </button>

      {/* Transaction Status */}
      {txStatus && txStatus !== 'pending' && (
        <div className={`mt-3 p-2 rounded text-sm ${
          txStatus.includes('success') ? 'bg-green-100 text-green-800' :
          txStatus.includes('error') ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {txStatus}
        </div>
      )}
    </div>
  );
}
