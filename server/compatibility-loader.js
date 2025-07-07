// Compatibility Loader for TypeScript modules in production
// This file helps Node.js load TypeScript modules that haven't been compiled

const path = require('path');
const fs = require('fs');

// Mock TypeScript modules that may not be available in production
const createMockModule = (moduleName) => {
  console.log(`⚠️ Creating mock for ${moduleName} - module not available in production`);
  
  // Return different mocks based on module type
  if (moduleName.includes('middleware')) {
    return { 
      [moduleName.split('.')[0]]: (req, res, next) => next() 
    };
  }
  
  if (moduleName.includes('router')) {
    const { createFallbackRouter } = require('./fallback-router.js');
    return { 
      createApiRouter: (storage) => {
        console.log('🔧 Using fallback router with essential endpoints');
        return createFallbackRouter();
      }
    };
  }
  
  if (moduleName.includes('storage')) {
    return {
      createStorage: () => ({
        // Mock storage interface
        getAppointments: () => Promise.resolve([]),
        getContacts: () => Promise.resolve([]),
        // Add other mock methods as needed
      })
    };
  }
  
  // Default mock
  return {};
};

// Enhanced module loader with fallbacks
async function loadModuleWithFallback(modulePath) {
  try {
    // Try to load the module directly
    return await import(modulePath);
  } catch (error) {
    console.log(`⚠️ Failed to load ${modulePath}:`, error.message);
    
    // Try with .js extension
    if (!modulePath.endsWith('.js')) {
      try {
        return await import(modulePath + '.js');
      } catch (jsError) {
        console.log(`⚠️ Failed to load ${modulePath}.js:`, jsError.message);
      }
    }
    
    // Try with .ts extension replaced with .js
    if (modulePath.endsWith('.ts')) {
      try {
        const jsPath = modulePath.replace('.ts', '.js');
        return await import(jsPath);
      } catch (tsError) {
        console.log(`⚠️ Failed to load ${jsPath}:`, tsError.message);
      }
    }
    
    // Create mock module as last resort
    const moduleName = path.basename(modulePath);
    return createMockModule(moduleName);
  }
}

module.exports = {
  loadModuleWithFallback,
  createMockModule
}; 