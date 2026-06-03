import themeConfig from '../theme.config.json';
import type { LayoutConfig } from '@hydra/dna-engine';

export function useTheme(): LayoutConfig {
  return themeConfig as LayoutConfig;
}
