import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Contract, parseUnits } from 'ethers';
import { isValidAddress } from '../../lib/contractUtils';

export function useBridge(bridgeAddress: string, bridgeAbi: any) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [txStatus, setTxStatus] = useState<string | null>(null);

  async function bridge(token: string, amount: string, destination: string) {
    if (!walletClient || !address) {
      setTxStatus('Wallet not connected');
      return;
    }
    if (!isValidAddress(bridgeAddress)) {
      setTxStatus('Bridge contract address is missing or invalid');
      return;
    }
    try {
      const bridge = new Contract(bridgeAddress, bridgeAbi, walletClient as any);
      const tx = await bridge.bridgeToken(
        token,
        parseUnits(amount, 18),
        destination
      );
      setTxStatus('Transaction sent: ' + tx.hash);
      await tx.wait();
      setTxStatus('Bridge successful');
    } catch (err: any) {
      setTxStatus('Error: ' + err.message);
    }
  }

  return { bridge, txStatus };
}
