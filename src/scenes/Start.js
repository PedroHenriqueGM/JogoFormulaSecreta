import { DialogueManager } from '../managers/DialogueManager.js';
import { EffectManager } from '../managers/EffectManager.js';

export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        // Imagens
        this.load.image('scene1_frame1', 'assets/scene1_1.png');
        this.load.image('scene1_frame2', 'assets/scene1_2.png');
        this.load.image('scene1bright', 'assets/scene1bright.png');
        
        // Efeitos
        this.load.spritesheet('flare', 'assets/flare.png', { frameWidth: 16, frameHeight: 16 });
      
        // Spritesheets
        this.load.spritesheet('curtains', 'assets/curtains.png', { frameWidth: 320, frameHeight: 180 });
        this.load.spritesheet('start_texts', 'assets/start_texts.png', { frameWidth: 320, frameHeight: 180 });
        
        // Fixos
        this.load.image('livroZoom', 'assets/livroZoom.png');

        // Áudio
        this.load.audio('musica1', 'assets/musica1.mp3');

        //Texto
        this.load.bitmapFont('pixelFont', 'assets/fonts/pixelFont/pixelFont.png', 'assets/fonts/pixelFont/pixelFont.xml');
        this.load.bitmapFont('alkhemikal', 'assets/fonts/alkhemikal/alkhemikal.png', 'assets/fonts/alkhemikal/alkhemikal.xml');
    }

    create() {
        const { width, height } = this.scale;

        this.dialogue = new DialogueManager(this);

        // Música
        this.music = this.sound.add('musica1', { loop: true, volume: 0 });
        this.music.play();
        this.tweens.add({ targets: this.music, volume: 0.5, duration: 2000 });

        this.createAnimations();

        // Fundo
        this.bgNormal = this.add.sprite(width / 2, height / 2, 'scene1_frame1');
        this.bgNormal.play('anim_candle'); 
        this.bgBright = this.add.image(width / 2, height / 2, 'scene1bright');
        this.curtains = this.add.sprite(width / 2, height / 2, 'curtains');

        this.createMenu();
    }

    createAnimations() {
        if (!this.anims.exists('anim_candle')) {
            this.anims.create({ key: 'anim_candle', frames: [{ key: 'scene1_frame1' }, { key: 'scene1_frame2' }], frameRate: 3, repeat: -1 });
        }
        if (!this.anims.exists('anim_curtains_open')) {
            this.anims.create({ key: 'anim_curtains_open', frames: this.anims.generateFrameNumbers('curtains', { start: 0, end: 3 }), frameRate: 4, repeat: 0 });
        }
        if (!this.anims.exists('anim_flare')) {
            this.anims.create({ key: 'anim_flare', frames: this.anims.generateFrameNumbers('flare', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
        }
    }

    createMenu() {
        const { width, height } = this.scale;
        this.uiGroup = this.add.group();

        const title = this.add.sprite(width / 2, height / 2, 'start_texts', 0);
        const btnStart = this.add.sprite(width / 2, height / 2, 'start_texts', 1).setInteractive({ cursor: 'pointer' });
        const btnContinue = this.add.sprite(width / 2, height / 2, 'start_texts', 2).setAlpha(0.5);
        const btnOptions = this.add.sprite(width / 2, height / 2, 'start_texts', 3).setAlpha(0.5);

        this.uiGroup.addMultiple([title, btnStart, btnContinue, btnOptions]);

        btnStart.on('pointerover', () => btnStart.setTint(0xdddddd));
        btnStart.on('pointerout', () => btnStart.clearTint());
        btnStart.once('pointerdown', () => this.startStory());
    }

    startStory() {
        this.uiGroup.setVisible(false);
        this.curtains.play('anim_curtains_open');

        this.tweens.add({ targets: this.bgBright, alpha: 0, duration: 2000, ease: 'Sine.easeInOut' });

        this.curtains.on('animationcomplete', () => {
            this.curtains.setVisible(false);
            this.dialogue.waitForClick(() => {
                this.showBook();
            }, 4000); 
        });
    }

    showBook() {
        const { width, height } = this.scale;
        
        this.bgNormal.stop(); 
        this.closedBookView = this.add.image(width + 100, height, 'scene1_frame1').setOrigin(1, 1).setScale(2).setAlpha(0);

        this.tweens.add({ targets: this.bgNormal, alpha: 0, duration: 2000 });
        this.tweens.add({ targets: this.closedBookView, alpha: 1, duration: 2000 });
        
        this.dialogue.waitForClick(() => {
            const text = `"Ars Magna" — o tratado que\nsistematiza equações cúbicas.\n\nCompilado por matemáticos\ncomo Tartaglia e Scipione.`;
            this.dialogue.showNarration(text, () => {
                this.showBookZoom();
            });
        }, 2000);
    }

    showBookZoom() {
        const { width, height } = this.scale;

        if (this.closedBookView) this.closedBookView.destroy();
        if (this.bgNormal) this.bgNormal.destroy();
        if (this.bgBright) this.bgBright.destroy();

        this.imgZoom = this.add.image(width / 2, height / 2, 'livroZoom');
        const scale = Math.max(width / this.imgZoom.width, height / this.imgZoom.height);
        this.imgZoom.setScale(scale);
        this.imgZoom.setAlpha(0);

        this.tweens.add({ targets: this.imgZoom, alpha: 1, duration: 1000 });

        this.dialogue.waitForClick(() => {
             this.startFireSequence();
        }, 3000);
    }

   startFireSequence() {
        // Carrega o Level 1 e trava controles
        if (!this.scene.isActive('Level_1')) {
            this.scene.launch('Level_1');
            this.scene.bringToTop('Start');

            const level1 = this.scene.get('Level_1');
            level1.events.once('create', () => {
                if (level1.input && level1.input.keyboard) level1.input.keyboard.enabled = false;
                if (level1.input && level1.input.mouse) level1.input.mouse.enabled = false;
            });
        }

        // Limpeza de UI antiga
        if (this.bgNormal) this.bgNormal.destroy();
        if (this.bgBright) this.bgBright.destroy();
        if (this.curtains) this.curtains.destroy();
        if (this.uiGroup) this.uiGroup.setVisible(false);
        if (this.imgZoom) this.imgZoom.destroy(); 

        // Inicia o Efeito de Fogo
        this.EffectManager = new EffectManager(this);
        this.EffectManager.start(() => {
            this.startGame();
        });
    }

    startGame() {
        const level1 = this.scene.get('Level_1');
        
        if (level1) {
            if (level1.input && level1.input.keyboard) level1.input.keyboard.enabled = true;
            if (level1.input && level1.input.mouse) level1.input.mouse.enabled = true;
            
            if (level1.iniciarCutscene) {
                level1.iniciarCutscene();
            }
        }
        this.scene.stop('Start'); 
    }
}