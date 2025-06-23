#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionFile = path.join(__dirname, '../client/src/config/version.ts');

try {
  // Read the current version file
  let content = fs.readFileSync(versionFile, 'utf8');
  
  // Extract current deployment count
  const deploymentMatch = content.match(/export const DEPLOYMENT_COUNT = (\d+);/);
  
  if (!deploymentMatch) {
    console.error('Could not find DEPLOYMENT_COUNT in version file');
    process.exit(1);
  }
  
  const currentCount = parseInt(deploymentMatch[1]);
  const newCount = currentCount + 1;
  
  // Update the deployment count
  content = content.replace(
    /export const DEPLOYMENT_COUNT = \d+;/,
    `export const DEPLOYMENT_COUNT = ${newCount};`
  );
  
  // Write back to file
  fs.writeFileSync(versionFile, content);
  
  console.log(`Version updated from ${currentCount} to ${newCount}`);
  
  // Calculate and display the version number
  let versionDisplay;
  if (newCount <= 10) {
    versionDisplay = `v2.0.${newCount}`;
  } else {
    const minorPatch = newCount - 10;
    versionDisplay = `v2.1.${minorPatch}`;
  }
  
  console.log(`New version: ${versionDisplay}`);
  
} catch (error) {
  console.error('Error updating version:', error.message);
  process.exit(1);
}