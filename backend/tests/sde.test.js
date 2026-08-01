const HashOptimizer = require('../services/sde/HashOptimizer');
const PluginRegistry = require('../services/sde/PluginRegistry');

describe('SDE Core Components', () => {
  describe('HashOptimizer', () => {
    it('should generate identical hashes for identical meaningful fields', () => {
      const jobA = { title: 'Engineer', salary: '100k', crawlTime: Date.now() };
      const jobB = { title: 'Engineer', salary: '100k', crawlTime: Date.now() + 10000 };
      
      const hashA = HashOptimizer.generateHash(jobA);
      const hashB = HashOptimizer.generateHash(jobB);
      
      expect(hashA).toBe(hashB);
    });

    it('should generate different hashes when meaningful fields change', () => {
      const jobA = { title: 'Engineer', salary: '100k' };
      const jobB = { title: 'Engineer', salary: '120k' };
      
      const hashA = HashOptimizer.generateHash(jobA);
      const hashB = HashOptimizer.generateHash(jobB);
      
      expect(hashA).not.toBe(hashB);
    });

    it('should detect changes correctly', () => {
      expect(HashOptimizer.hasChanged('newHash', 'oldHash')).toBe(true);
      expect(HashOptimizer.hasChanged('sameHash', 'sameHash')).toBe(false);
      expect(HashOptimizer.hasChanged('newHash', null)).toBe(true);
    });
  });

  describe('PluginRegistry', () => {
    it('should auto-register Greenhouse and Lever plugins', () => {
      const plugins = PluginRegistry.getAllPlugins();
      expect(plugins.length).toBeGreaterThanOrEqual(2);
      
      const greenhouse = PluginRegistry.getPlugin('GREENHOUSE');
      expect(greenhouse).toBeDefined();
      expect(greenhouse.capabilities.supportsPagination).toBe(true);

      const lever = PluginRegistry.getPlugin('LEVER');
      expect(lever).toBeDefined();
      expect(lever.capabilities.supportsPagination).toBe(false);
    });
  });
});
