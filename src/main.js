import { Preloader } from './scenes/Preloader.js'; // carrega todos os assets antes do jogo começar
import { Start }    from './scenes/Start.js';
import { Level_1 }  from './scenes/Level_1.js';
import { PauseMenu } from './scenes/PauseMenu.js';

const config = {
    type: Phaser.AUTO,
    title: 'A Fórmula Secreta',
    parent: 'game-container',
    width: 320,
    height: 180,
    zoom: 4,
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
        Preloader, // roda primeiro: carrega todos os assets e inicia o Start
        Start,
        Level_1,
        PauseMenu
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