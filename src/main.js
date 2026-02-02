import { Start } from './scenes/Start.js'; // Certifique-se do nome correto do arquivo
import { Level_1 } from './scenes/Level_1.js'; // Certifique-se do nome correto do arquivo

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
        Start,
        Level_1
    ],
    scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    audio: {
        disableWebAudio: false, 
        noAudio: false, 
        context: new AudioContext()
    }
};

new Phaser.Game(config);