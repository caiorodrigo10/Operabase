// Set Vercel environment variable
process.env.VERCEL = 'true';

// Import the Express app
require('../dist/index.js');

// Export the app that was made globally available
module.exports = global.vercelApp; 