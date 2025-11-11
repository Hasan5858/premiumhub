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

// Register providers
const fsiblogProvider = new FSIBlogProvider();
const indianpornhqProvider = new IndianPornHQProvider();
const superpornProvider = new SuperpornProvider();
const kamababaProvider = new KamaBabaProvider();
const webxseriesProvider = new WebXSeriesProvider();

providerRegistry.register('fsiblog5', fsiblogProvider);
providerRegistry.register('indianpornhq', indianpornhqProvider);
providerRegistry.register('superporn', superpornProvider);
providerRegistry.register('kamababa', kamababaProvider);
providerRegistry.register('webxseries', webxseriesProvider);

console.log('[Providers] Registered providers:', providerRegistry.getAllIds());

// Export individual providers for direct use if needed
export { fsiblogProvider, indianpornhqProvider, superpornProvider, kamababaProvider, webxseriesProvider };

// Export registry for convenience
export { providerRegistry };
