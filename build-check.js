#!/usr/bin/env node
/**
 * TDV Mafia - Automated Build & Integrity Verification
 * Checks repository files, structure, TypeScript compilation, and design standards.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ ERROR: ${message}`);
    failed++;
  }
}

console.log('⚡ Starting TDV Mafia build verification...\n');

// 1. Core Config & Files
assert(fs.existsSync(path.join(__dirname, 'package.json')), 'package.json exists');
assert(fs.existsSync(path.join(__dirname, 'tsconfig.json')), 'tsconfig.json exists');
assert(fs.existsSync(path.join(__dirname, 'vercel.json')), 'vercel.json exists');

// 2. Key Next.js Entrypoints
assert(fs.existsSync(path.join(__dirname, 'src/app/layout.tsx')), 'src/app/layout.tsx exists');
assert(fs.existsSync(path.join(__dirname, 'src/app/page.tsx')), 'src/app/page.tsx exists');
assert(fs.existsSync(path.join(__dirname, 'src/app/lobby/[lobbyId]/page.tsx')), 'src/app/lobby/[lobbyId]/page.tsx exists');

// 3. Components & Architecture
assert(fs.existsSync(path.join(__dirname, 'src/components/layout/Navbar.tsx')), 'src/components/layout/Navbar.tsx exists');
assert(fs.existsSync(path.join(__dirname, 'src/server/engine/night-action-resolver.ts')), 'src/server/engine/night-action-resolver.ts exists');
assert(fs.existsSync(path.join(__dirname, 'src/server/engine/phase-manager.ts')), 'src/server/engine/phase-manager.ts exists');
assert(fs.existsSync(path.join(__dirname, 'src/server/engine/voting-engine.ts')), 'src/server/engine/voting-engine.ts exists');
assert(fs.existsSync(path.join(__dirname, 'src/server/engine/minigames-engine.ts')), 'src/server/engine/minigames-engine.ts exists');
assert(fs.existsSync(path.join(__dirname, 'src/types/game.ts')), 'src/types/game.ts exists');

// 4. Ecosystem canonical URLs
const navbarContent = fs.readFileSync(path.join(__dirname, 'src/components/layout/Navbar.tsx'), 'utf8');
assert(navbarContent.includes('https://tdv-community-hubs.vercel.app/'), 'Navbar links to canonical TDV Community Hub');
assert(navbarContent.includes('https://tdv-e-school.vercel.app/'), 'Navbar links to TDV E-School');
assert(navbarContent.includes('https://school-minifootball-tournament.vercel.app/'), 'Navbar links to Football Tournament');

// 5. TypeScript strict typecheck
try {
  execSync('npx --no-install tsc --noEmit', { stdio: 'pipe', cwd: __dirname });
  assert(true, 'TypeScript typecheck (tsc --noEmit) passes with 0 errors');
} catch (e) {
  assert(false, `TypeScript typecheck failed: ${e.message}`);
}

console.log(`\n✨ Verification Complete: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
}
