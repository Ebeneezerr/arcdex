import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useLiquidity } from './useLiquidity';
import routerArtifact from '../../contracts/abis/dex/Router.sol/Router.json';
import { astrodexConfig } from '../../lib/dexConfig';
import { deployments, defaultNetwork } from '../../lib/deployments';

type LiquidityProps = {
  routerAddress: string;
  tokenA: string;
  tokenB: string;
};

const ZERO_ADDRESS_REGEX = /^0x0+$/i;
const isValidAddress = (value: string) => !!value && ethers.isAddress(value) && !ZERO_ADDRESS_REGEX.test(value);

export default function Liquidity({ routerAddress, tokenA, tokenB }: LiquidityProps) {
  const deploymentTokens = deployments[defaultNetwork]?.tokens || [];
  const resolvedRouterAddress = routerAddress || astrodexConfig.contracts?.router || deployments[defaultNetwork]?.contracts?.router || '';
  const resolvedTokenA = tokenA || astrodexConfig.tokens?.[0]?.address || deploymentTokens[0]?.address || '';
  const resolvedTokenB = tokenB || astrodexConfig.tokens?.[1]?.address || deploymentTokens[1]?.address || '';

  const [selectedTokenA, setSelectedTokenA] = useState(resolvedTokenA);
  const [selectedTokenB, setSelectedTokenB] = useState(resolvedTokenB);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');

  useEffect(() => {
    setSelectedTokenA(resolvedTokenA);
  }, [resolvedTokenA]);

  useEffect(() => {
    setSelectedTokenB(resolvedTokenB);
  }, [resolvedTokenB]);

  const isRouterReady = isValidAddress(resolvedRouterAddress);
  const canAdd = isRouterReady && isValidAddress(selectedTokenA) && isValidAddress(selectedTokenB) && selectedTokenA !== selectedTokenB && amountA !== '' && amountB !== '';
  const { addLiquidity, txStatus } = useLiquidity(resolvedRouterAddress, routerArtifact.abi);

  const inputStyle = {
    background: 'var(--color-surface, #0a0a1a)',
    color: 'var(--color-text-primary, #e0ffe0)',
    border: '1px solid var(--color-border, #003322)',
    borderRadius: '4px',
    padding: '8px 12px',
    width: '100%'
  };

  return (
    <div className="p-6 bg-white rounded shadow w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">Add Liquidity</h2>
      <div className="mb-2">
        <input
          style={inputStyle}
          placeholder="Token A Address"
          value={selectedTokenA}
          onChange={e => setSelectedTokenA(e.target.value)}
        />
      </div>
      <div className="mb-2">
        <input
          style={inputStyle}
          placeholder="Token B Address"
          value={selectedTokenB}
          onChange={e => setSelectedTokenB(e.target.value)}
        />
      </div>
      <div className="mb-2">
        <input
          style={inputStyle}
          placeholder="Amount A"
          value={amountA}
          onChange={e => setAmountA(e.target.value)}
        />
      </div>
      <div className="mb-2">
        <input
          style={inputStyle}
          placeholder="Amount B"
          value={amountB}
          onChange={e => setAmountB(e.target.value)}
        />
      </div>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        onClick={() => addLiquidity(selectedTokenA, selectedTokenB, amountA, amountB)}
        disabled={!canAdd}
      >
        Add Liquidity
      </button>
      {!isRouterReady && (
        <div className="mt-3 rounded-lg border border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Router contract address is missing or invalid. Please deploy the router or update the config before adding liquidity.
        </div>
      )}
      {txStatus && <div className="mt-2 text-sm">{txStatus}</div>}
    </div>
  );
}
