import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Contract, parseUnits, MaxUint256 } from 'ethers';
import { ERC20_ABI } from '../erc20';

export function useSwap(routerAddress: string, routerAbi: any) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [txStatus, setTxStatus] = useState<string | null>(null);


  async function ensureAllowance(token: string, amount: bigint) {
    if (!walletClient) return;
    const erc20 = new Contract(token, ERC20_ABI, walletClient as any);
    const allowance: bigint = BigInt((await erc20.allowance(address, routerAddress)).toString());
    if (allowance < amount) {
      const approveTx = await erc20.approve(routerAddress, MaxUint256);
      setTxStatus('Approving token spend...');
      await approveTx.wait();
      setTxStatus('Approval successful');
    }
  }

  async function swap(fromToken: string, toToken: string, amount: string, slippagePct = 0.5) {
    if (!walletClient || !address) {
      setTxStatus('Wallet not connected');
      return;
    }
    if (!fromToken || !toToken || !amount) {
      setTxStatus('Please provide source/destination token and amount');
      return;
    }

    try {
      const router = new Contract(routerAddress, routerAbi, walletClient as any);
      const parsedAmount = parseUnits(amount, 18);

      await ensureAllowance(fromToken, parsedAmount);

      // Estimate output
      const amountsOut = await router.getAmountsOut(parsedAmount, [fromToken, toToken]);
      const expectedOut = amountsOut[amountsOut.length - 1];
      const slippageFactor = 1 - (slippagePct / 100);
      const amountOutMin = expectedOut.mul(Math.floor(slippageFactor * 10000)).div(10000);

      setTxStatus('Swapping tokens...');
      const tx = await router.swapExactTokensForTokens(
        parsedAmount,
        amountOutMin,
        [fromToken, toToken],
        address,
        Math.floor(Date.now() / 1000) + 60 * 10
      );
      setTxStatus('Transaction sent: ' + tx.hash);
      await tx.wait();
      setTxStatus('Swap successful');
    } catch (err: any) {
      const errorMessage = err?.data?.message || err.message || String(err);
      if (errorMessage.includes('user rejected')) {
        setTxStatus('Transaction rejected by user');
      } else if (errorMessage.includes('insufficient funds')) {
        setTxStatus('Insufficient funds for gas');
      } else {
        setTxStatus('Error: ' + errorMessage);
      }
    }
  }

  return { swap, txStatus };
}
