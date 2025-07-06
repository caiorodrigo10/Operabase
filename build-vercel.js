// build-vercel.js - Script específico para Vercel
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Vercel Build Script - Starting...');
console.log('📍 Node.js Version:', process.version);
console.log('📍 Platform:', process.platform, process.arch);

try {
  // Limpar cache anterior
  console.log('🧹 Cleaning previous build...');
  if (fs.existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' });
  }
  
  // Verificar se node_modules existe
  if (fs.existsSync('node_modules')) {
    console.log('📦 node_modules found, cleaning...');
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  }
  
  // Limpar package-lock.json se existir
  if (fs.existsSync('package-lock.json')) {
    console.log('🗑️ Removing package-lock.json...');
    execSync('rm package-lock.json', { stdio: 'inherit' });
  }
  
  // Instalar dependências com flags específicas para Vercel
  console.log('📦 Installing dependencies with Vercel-specific flags...');
  const installCmd = [
    'npm install',
    '--include=optional',
    '--legacy-peer-deps',
    '--unsafe-perm',
    '--no-package-lock',
    '--prefer-offline=false'
  ].join(' ');
  
  execSync(installCmd, { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NPM_CONFIG_OPTIONAL: 'true',
      NPM_CONFIG_LEGACY_PEER_DEPS: 'true',
      NPM_CONFIG_UNSAFE_PERM: 'true',
      NPM_CONFIG_INCLUDE: 'optional'
    }
  });
  
  // Verificar se Vite está disponível
  console.log('🔍 Checking Vite availability...');
  try {
    execSync('npx vite --version', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ Vite not found, installing directly...');
    execSync('npm install vite@^5.3.5 --save --legacy-peer-deps', { stdio: 'inherit' });
  }
  
  // Build com Vite
  console.log('🏗️ Building with Vite...');
  execSync('npx vite build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  
  // Verificar se o build foi bem-sucedido
  if (fs.existsSync('dist/index.html')) {
    console.log('✅ Vercel Build Script - Success!');
    console.log('📂 Build output found in dist/');
  } else {
    throw new Error('Build output not found');
  }
  
} catch (error) {
  console.error('❌ Vercel Build Script - Failed:', error.message);
  
  // Fallback: tentar com WASM
  console.log('🔄 Trying fallback with WASM Rollup...');
  try {
    execSync('npm install @rollup/wasm-node --save --legacy-peer-deps', { stdio: 'inherit' });
    execSync('npx vite build', { stdio: 'inherit' });
    console.log('✅ Fallback build successful!');
  } catch (fallbackError) {
    console.error('💥 Fallback also failed:', fallbackError.message);
    process.exit(1);
  }
} 