const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, 'projects', 'demo-project', 'assets');
const tilesetDir = path.join(projectDir, 'tilesets');
const spriteDir = path.join(projectDir, 'sprites');

if (!fs.existsSync(tilesetDir)) fs.mkdirSync(tilesetDir, { recursive: true });
if (!fs.existsSync(spriteDir)) fs.mkdirSync(spriteDir, { recursive: true });

async function generateTileset() {
  const img = new Jimp(96, 64);
  
  // 0: Grass (Green)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      img.setPixelColor(Jimp.rgbaToInt(34, 139, 34, 255), x, y);
    }
  }
  
  // 1: Dirt (Brown)
  for (let y = 0; y < 32; y++) {
    for (let x = 32; x < 64; x++) {
      img.setPixelColor(Jimp.rgbaToInt(139, 69, 19, 255), x, y);
    }
  }
  
  // 2: Path (Light Brown)
  for (let y = 0; y < 32; y++) {
    for (let x = 64; x < 96; x++) {
      img.setPixelColor(Jimp.rgbaToInt(222, 184, 135, 255), x, y);
    }
  }
  
  // 3: Wall (Gray)
  for (let y = 32; y < 64; y++) {
    for (let x = 0; x < 32; x++) {
      img.setPixelColor(Jimp.rgbaToInt(128, 128, 128, 255), x, y);
      // Add a simple border for the wall to make it look like a block
      if (x % 32 === 0 || y % 32 === 0 || x % 32 === 31 || y % 32 === 31) {
         img.setPixelColor(Jimp.rgbaToInt(64, 64, 64, 255), x, y);
      }
    }
  }
  
  // 4: Water (Blue)
  for (let y = 32; y < 64; y++) {
    for (let x = 32; x < 64; x++) {
      img.setPixelColor(Jimp.rgbaToInt(30, 144, 255, 255), x, y);
    }
  }
  
  // 5: Object (Yellow)
  for (let y = 32; y < 64; y++) {
    for (let x = 64; x < 96; x++) {
      img.setPixelColor(Jimp.rgbaToInt(255, 215, 0, 255), x, y);
    }
  }
  
  await img.writeAsync(path.join(tilesetDir, 'prototype-tiles.png'));
  console.log('prototype-tiles.png generated successfully.');
}

async function generatePlayer() {
  const img = new Jimp(32, 32);
  
  // Red body
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      img.setPixelColor(Jimp.rgbaToInt(200, 30, 30, 255), x, y);
    }
  }
  
  // White eyes
  for (let y = 8; y < 14; y++) {
    for (let x = 6; x < 12; x++) {
      img.setPixelColor(Jimp.rgbaToInt(255, 255, 255, 255), x, y);
    }
    for (let x = 20; x < 26; x++) {
      img.setPixelColor(Jimp.rgbaToInt(255, 255, 255, 255), x, y);
    }
  }
  
  // Black pupils
  for (let y = 10; y < 13; y++) {
    for (let x = 8; x < 11; x++) {
      img.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 255), x, y);
    }
    for (let x = 22; x < 25; x++) {
      img.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 255), x, y);
    }
  }
  
  await img.writeAsync(path.join(spriteDir, 'player.png'));
  console.log('player.png generated successfully.');
}

generateTileset().catch(console.error);
generatePlayer().catch(console.error);
