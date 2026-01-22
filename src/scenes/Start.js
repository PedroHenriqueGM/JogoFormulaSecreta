import { DialogueManager } from '../managers/DialogueManager.js';
import { EffectManager } from '../managers/EffectManager.js';

export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        // --- Imagens ---
        this.load.image('scene1_frame1', 'assets/scene1_1.png');
        this.load.image('scene1_frame2', 'assets/scene1_2.png');
        this.load.image('scene1bright', 'assets/scene1bright.png');
        this.load.image('selector', 'assets/selector.png');
        this.load.image('livroZoom', 'assets/livroZoom.png');
        
        // --- Efeitos ---
        this.load.spritesheet('flare', 'assets/flare.png', { frameWidth: 16, frameHeight: 16 });
        this.load.image('textGlow', 'assets/glow.png');
      
        // --- Spritesheets ---
        this.load.spritesheet('curtains', 'assets/curtains.png', { frameWidth: 320, frameHeight: 180 });
        this.load.spritesheet('startTexts', 'assets/startTexts.png', { frameWidth: 320, frameHeight: 180 });
        
        // --- Áudio ---
        this.load.audio('musica1', 'assets/musica1.mp3');

        // --- Fontes ---
        this.load.bitmapFont('pixelFont', 'assets/fonts/pixelFont/pixelFont.png', 'assets/fonts/pixelFont/pixelFont.xml');
        this.load.bitmapFont('alkhemikal', 'assets/fonts/alkhemikal/alkhemikal.png', 'assets/fonts/alkhemikal/alkhemikal.xml');
    }

    create() {
        const { width, height } = this.scale;

        this.dialogue = new DialogueManager(this);

        // --- Música ---
        this.music = this.sound.add('musica1', { loop: true, volume: 0 });
        this.music.play();
        this.tweens.add({ targets: this.music, volume: 0.5, duration: 2000 });

        this.createAnimations();

        // --- Fundo ---
        this.bgNormal = this.add.sprite(width / 2, height / 2, 'scene1_frame1');
        this.bgNormal.play('anim_candle'); 
        this.bgBright = this.add.image(width / 2, height / 2, 'scene1bright');
        this.curtains = this.add.sprite(width / 2, height / 2, 'curtains');

        // --- Menu ---
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

        this.selectedButtonIndex = 0;
        
        // --- MUDANÇA: Menu já nasce pronto para uso ---
        // O jogador pode mover o seletor mesmo durante o fade-in.
        this.isMenuReady = true; 

        // 1. Glow
        const glow = this.add.image(width / 2, height / 2, 'textGlow')
            .setOrigin(0.5).setDepth(0).setAlpha(0)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setTint(0xffffff); 

        // 2. Seletor
        this.selectorSprite = this.add.image(0, 0, 'selector')
            .setDepth(20).setVisible(false).setAlpha(0);

        // --- POSICIONAMENTO ---
        const centerX = width / 2;
        const centerY = height / 2;

        const title = this.add.sprite(centerX, centerY, 'startTexts', 0).setDepth(10).setAlpha(0);
        
        const btnStart = this.add.sprite(centerX, centerY, 'startTexts', 1)
            .setInteractive().setDepth(10).setAlpha(0);

        const btnContinue = this.add.sprite(centerX, centerY, 'startTexts', 2)
            .setInteractive().setDepth(10).setAlpha(0);

        const btnOptions = this.add.sprite(centerX, centerY, 'startTexts', 3)
            .setInteractive().setDepth(10).setAlpha(0);

        // Hitbox
        btnStart.input.hitArea.setTo(110, 80, 100, 20);     
        btnContinue.input.hitArea.setTo(110, 102, 100, 20); 
        btnOptions.input.hitArea.setTo(110, 130, 100, 20);  

        this.menuButtons = [btnStart, btnContinue, btnOptions];
        this.uiGroup.addMultiple([glow, this.selectorSprite, title, btnStart, btnContinue, btnOptions]);

        // Configura inputs imediatamente
        this.setupMenuInputs();

        // Atualiza a posição visual do seletor imediatamente (mesmo que alpha seja 0)
        this.updateSelectorPosition(); 

        // --- Animações Visuais (Fade In) ---
        // O seletor está aqui na lista, então ele aparece suavemente (fade-in) junto com o resto.
        // Mas como isMenuReady já é true, se você apertar 'S' durante essa animação, ele move!
        this.tweens.add({
            targets: [title, btnStart, btnContinue, btnOptions, this.selectorSprite], 
            alpha: 1, 
            duration: 2500, 
            ease: 'Power2'
            // Removemos o onComplete que travava o menu
        });

        this.tweens.add({ targets: glow, alpha: 0.7, duration: 3000, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: glow, alpha: 0.3, yoyo: true, repeat: -1, duration: 2000, ease: 'Sine.easeInOut', delay: 3000 });
    }

    setupMenuInputs() {
        this.menuButtons.forEach((btn, index) => {
            btn.on('pointerover', () => {
                if (!this.isMenuReady) return;
                this.selectedButtonIndex = index;
                this.updateSelectorPosition();
            });

            btn.on('pointerdown', () => {
                if (!this.isMenuReady) return;
                this.triggerMenuAction();
            });
        });

        this.input.keyboard.on('keydown', (event) => {
            if (!this.isMenuReady) return;

            switch (event.code) {
                case 'KeyW': case 'ArrowUp': this.changeSelection(-1); break;
                case 'KeyS': case 'ArrowDown': this.changeSelection(1); break;
                case 'Space': case 'Enter': this.triggerMenuAction(); break;
            }
        });
    }

    changeSelection(direction) {
        const len = this.menuButtons.length;
        this.selectedButtonIndex = (this.selectedButtonIndex + direction + len) % len;
        this.updateSelectorPosition();
    }

    updateSelectorPosition() {
        const selectedBtn = this.menuButtons[this.selectedButtonIndex];
        
        // --- SEUS OFFSETS AJUSTADOS ---
        const yOffsets = [0, 24, 48]; 

        const selectorX = selectedBtn.x - 60; 
        const selectorY = selectedBtn.y + yOffsets[this.selectedButtonIndex];

        this.selectorSprite.setVisible(true);
        this.selectorSprite.setPosition(selectorX, selectorY);
        
        // Pequeno bounce visual
        // O tween só roda se o seletor já estiver visível para não bugar o fade-in inicial
        if (this.selectorSprite.alpha > 0.1) {
            this.tweens.add({
                targets: this.selectorSprite,
                x: selectorX - 5,
                yoyo: true, duration: 200, ease: 'Sine.easeInOut'
            });
        }
    }

    triggerMenuAction() {
        this.isMenuReady = false; // Bloqueia para não clicar duas vezes
        this.input.keyboard.removeAllListeners('keydown');

        if (this.selectedButtonIndex === 0) {
            this.startStory();
        } else {
            console.log("Opção em desenvolvimento.");
            this.isMenuReady = true; // Libera de novo se for botão sem função
            this.setupMenuInputs();
        }
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
        if (!this.scene.isActive('Level_1')) {
            this.scene.launch('Level_1');
            this.scene.bringToTop('Start');
            const level1 = this.scene.get('Level_1');
            level1.events.once('create', () => {
                if (level1.input && level1.input.keyboard) level1.input.keyboard.enabled = false;
                if (level1.input && level1.input.mouse) level1.input.mouse.enabled = false;
            });
        }
        if (this.bgNormal) this.bgNormal.destroy();
        if (this.bgBright) this.bgBright.destroy();
        if (this.curtains) this.curtains.destroy();
        if (this.uiGroup) this.uiGroup.setVisible(false);
        if (this.imgZoom) this.imgZoom.destroy(); 

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
            if (level1.iniciarCutscene) level1.iniciarCutscene();
        }
        this.scene.stop('Start'); 
    }
}