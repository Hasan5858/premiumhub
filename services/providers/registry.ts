import { BaseProvider } from './base';
import { ProviderConfig, providerConfigs } from './config';
import { ProviderMetadata } from './types';

/**
 * Provider Registry
 * Centralized management of all content providers
 */
class ProviderRegistry {
  private providers: Map<string, BaseProvider> = new Map();
  private configs: Map<string, ProviderConfig> = new Map();

  /**
   * Register a provider
   */
  register(providerId: string, provider: BaseProvider): void {
    this.providers.set(providerId, provider);
    this.configs.set(providerId, provider.getConfig());
    console.log(`[ProviderRegistry] Registered provider: ${providerId}`);
  }

  /**
   * Get a provider instance
   */
  get(providerId: string): BaseProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get a provider instance (throws if not found)
   */
  getOrThrow(providerId: string): BaseProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider "${providerId}" not found in registry`);
    }
    return provider;
  }

  /**
   * Check if provider exists
   */
  has(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  /**
   * Get provider configuration
   */
  getConfig(providerId: string): ProviderConfig | undefined {
    return this.configs.get(providerId);
  }

  /**
   * Get provider metadata
   */
  getMetadata(providerId: string): ProviderMetadata | undefined {
    const config = this.configs.get(providerId);
    return config?.metadata;
  }

  /**
   * Get all registered provider IDs
   */
  getAllIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get all provider instances
   */
  getAll(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all provider metadata
   */
  getAllMetadata(): ProviderMetadata[] {
    return Array.from(this.configs.values()).map(config => config.metadata);
  }

  /**
   * Get all provider configurations
   */
  getAllConfigs(): ProviderConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Unregister a provider
   */
  unregister(providerId: string): boolean {
    const removed = this.providers.delete(providerId);
    this.configs.delete(providerId);
    if (removed) {
      console.log(`[ProviderRegistry] Unregistered provider: ${providerId}`);
    }
    return removed;
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
    this.configs.clear();
    console.log('[ProviderRegistry] Cleared all providers');
  }

  /**
   * Get registry statistics
   */
  getStats() {
    return {
      total: this.providers.size,
      providers: this.getAllIds(),
    };
  }
}

// Create singleton instance
export const providerRegistry = new ProviderRegistry();

// Auto-register providers when imported
// Note: Actual provider implementations will be registered when they're imported
export function initializeProviders() {
  // This function will be called after all provider implementations are loaded
  // For now, it's a placeholder - implementations will call registry.register() themselves
  console.log('[ProviderRegistry] Initialization complete');
  console.log('[ProviderRegistry] Registered providers:', providerRegistry.getAllIds());
}
