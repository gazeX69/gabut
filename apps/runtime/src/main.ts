import Phaser from 'phaser'

/**
 * Minimal Phaser Bootstrap
 * Pure initialization with no gameplay systems
 */

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game',
  backgroundColor: '#1a1a1a',
  render: {
    pixelArt: false,
    antialias: true
  }
}

const game = new Phaser.Game(config)

// Log initialization
console.log('Phaser Game Instance Created', { width: config.width, height: config.height })