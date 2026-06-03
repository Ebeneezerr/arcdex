import configData from "./hydra.config.json";
import {
  getActiveModuleMetadata as getStaticActiveModuleMetadata,
  normalizeEnabledModules,
  ModuleMetadata,
  MODULE_METADATA_LIST,
} from "./moduleMetadata";

export type { ModuleMetadata };

export interface AstroDEXConfig {
  configVersion?: string;
  name: string;
  chain: string;
  chainId: number;
  network: string;
  deployedAt: string;
  deployer: string;
  modules?: string[] | Record<string, boolean>;
  enabledModules?: string[];
  tokenAName?: string;
  tokenASymbol?: string;
  tokenBName?: string;
  tokenBSymbol?: string;
  tokens: Array<{ symbol: string; name: string; address: string }>;
  pool: {
    volatileFeeBps: number;
    stableFeeBps: number;
    supportedPairs: string[];
  };
  liquidity: {
    initialAmountA: string;
    initialAmountB: string;
  };
  gasConfig: Record<string, any>;
  contracts: Record<string, string>;
  moduleMetadata?: Record<string, ModuleMetadata>;
  verification?: {
    network: string;
    timestamp: string;
    deployer: string;
    totalContracts: number;
    passedContracts: number;
    failedContracts: number;
    valid: boolean;
    results: Array<{
      name: string;
      contractName: string;
      address?: string;
      codePresent: boolean;
      passed: boolean;
      checks: Array<{ description: string; passed: boolean; actual: string; expected?: string; error?: string }>;
    }>;
  };
  generatedAt: string;
}

const CURRENT_CONFIG_VERSION = "1.0.0";

export const astrodexConfig = configData as unknown as AstroDEXConfig;

function assertAstroDEXConfigVersion(config: AstroDEXConfig) {
  if (!config.configVersion) {
    console.warn(`⚠️  config file missing configVersion. Expected ${CURRENT_CONFIG_VERSION}.`);
    return;
  }

  if (config.configVersion !== CURRENT_CONFIG_VERSION) {
    console.warn(
      `⚠️  config file version mismatch: found ${config.configVersion}, expected ${CURRENT_CONFIG_VERSION}. Please regenerate or update the config.`
    );
  }
}

export function getEnabledAstroDEXModuleKeys(): string[] {
  assertAstroDEXConfigVersion(astrodexConfig);
  return normalizeEnabledModules(astrodexConfig.modules ?? astrodexConfig.enabledModules);
}

export function getConfigModuleMetadata(): ModuleMetadata[] {
  const configMetadata = astrodexConfig.moduleMetadata ?? {};
  const merged = Object.values(configMetadata).map((metadata) => ({
    ...(MODULE_METADATA_LIST.find((item) => item.key === metadata.key) || {}),
    ...metadata,
  })) as ModuleMetadata[];

  const fallback = MODULE_METADATA_LIST.filter(
    (item) => !merged.some((metadata) => metadata.key === item.key)
  );

  return [...merged, ...fallback];
}

export function getActiveAstroDEXModuleMetadata(): ModuleMetadata[] {
  assertAstroDEXConfigVersion(astrodexConfig);
  const enabledKeys = new Set(getEnabledAstroDEXModuleKeys());
  return getConfigModuleMetadata().filter((metadata) => enabledKeys.has(metadata.key));
}

export function getAstroDEXModuleMetadataById(moduleId: number): ModuleMetadata | undefined {
  return getConfigModuleMetadata().find((metadata) => metadata.id === moduleId);
}

export function getAstroDEXModuleMetadataByKey(moduleKey: string): ModuleMetadata | undefined {
  return getConfigModuleMetadata().find((metadata) => metadata.key === moduleKey);
}

export const tokenAName = astrodexConfig.tokenAName || astrodexConfig.tokens?.[0]?.name || 'TokenA';
export const tokenASymbol = astrodexConfig.tokenASymbol || astrodexConfig.tokens?.[0]?.symbol || 'TKA';
export const tokenBName = astrodexConfig.tokenBName || astrodexConfig.tokens?.[1]?.name || 'TokenB';
export const tokenBSymbol = astrodexConfig.tokenBSymbol || astrodexConfig.tokens?.[1]?.symbol || 'TKB';

export function getAstroDEXVerificationReport() {
  return astrodexConfig.verification;
}
