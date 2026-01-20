import { DialogueManager } from '../managers/DialogueManager.js';

export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        // Estaticos
        this.load.image('scene1_frame1', 'assets/scene1_1.png');
        this.load.image('scene1_frame2', 'assets/scene1_2.png');
        this.load.image('scene1bright', 'assets/scene1bright.png');
     
        // this.load.image('hedera', 'assets/hedera.png');

        // Spritesheets para livro e cortina
        this.load.spritesheet('curtains', 'assets/curtains.png', { frameWidth: 320, frameHeight: 180 });
        this.load.spritesheet('start_texts', 'assets/start_texts.png', { frameWidth: 320, frameHeight: 180 });
        
        // imagem fixa do zoom
        this.load.image('livroZoom', 'assets/livroZoom.png');

        // trilha sonora
        this.load.audio('musica1', 'assets/musica1.mp3');
    }

    create() {
        const { width, height } = this.scale;

        this.dialogue = new DialogueManager(this);

        // inicio da trilha sonora
        this.music = this.sound.add('musica1', { loop: true, volume: 0 });
        this.music.play();
        
        // aumenta o volume da musica com o tempo
        this.tweens.add({ targets: this.music, volume: 0.5, duration: 2000 });

        this.createAnimations();

        // Primeira cena
        this.bgNormal = this.add.sprite(width / 2, height / 2, 'scene1_frame1');
        this.bgNormal.play('anim_candle'); 
        this.bgBright = this.add.image(width / 2, height / 2, 'scene1bright');
        this.curtains = this.add.sprite(width/2, height/2, 'curtains');

        this.createMenu();
    }

    createAnimations() {
        if (!this.anims.exists('anim_candle')) {
            this.anims.create({
                key: 'anim_candle',
                frames: [{ key: 'scene1_frame1' }, { key: 'scene1_frame2' }],
                frameRate: 3, repeat: -1 
            });
        }
        if (!this.anims.exists('anim_curtains_open')) {
            this.anims.create({
                key: 'anim_curtains_open',
                frames: this.anims.generateFrameNumbers('curtains', { start: 0, end: 3 }),
                frameRate: 4, repeat: 0
            });
        }
    }

    createMenu() {
        const { width, height } = this.scale;
        this.uiGroup = this.add.group();

        const title = this.add.sprite(width/2, height/2, 'start_texts', 0);
        
        const btnStart = this.add.sprite(width/2, height/2, 'start_texts', 1)
            .setInteractive({ cursor: 'pointer' });
        
        const btnContinue = this.add.sprite(width/2, height/2, 'start_texts', 2)
            .setAlpha(0.5);
        
        const btnOptions = this.add.sprite(width/2, height/2, 'start_texts', 3)
            .setAlpha(0.5);

        this.uiGroup.addMultiple([title, btnStart, btnContinue, btnOptions]);

        // Efeito de hover
        btnStart.on('pointerover', () => btnStart.setTint(0xdddddd));
        btnStart.on('pointerout', () => btnStart.clearTint());
        btnStart.once('pointerdown', () => this.startStory());
    }

    // animaçaõ das cortinas
    startStory() {
        this.uiGroup.setVisible(false);
        this.curtains.play('anim_curtains_open');

        this.tweens.add({
            targets: this.bgBright,
            alpha: 0, duration: 2000, ease: 'Sine.easeInOut'
        });

        this.curtains.on('animationcomplete', () => {
            this.curtains.setVisible(false);
            
            // avança para proxima cena em 4 segundos
            this.dialogue.waitForClick(() => {
                this.showBook();
            }, 4000); 
        });
    }

    // Animação do livro
    showBook() {
        const { width, height } = this.scale;
        
        this.bgNormal.stop(); 

        this.closedBookView = this.add.image(width + 100, height, 'scene1_frame1') 
            .setOrigin(1, 1) 
            .setScale(2)
            .setAlpha(0);

        this.tweens.add({ targets: this.bgNormal, alpha: 0, duration: 2000 });
        this.tweens.add({ targets: this.closedBookView, alpha: 1, duration: 2000 });
        
        // Texto do livro
        this.dialogue.waitForClick(() => {
            const text = `"Ars Magna" — o tratado que\nsistematiza equações cúbicas.\n\nCompilado por matemáticos\ncomo Tartaglia e Scipione.`;
            
            this.dialogue.showNarration(text, () => {
                this.showBookZoom();
            });
        }, 2000);
    }

    // imagem fixa do zoom dos algoritmos
    showBookZoom() {
        const { width, height } = this.scale;

        // Limpa o sprite animado e o texto
        if (this.closedBookView) this.closedBookView.destroy();
        if (this.bgNormal) this.bgNormal.destroy();
        if (this.bgBright) this.bgBright.destroy();

        this.imgZoom = this.add.image(width / 2, height / 2, 'livroZoom');
        const scale = Math.max(width / this.imgZoom.width, height / this.imgZoom.height);
        this.imgZoom.setScale(scale);
        this.imgZoom.setAlpha(0);

        this.tweens.add({
            targets: this.imgZoom,
            alpha: 1,
            duration: 1000 
        });

        // pode avançar tambem por clique se o usuario quiser tambem
        this.dialogue.waitForClick(() => {
             console.log("Start Level 1");
             // this.scene.start('Level_1');
        }, 3000);
    }
}