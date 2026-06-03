export interface ModuleMetadata {
  id: number;
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  weight: number;
  enabled?: boolean;
  eventSources?: string[];
}

export const MODULE_METADATA_LIST: ModuleMetadata[] = [
  {
    id: 0,
    key: "faucet",
    label: "Faucet",
    description: "Token distribution and claim rewards",
    icon: "🚰",
    color: "from-amber-500 to-amber-600",
    weight: 1.0,
    eventSources: ["faucet"],
  },
  {
    id: 1,
    key: "staking",
    label: "Staking",
    description: "Stake tokens to earn rewards and strengthen network stability",
    icon: "🏦",
    color: "from-red-500 to-red-600",
    weight: 1.2,
    eventSources: ["pointsTracker"],
  },
  {
    id: 2,
    key: "yieldFarming",
    label: "Yield Farm",
    description: "Earn incentives by providing liquidity to farming pools",
    icon: "🌾",
    color: "from-green-500 to-green-600",
    weight: 1.5,
    eventSources: ["pointsTracker"],
  },
  {
    id: 3,
    key: "lending",
    label: "Lending",
    description: "Borrow and lend assets with on-chain interest modeling",
    icon: "💰",
    color: "from-blue-500 to-blue-600",
    weight: 2.0,
    eventSources: ["pointsTracker"],
  },
  {
    id: 4,
    key: "bridge",
    label: "Bridge",
    description: "Cross-chain transfers powered by secure bridge infrastructure",
    icon: "🌉",
    color: "from-purple-500 to-purple-600",
    weight: 1.0,
    eventSources: ["pointsTracker"],
  },
  {
    id: 5,
    key: "governance",
    label: "Governance",
    description: "Cast votes and participate in protocol governance",
    icon: "🏛️",
    color: "from-pink-500 to-pink-600",
    weight: 1.3,
    eventSources: ["pointsTracker"],
  },
  {
    id: 6,
    key: "demoTrading",
    label: "Demo Trading",
    description: "Practice trading strategies in a simulated market environment",
    icon: "📈",
    color: "from-cyan-500 to-cyan-600",
    weight: 1.8,
    eventSources: ["demoTrading", "pointsTracker"],
  },
  {
    id: 7,
    key: "copyTrading",
    label: "Copy Trading",
    description: "Mirror successful traders and share performance insights",
    icon: "👥",
    color: "from-orange-500 to-orange-600",
    weight: 2.2,
    eventSources: ["pointsTracker"],
  },
  {
    id: 8,
    key: "nftMarketplace",
    label: "NFT Marketplace",
    description: "Trade unique AstroDEX NFTs and participate in collectible commerce",
    icon: "🎨",
    color: "from-indigo-500 to-indigo-600",
    weight: 1.5,
    eventSources: ["pointsTracker"],
  },
];

export const MODULE_METADATA_BY_ID: Record<number, ModuleMetadata> = MODULE_METADATA_LIST.reduce(
  (acc, metadata) => {
    acc[metadata.id] = metadata;
    return acc;
  }, {} as Record<number, ModuleMetadata>
);

export const MODULE_METADATA_BY_KEY: Record<string, ModuleMetadata> = MODULE_METADATA_LIST.reduce(
  (acc, metadata) => {
    acc[metadata.key] = metadata;
    return acc;
  }, {} as Record<string, ModuleMetadata>
);

export function normalizeEnabledModules(
  modules: string[] | Record<string, boolean> | undefined
): string[] {
  if (!modules) {
    return MODULE_METADATA_LIST.map((module) => module.key);
  }

  if (Array.isArray(modules)) {
    return modules;
  }

  return Object.entries(modules)
    .filter(([, enabled]) => enabled)
    .map(([moduleKey]) => moduleKey);
}

export function getActiveModuleMetadata(
  modules: string[] | Record<string, boolean> | undefined
): ModuleMetadata[] {
  const enabledKeys = new Set(normalizeEnabledModules(modules));
  return MODULE_METADATA_LIST.filter((metadata) => enabledKeys.has(metadata.key));
}

export function getModuleMetadataById(moduleId: number): ModuleMetadata | undefined {
  return MODULE_METADATA_BY_ID[moduleId];
}

export function getModuleMetadataByKey(moduleKey: string): ModuleMetadata | undefined {
  return MODULE_METADATA_BY_KEY[moduleKey];
}

export function getModuleGradientById(moduleId: number): string {
  return getModuleMetadataById(moduleId)?.color || "from-gray-500 to-gray-600";
}

export function getModuleIconById(moduleId: number): string {
  return getModuleMetadataById(moduleId)?.icon || "⚙️";
}

export function getModuleLabelById(moduleId: number): string {
  return getModuleMetadataById(moduleId)?.label || `Module ${moduleId}`;
}

export function getModuleLabelByKey(moduleKey: string): string {
  return getModuleMetadataByKey(moduleKey)?.label || moduleKey;
}

export function getModuleIconByKey(moduleKey: string): string {
  return getModuleMetadataByKey(moduleKey)?.icon || "⚙️";
}
