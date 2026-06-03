import { useState } from 'react';
import { useBridge } from './useBridge';
import bridgeArtifact from '../../contracts/abis/bridge/CCIPBridge.sol/CCIPBridge.json';

type BridgeProps = {
  bridgeAddress: string;
  defaultToken?: string;
};

export default function Bridge({ bridgeAddress, defaultToken = '' }: BridgeProps) {
  const [token, setToken] = useState(defaultToken);
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const { bridge, txStatus } = useBridge(bridgeAddress, bridgeArtifact.abi);

  const canBridge = Boolean(token && amount && destination);

  return (
    <div className="p-6 bg-white rounded shadow w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">Bridge</h2>
      <div className="mb-2">
        <input
          className="border p-2 w-full"
          placeholder="Token Address"
          value={token}
          onChange={e => setToken(e.target.value)}
        />
      </div>
      <div className="mb-2">
        <input
          className="border p-2 w-full"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>
      <div className="mb-2">
        <input
          className="border p-2 w-full"
          placeholder="Destination Network"
          value={destination}
          onChange={e => setDestination(e.target.value)}
        />
      </div>
      <button
        className="bg-purple-600 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        onClick={() => bridge(token, amount, destination)}
        disabled={!canBridge}
      >
        Bridge
      </button>
      {txStatus && <div className="mt-2 text-sm">{txStatus}</div>}
    </div>
  );
}
