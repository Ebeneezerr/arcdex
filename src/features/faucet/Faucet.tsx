import { useState, useEffect, useRef } from 'react';
import { useFaucet } from './useFaucet';
import faucetAbi from '../../contracts/abis/faucet/Faucet.sol/Faucet.json';
import { useAccount } from 'wagmi';
import { astrodexConfig } from '../../lib/dexConfig';
import { deployments, defaultNetwork } from '../../lib/deployments';

type FaucetProps = {
  faucetAddress: string;
  tokenA?: string;
  tokenB?: string;
};

export default function Faucet({ faucetAddress, tokenA = '', tokenB = '' }: FaucetProps) {
  const [token, setToken] = useState('');
  const pendingAddTokenRef = useRef<string | null>(null);
  const { request, requestBoth, txStatus } = useFaucet(
    faucetAddress,
    faucetAbi.abi
  );
  const { isConnected } = useAccount();
  const tokenASymbol = astrodexConfig.tokenASymbol || astrodexConfig.tokens?.[0]?.symbol || 'TOKENA';
  const tokenBSymbol = astrodexConfig.tokenBSymbol || astrodexConfig.tokens?.[1]?.symbol || 'TOKENB';
  const network = (astrodexConfig.network as string) || defaultNetwork;
  const activeDeployment = deployments[network as keyof typeof deployments] || { tokens: [] };
  const fallbackTokens = (activeDeployment.tokens as Array<{ symbol: string; address: string }>) || [];

  const getTokenAddress = (symbol: string, explicitAddress: string) => {
    if (explicitAddress && explicitAddress.trim() && explicitAddress.startsWith('0x')) return explicitAddress;
    const configAddress = astrodexConfig.tokens?.find((item) => item.symbol === symbol)?.address || '';
    if (configAddress && configAddress.trim() && configAddress.startsWith('0x')) return configAddress;
    return fallbackTokens.find((item) => item.symbol === symbol)?.address || '';
  };

  const tokenAContractAddress = getTokenAddress(tokenASymbol, tokenA);
  const tokenBContractAddress = getTokenAddress(tokenBSymbol, tokenB);

  const handleAddTokenToWallet = async (tokenContractAddress: string, tokenSymbol: string) => {
    if (!tokenContractAddress || typeof window === 'undefined' || !(window as any).ethereum?.request) {
      return;
    }

    console.log('Adding token to wallet:', tokenSymbol, tokenContractAddress);

    try {
      await (window as any).ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenContractAddress,
            symbol: tokenSymbol,
            decimals: 18,
            image: `${window.location.origin}/tokens/${tokenSymbol.toLowerCase()}.svg`,
          },
        },
      });
    } catch (error: any) {
      const message = error?.message?.toString() ?? '';
      if (message.includes('already added') || message.includes('user rejected') || message.includes('rejected')) {
        console.warn('Token add ignored:', tokenSymbol, message);
        return;
      }
      console.error('Failed to add token to wallet', error);
    }
  };

  const inputStyle = {
    background: 'var(--color-surface, #0a0a1a)',
    color: 'var(--color-text-primary, #e0ffe0)',
    border: '1px solid var(--color-border, #003322)',
    borderRadius: '4px',
    padding: '8px 12px',
    width: '100%'
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        console.error('Connect wallet failed', error);
      }
    }
  };

  useEffect(() => {
    const pendingAddToken = pendingAddTokenRef.current;
    if (txStatus === 'Request successful' && pendingAddToken) {
      if (pendingAddToken === 'both') {
        if (tokenAContractAddress) {
          handleAddTokenToWallet(tokenAContractAddress, tokenASymbol);
        }
        if (tokenBContractAddress) {
          handleAddTokenToWallet(tokenBContractAddress, tokenBSymbol);
        }
      } else {
        const requestedToken = pendingAddToken.trim().toLowerCase();
        if (tokenAContractAddress && requestedToken === tokenAContractAddress.toLowerCase()) {
          handleAddTokenToWallet(tokenAContractAddress, tokenASymbol);
        } else if (tokenBContractAddress && requestedToken === tokenBContractAddress.toLowerCase()) {
          handleAddTokenToWallet(tokenBContractAddress, tokenBSymbol);
        }
      }
      pendingAddTokenRef.current = null;
    }
  }, [txStatus, tokenAContractAddress, tokenBContractAddress, tokenASymbol, tokenBSymbol]);

  return (
    <div className="p-6 bg-white rounded shadow w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">Faucet</h2>
      <div className="mb-2">
        <input
          style={inputStyle}
          placeholder="Token Address (or leave blank for both)"
          value={token}
          onChange={e => setToken(e.target.value)}
          disabled={!isConnected}
        />
      </div>
      {token ? (
        isConnected ? (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
            onClick={() => { console.log('Faucet: Request single', token); pendingAddTokenRef.current = token; request(token); }}
          >
            Request Token
          </button>
        ) : (
          <button
            className="bg-slate-700 text-white px-4 py-2 rounded w-full"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        )
      ) : isConnected ? (
        <button
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
          onClick={() => { console.log('Faucet: Request both'); pendingAddTokenRef.current = 'both'; requestBoth(); }}
        >
          Request Both Tokens
        </button>
      ) : (
        <button
          className="bg-slate-700 text-white px-4 py-2 rounded w-full"
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {tokenAContractAddress && (
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded"
            onClick={() => handleAddTokenToWallet(tokenAContractAddress, tokenASymbol)}
          >
            Add {tokenASymbol} to Wallet
          </button>
        )}
        {tokenBContractAddress && (
          <button
            className="bg-violet-600 text-white px-4 py-2 rounded"
            onClick={() => handleAddTokenToWallet(tokenBContractAddress, tokenBSymbol)}
          >
            Add {tokenBSymbol} to Wallet
          </button>
        )}
      </div>

      {txStatus && (
        <div className="mt-2 text-sm p-2 rounded bg-gray-100 text-gray-800">
          {txStatus}
        </div>
      )}
    </div>
  );
}
