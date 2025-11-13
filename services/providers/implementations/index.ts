/**
 * Provider implementations index
 * Registers all provider implementations with the registry
 */

import { providerRegistry } from '../registry';
import { FSIBlogProvider } from './fsiblog';
import { IndianPornHQProvider } from './indianpornhq';
import { SuperpornProvider } from './superporn';
import { KamaBabaProvider } from './kamababa';
import { WebXSeriesProvider } from './webxseries';

// Singleton flag to ensure registration happens only once
let isInitialized = false;

/**
 * Initialize all providers
 * This is called automatically on first import, but can be called manually if needed
 */
export function initializeProviders() {
  if (isInitialized) {
    console.log('[Providers] Already initialized, skipping...');
    return;
  }

  console.log('[Providers] Initializing all providers...');

  // Create provider instances
  const fsiblogProvider = new FSIBlogProvider();
  const indianpornhqProvider = new IndianPornHQProvider();
  const superpornProvider = new SuperpornProvider();
  const kamababaProvider = new KamaBabaProvider();
  const webxseriesProvider = new WebXSeriesProvider();

  // Register providers
  providerRegistry.register('fsiblog5', fsiblogProvider);
  providerRegistry.register('indianpornhq', indianpornhqProvider);
  providerRegistry.register('superporn', superpornProvider);
  providerRegistry.register('kamababa', kamababaProvider);
  providerRegistry.register('webxseries', webxseriesProvider);

  isInitialized = true;

  console.log('[Providers] Registered providers:', providerRegistry.getAllIds());
  
  return {
    fsiblogProvider,
    indianpornhqProvider,
    superpornProvider,
    kamababaProvider,
    webxseriesProvider
  };
}

// Auto-initialize on import
const providers = initializeProviders();

// Export individual providers for direct use if needed
export const {
  fsiblogProvider,
  indianpornhqProvider,
  superpornProvider,
  kamababaProvider,
  webxseriesProvider
} = providers!;

// Export registry for convenience
export { providerRegistry };
