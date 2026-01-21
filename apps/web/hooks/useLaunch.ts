'use client';

import { create } from 'zustand';
import { DEFAULT_TAX_CONFIG, DEFAULT_TOKEN_SUPPLY, DEFAULT_TOKEN_DECIMALS } from '@/lib/constants';
import { tokenApi, LaunchRequest, TaxConfig } from '@/lib/api';
import { validateTaxConfig } from '@/lib/utils';

export interface TokenInfoState {
  name: string;
  symbol: string;
  description: string;
  image: string;
  supply: number;
  decimals: number;
}

export interface CustomWallet {
  address: string;
  percent: number;
  label: string;
}

export interface TaxConfigState extends TaxConfig {}

export interface LaunchState {
  // Current step
  step: number;
  setStep: (step: number) => void;

  // Token info
  tokenInfo: TokenInfoState;
  updateTokenInfo: (updates: Partial<TokenInfoState>) => void;

  // Tax config
  taxConfig: TaxConfigState;
  updateTaxConfig: (updates: Partial<TaxConfigState>) => void;
  addCustomWallet: (wallet: CustomWallet) => void;
  removeCustomWallet: (index: number) => void;
  updateCustomWallet: (index: number, updates: Partial<CustomWallet>) => void;

  // Validation
  isTokenInfoValid: () => boolean;
  isTaxConfigValid: () => { valid: boolean; error?: string };

  // Launch state
  isLaunching: boolean;
  launchError: string | null;
  launchResult: { mint: string; txSignature?: string; launchUrl?: string; tokenId?: string } | null;

  // Actions
  launch: (signature: string, creatorWallet: string) => Promise<void>;
  reset: () => void;
}

const initialTokenInfo: TokenInfoState = {
  name: '',
  symbol: '',
  description: '',
  image: '',
  supply: DEFAULT_TOKEN_SUPPLY,
  decimals: DEFAULT_TOKEN_DECIMALS,
};

const initialTaxConfig: TaxConfigState = { ...DEFAULT_TAX_CONFIG };

export const useLaunch = create<LaunchState>((set, get) => ({
  // Step state
  step: 0,
  setStep: (step) => set({ step }),

  // Token info
  tokenInfo: { ...initialTokenInfo },
  updateTokenInfo: (updates) =>
    set((state) => ({
      tokenInfo: { ...state.tokenInfo, ...updates },
    })),

  // Tax config
  taxConfig: { ...initialTaxConfig },
  updateTaxConfig: (updates) =>
    set((state) => ({
      taxConfig: { ...state.taxConfig, ...updates },
    })),

  addCustomWallet: (wallet) =>
    set((state) => ({
      taxConfig: {
        ...state.taxConfig,
        customWallets: [...state.taxConfig.customWallets, wallet],
      },
    })),

  removeCustomWallet: (index) =>
    set((state) => ({
      taxConfig: {
        ...state.taxConfig,
        customWallets: state.taxConfig.customWallets.filter((_, i) => i !== index),
      },
    })),

  updateCustomWallet: (index, updates) =>
    set((state) => ({
      taxConfig: {
        ...state.taxConfig,
        customWallets: state.taxConfig.customWallets.map((w, i) =>
          i === index ? { ...w, ...updates } : w
        ),
      },
    })),

  // Validation
  isTokenInfoValid: () => {
    const { name, symbol, description, supply, decimals } = get().tokenInfo;
    return (
      name.length >= 2 &&
      name.length <= 32 &&
      symbol.length >= 2 &&
      symbol.length <= 10 &&
      description.length >= 10 &&
      description.length <= 500 &&
      supply > 0 &&
      supply <= 1e15 &&
      decimals >= 0 &&
      decimals <= 18
    );
  },

  isTaxConfigValid: () => {
    const { taxConfig } = get();
    return validateTaxConfig(taxConfig);
  },

  // Launch state
  isLaunching: false,
  launchError: null,
  launchResult: null,

  // Actions
  launch: async (signature, creatorWallet) => {
    const { tokenInfo, taxConfig, isTokenInfoValid, isTaxConfigValid } = get();

    if (!isTokenInfoValid()) {
      set({ launchError: 'Invalid token information' });
      return;
    }

    const taxValidation = isTaxConfigValid();
    if (!taxValidation.valid) {
      set({ launchError: taxValidation.error || 'Invalid tax configuration' });
      return;
    }

    set({ isLaunching: true, launchError: null });

    try {
      const request: LaunchRequest = {
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        description: tokenInfo.description,
        image: tokenInfo.image || undefined,
        supply: tokenInfo.supply,
        decimals: tokenInfo.decimals,
        taxConfig: taxConfig,
        creatorWallet,
      };

      const result = await tokenApi.launch(request, signature);

      if (result.success && result.mint) {
        set({
          launchResult: {
            mint: result.mint,
            txSignature: result.txSignature,
            launchUrl: result.launchUrl,
            tokenId: result.tokenId,
          },
          step: 3, // Move to success step
        });
      } else {
        set({ launchError: result.error || 'Launch failed' });
      }
    } catch (error) {
      set({
        launchError: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      set({ isLaunching: false });
    }
  },

  reset: () =>
    set({
      step: 0,
      tokenInfo: { ...initialTokenInfo },
      taxConfig: { ...initialTaxConfig },
      isLaunching: false,
      launchError: null,
      launchResult: null,
    }),
}));

export default useLaunch;
