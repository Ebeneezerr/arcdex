import { ethers } from 'ethers';

export const ZERO_ADDRESS_REGEX = /^0x0+$/i;

export function isValidAddress(value?: string): value is string {
  return typeof value === 'string' && ethers.isAddress(value) && !ZERO_ADDRESS_REGEX.test(value);
}

export function resolveTokenAddress(
  symbol: string,
  fallbackIndex: number,
  config: { tokens?: Array<{ symbol: string; address: string }> },
  deploymentTokens: Array<{ symbol: string; address: string }> = []
): string {
  const configAddress = config.tokens?.find((token) => token.symbol === symbol)?.address;
  if (isValidAddress(configAddress)) return configAddress;

  const deployedAddress = deploymentTokens.find((token) => token.symbol === symbol)?.address;
  if (isValidAddress(deployedAddress)) return deployedAddress;

  const fallbackAddress = config.tokens?.[fallbackIndex]?.address;
  return isValidAddress(fallbackAddress) ? fallbackAddress : '';
}

export function resolveContractAddress(
  explicitAddress: string | undefined,
  configContracts: Record<string, string> = {},
  deploymentContracts: Record<string, string> = {},
  fallbackKeys: string[] = []
): string {
  if (isValidAddress(explicitAddress)) return explicitAddress;

  for (const key of fallbackKeys) {
    const configAddress = configContracts?.[key];
    if (isValidAddress(configAddress)) return configAddress;
  }

  for (const key of fallbackKeys) {
    const deployedAddress = deploymentContracts?.[key];
    if (isValidAddress(deployedAddress)) return deployedAddress;
  }

  return '';
}
