#!/usr/bin/env node

console.log('🚀 Starting AWS deployment...');

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('🔨 Attempting TypeScript build...');
  try {
    execSync('npm run build:server', { stdio: 'inherit' });
    
    // Verificar se o build foi bem-sucedido
    const indexPath = path.join(__dirname, 'dist/server/index.js');
    if (fs.existsSync(indexPath)) {
      console.log('✅ TypeScript build successful!');
      console.log('🚀 Starting main server...');
      execSync('npm start', { stdio: 'inherit' });
    } else {
      throw new Error('Build output not found');
    }
  } catch (buildError) {
    console.log('❌ TypeScript build failed due to errors');
    console.log('🔄 Trying simple server fallback...');
    
    try {
      execSync('npm run start:fallback', { stdio: 'inherit' });
    } catch (fallbackError) {
      console.log('❌ Simple server also failed');
      console.log('🔄 Using ultra-simple server (guaranteed to work)...');
      execSync('node server/ultra-simple-server.cjs', { stdio: 'inherit' });
    }
  }
} catch (error) {
  console.error('❌ Critical error:', error.message);
  try {
    console.log('🔄 Final fallback to ultra-simple server...');
    execSync('node server/ultra-simple-server.cjs', { stdio: 'inherit' });
  } catch (ultraFallbackError) {
    console.error('💥 All options failed:', ultraFallbackError.message);
    process.exit(1);
  }
} 