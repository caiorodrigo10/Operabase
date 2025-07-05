#!/usr/bin/env node

console.log('🚀 Starting AWS deployment...');

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('🔨 Building TypeScript server...');
  execSync('npm run build:server', { stdio: 'inherit' });

  // Verificar se o build foi bem-sucedido
  const indexPath = path.join(__dirname, 'dist/server/index.js');
  if (fs.existsSync(indexPath)) {
    console.log('✅ TypeScript build successful!');
    console.log('🚀 Starting main server...');
    execSync('npm start', { stdio: 'inherit' });
  } else {
    console.log('❌ TypeScript build failed, using fallback...');
    console.log('🔄 Starting simple server...');
    execSync('npm run start:fallback', { stdio: 'inherit' });
  }
} catch (error) {
  console.error('❌ Build failed, using fallback server:', error.message);
  try {
    console.log('🔄 Starting simple server...');
    execSync('npm run start:fallback', { stdio: 'inherit' });
  } catch (fallbackError) {
    console.error('💥 Fallback also failed:', fallbackError.message);
    process.exit(1);
  }
} 