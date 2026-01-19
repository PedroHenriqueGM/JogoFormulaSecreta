import { Start } from './scenes/Start.js';
// import { Level_1 } from './scenes/Level_1.js'; 
// import { UI_Map } from './scenes/UI_Map.js';

const config = {
    type: Phaser.AUTO,
    title: 'A Fórmula Secreta',
    parent: 'game-container',

    width: 320,
    height: 180,
    zoom: 3,
    
    backgroundColor: '#000000',

    pixelArt: true,
    render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true 
    },
    
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },

  
    scene: [
        Start
        // Level_1, 
        // UI_Map
    ],

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);