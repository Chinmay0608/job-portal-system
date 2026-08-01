const fs = require('fs');
const path = require('path');

class PluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.loadPlugins();
  }

  loadPlugins() {
    try {
      const pluginsDir = path.join(__dirname, 'plugins');
      
      // Check if directory exists
      if (!fs.existsSync(pluginsDir)) {
        console.warn(`[SDE Registry] Plugins directory not found at ${pluginsDir}`);
        return;
      }

      const files = fs.readdirSync(pluginsDir);

      for (const file of files) {
        if (file.endsWith('Plugin.js')) {
          const PluginClass = require(path.join(pluginsDir, file));
          const pluginInstance = new PluginClass();
          
          if (pluginInstance.name && pluginInstance.capabilities) {
            this.plugins.set(pluginInstance.name.toUpperCase(), pluginInstance);
            console.log(`[SDE Registry] Registered plugin: ${pluginInstance.name}`);
          } else {
            console.warn(`[SDE Registry] Invalid plugin ignored: ${file}`);
          }
        }
      }
    } catch (err) {
      console.error(`[SDE Registry] Failed to load plugins:`, err.message);
    }
  }

  getPlugin(name) {
    return this.plugins.get(name.toUpperCase());
  }

  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
}

// Export singleton instance
module.exports = new PluginRegistry();
