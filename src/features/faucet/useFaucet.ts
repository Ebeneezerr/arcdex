import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { isValidAddress } from '../../lib/contractUtils';

export function useFaucet(faucetAddress: string, faucetAbi: any) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [txStatus, setTxStatus] = useState<string | null>(null);

  async function request(token: string) {
    console.log('useFaucet.request called', { faucetAddress, token });
    if (!walletClient || !address) {
      setTxStatus('Wallet not connected');
      return;
    }
      if (!isValidAddress(faucetAddress)) {
        setTxStatus('Faucet contract address is missing or invalid');
        return;
      }
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const faucet = new ethers.Contract(faucetAddress, faucetAbi, signer);
      const tx = await faucet.requestFaucet(token);
      setTxStatus('Transaction sent: ' + tx.hash);
      await tx.wait();
      setTxStatus('Request successful');
    } catch (err: any) {
      console.error('useFaucet.request error', err);
      setTxStatus('Error: ' + (err.message || String(err)));
    }
  }

  async function requestBoth() {
    console.log('useFaucet.requestBoth called', { faucetAddress });
    if (!walletClient || !address) {
      setTxStatus('Wallet not connected');
      return;
    }
      if (!isValidAddress(faucetAddress)) {
        setTxStatus('Faucet contract address is missing or invalid');
        return;
      }
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const faucet = new ethers.Contract(faucetAddress, faucetAbi, signer);
      const tx = await faucet.requestBothTokens();
      setTxStatus('Transaction sent: ' + tx.hash);
      await tx.wait();
      setTxStatus('Request successful');
    } catch (err: any) {
      console.error('useFaucet.requestBoth error', err);
      setTxStatus('Error: ' + (err.message || String(err)));
    }
  }

  return { request, requestBoth, txStatus };
}
