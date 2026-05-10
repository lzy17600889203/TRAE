const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');
const npmPath = 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js';

console.log('=== Installing Backend Dependencies ===');
process.chdir(backendDir);
try {
  execSync(`node "${npmPath}" install`, { stdio: 'inherit' });
  console.log('Backend dependencies installed successfully!');
} catch (e) {
  console.error('Failed to install backend dependencies:', e.message);
}

console.log('\n=== Installing Frontend Dependencies ===');
process.chdir(frontendDir);
try {
  execSync(`node "${npmPath}" install`, { stdio: 'inherit' });
  console.log('Frontend dependencies installed successfully!');
} catch (e) {
  console.error('Failed to install frontend dependencies:', e.message);
}

console.log('\n=== Installation Complete ===');
