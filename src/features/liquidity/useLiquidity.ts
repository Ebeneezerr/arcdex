import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Contract, parseUnits, MaxUint256, ethers } from 'ethers';
import { ERC20_ABI } from '../erc20';

export function useLiquidity(routerAddress: string, routerAbi: any) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [txStatus, setTxStatus] = useState<string | null>(null);

  async function ensureAllowance(token: string, amount: bigint) {
    const erc20 = new Contract(token, ERC20_ABI, walletClient as any);
    const allowance: bigint = BigInt((await erc20.allowance(address, routerAddress)).toString());
    if (allowance < amount) {
      const approveTx = await erc20.approve(routerAddress, MaxUint256);
      setTxStatus('Approving token spend...');
      await approveTx.wait();
      setTxStatus('Approval successful');
    }
  }

  async function addLiquidity(tokenA: string, tokenB: string, amountA: string, amountB: string) {
    if (!walletClient || !address) {
      setTxStatus('Wallet not connected');
      return;
    }

    if (!routerAddress || !ethers.isAddress(routerAddress) || /^0x0+$/i.test(routerAddress)) {
      setTxStatus('Router contract address is missing or invalid');
      return;
    }

    try {
      const router = new Contract(routerAddress, routerAbi, walletClient as any);
      const parsedA = parseUnits(amountA, 18);
      const parsedB = parseUnits(amountB, 18);

      await ensureAllowance(tokenA, parsedA);
      await ensureAllowance(tokenB, parsedB);

      const tx = await router.addLiquidity(
        tokenA,
        tokenB,
        parsedA,
        parsedB,
        0,
        0,
        address,
        Math.floor(Date.now() / 1000) + 60 * 10
      );
      setTxStatus('Transaction sent: ' + tx.hash);
      await tx.wait();
      setTxStatus('Liquidity added');
    } catch (err: any) {
      setTxStatus('Error: ' + (err?.data?.message || err.message || String(err)));
    }
  }

  return { addLiquidity, txStatus };
}
