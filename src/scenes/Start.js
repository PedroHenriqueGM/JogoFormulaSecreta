import { DialogueManager } from '../managers/DialogueManager.js';
import { EffectManager } from '../managers/EffectManager.js';

export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        // ASSETS DO START
        this.load.image('scene1_frame1', 'assets/intro/scene1_1.png');
        this.load.image('scene1_frame2', 'assets/intro/scene1_2.png');
        this.load.image('scene1bright', 'assets/intro/scene1bright.png');
        this.load.image('selector', 'assets/intro/selector.png');
        this.load.image('livroZoom', 'assets/intro/livroZoom.png');
        
        // UI
        this.load.image('ui_box_narrator', 'assets/ui/ui_box_narrator.png');
        this.load.image('ui_box_character', 'assets/ui/ui_box_character.png');

        // EFEITOS
        this.load.spritesheet('flare', 'assets/intro/flare.png', { frameWidth: 16, frameHeight: 16 });
        this.load.image('textGlow', 'assets/intro/glow.png');
      
        // SPRITESHEETS
        this.load.spritesheet('curtains', 'assets/intro/curtains.png', { frameWidth: 320, frameHeight: 180 });
        this.load.spritesheet('startTexts', 'assets/intro/startTexts.png', { frameWidth: 320, frameHeight: 180 });
        
        // ÁUDIO
        this.load.audio('intro', 'assets/audio/intro.wav');
        this.load.audio('burning', 'assets/audio/burning.wav');
        // utau
        this.load.audio('voice_a', 'assets/audio/voices/voice1/voice_a.wav');
        this.load.audio('voice_e', 'assets/audio/voices/voice1/voice_e.wav');
        this.load.audio('voice_i', 'assets/audio/voices/voice1/voice_i.wav');
        this.load.audio('voice_o', 'assets/audio/voices/voice1/voice_o.wav');
        this.load.audio('voice_u', 'assets/audio/voices/voice1/voice_u.wav');

        // FONTES
        this.load.bitmapFont('pixelFont', 'assets/fonts/pixelFont/pixelFont.png', 'assets/fonts/pixelFont/pixelFont.xml');
    }

    create() {
        const { width, height } = this.scale;

        this.dialogue = new DialogueManager(this);

        // Música Intro
        this.musicIntro = this.sound.add('intro', { loop: true, volume: 0 });
        this.musicIntro.play();
        this.tweens.add({ targets: this.musicIntro, volume: 0.5, duration: 2000 });

        this.createAnimations();

        // Backgrounds
        this.bgBright = this.add.image(width / 2, height / 2, 'scene1bright').setAlpha(1);
        this.bgNormal = this.add.sprite(width / 2, height / 2, 'scene1_frame1').setAlpha(0);
        this.bgNormal.play('anim_candle'); 
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
            this.anims.create({
                key: 'anim_flare',
                frames: this.anims.generateFrameNumbers('flare', { start: 0, end: 1 }), // Como você tem 2 frames
                frameRate: 8,
                repeat: -1,  
                yoyo: true  
            });
        }
    }

    createMenu() {
        const { width, height } = this.scale;
        this.uiGroup = this.add.group();
        this.selectedButtonIndex = 0;
        this.isMenuReady = true; 

        // Elementos do menu
        const glow = this.add.image(width / 2, height / 2, 'textGlow').setOrigin(0.5).setDepth(0).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffffff); 
        const selectorBaseX = (width / 2) - 60;
        this.selectorSprite = this.add.image(selectorBaseX, 0, 'selector').setDepth(20).setVisible(false).setAlpha(0);

        const centerX = width / 2;
        const centerY = height / 2;
        const title = this.add.sprite(centerX, centerY, 'startTexts', 0).setDepth(10).setAlpha(0);
        const btnStart = this.add.sprite(centerX, centerY, 'startTexts', 1).setInteractive().setDepth(10).setAlpha(0);
        const btnContinue = this.add.sprite(centerX, centerY, 'startTexts', 2).setInteractive().setDepth(10).setAlpha(0);
        const btnOptions = this.add.sprite(centerX, centerY, 'startTexts', 3).setInteractive().setDepth(10).setAlpha(0);

        // Hitboxes
        btnStart.input.hitArea.setTo(110, 80, 100, 20);     
        btnContinue.input.hitArea.setTo(110, 102, 100, 20); 
        btnOptions.input.hitArea.setTo(110, 130, 100, 20);  

        this.menuButtons = [btnStart, btnContinue, btnOptions];
        this.uiGroup.addMultiple([glow, this.selectorSprite, title, btnStart, btnContinue, btnOptions]);

        this.setupMenuInputs();
        this.updateSelectorPosition(); 

        this.tweens.addCounter({
            from: 0, to: 360, duration: 1500, repeat: -1,
            onUpdate: (tween) => {
                const angle = Phaser.Math.DegToRad(tween.getValue());
                this.selectorSprite.x = selectorBaseX + Math.sin(angle) * 6;
            }
        });

        this.tweens.add({ targets: [title, btnStart, btnContinue, btnOptions, this.selectorSprite], alpha: 1, duration: 2500, ease: 'Power2' });
        this.tweens.add({ targets: glow, alpha: 0.7, duration: 3000, ease: 'Sine.easeInOut' });
    }

    setupMenuInputs() {
        this.menuButtons.forEach((btn, index) => {
            btn.on('pointerover', () => { if (this.isMenuReady) { this.selectedButtonIndex = index; this.updateSelectorPosition(); } });
            btn.on('pointerdown', () => { if (this.isMenuReady) this.triggerMenuAction(); });
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
        const yOffsets = [0, 24, 48]; 
        const selectorY = selectedBtn.y + yOffsets[this.selectedButtonIndex];
        this.selectorSprite.setVisible(true).setY(selectorY); 
    }

    triggerMenuAction() {
        this.isMenuReady = false; 
        this.input.keyboard.removeAllListeners('keydown');
        if (this.selectedButtonIndex === 0) this.runIntroSequence(); 
        else { console.log("Opção em desenvolvimento."); this.isMenuReady = true; this.setupMenuInputs(); }
    }

    //CUTSCENE

    async runIntroSequence() {
        const { width, height } = this.scale;

        this.uiGroup.setVisible(false);
        this.curtains.play('anim_curtains_open');
        await new Promise(resolve => this.curtains.on('animationcomplete', resolve));
        this.curtains.setVisible(false);

        // Cena 1
        this.tweens.add({ targets: this.bgBright, alpha: 0, duration: 2000 });
        this.tweens.add({ targets: this.bgNormal, alpha: 1, duration: 2000 });
        await this.waitOrClick(5000);
        await this.playDialogue("Milão, século XVI.");
        
        // Cena 2
        const closedBook = this.add.image(width + 100, height, 'scene1_frame1').setOrigin(1, 1).setScale(2).setAlpha(0);
        this.tweens.add({ targets: this.bgNormal, alpha: 0, duration: 1500 });
        this.tweens.add({ targets: closedBook, alpha: 1, duration: 1500 });
        await this.waitOrClick(2000);
        await this.playDialogue("\"Ars Magna\" — o tratado que\nsistematiza equações cúbicas.");

        // Cena 3
        const imgZoom = this.add.image(width / 2, height / 2, 'livroZoom').setAlpha(0);
        const scale = Math.max(width / imgZoom.width, height / imgZoom.height);
        imgZoom.setScale(scale);
        this.tweens.add({ targets: closedBook, alpha: 0, duration: 1000 });
        this.tweens.add({ targets: imgZoom, alpha: 1, duration: 1000 });
        await this.waitOrClick(1500);
        await this.playDialogue("Compilado por matemáticos\ncomo Tartaglia e Scipione.");

        // limpa visuais antigos
        if (closedBook) closedBook.destroy();
        if (this.bgNormal) this.bgNormal.destroy();
        if (this.bgBright) this.bgBright.destroy();
        
        // inicia a sequencia do fogo
        this.startFireSequence(imgZoom);
    }

    startFireSequence(imgZoom) {
        if (!this.scene.isActive('Level_1')) {
            this.scene.launch('Level_1');
            this.scene.bringToTop('Start');
        }

        const level1 = this.scene.get('Level_1');
        level1.events.once('create', () => {

            if (level1.input?.keyboard) level1.input.keyboard.enabled = false;
            if (level1.input?.mouse) level1.input.mouse.enabled = false;

            // audio do fogo
            if (this.musicIntro) {
                this.tweens.add({ targets: this.musicIntro, volume: 0, duration: 2000, onComplete: () => this.musicIntro.stop() });
            }
            this.musicBurning = this.sound.add('burning', { loop: true, volume: 0 });
            this.musicBurning.play();
            this.tweens.add({ targets: this.musicBurning, volume: 0.8, duration: 3000 });

            // efeito visual
            if (imgZoom) imgZoom.destroy(); 
            
            this.EffectManager = new EffectManager(this);
            this.EffectManager.start(() => {
                this.startGame();
            });

        });
    }

    startGame() {
        const level1 = this.scene.get('Level_1');
        
        // fade out do som do fogo
        if (this.musicBurning) {
            this.tweens.add({
                targets: this.musicBurning,
                volume: 0,
                duration: 2500,
                onComplete: () => this.musicBurning.stop()
            });
        }

        this.tweens.add({
            targets: this.cameras.main,
            alpha: 0, 
            duration: 2000,
            onComplete: () => {
                this.scene.stop('Start');
                
                if (level1) {
                    if (level1.input?.keyboard) level1.input.keyboard.enabled = true;
                    if (level1.input?.mouse) level1.input.mouse.enabled = true;
                    if (level1.iniciarCutscene) level1.iniciarCutscene();
                }
            }
        });
    }

    playDialogue(text) {
        return new Promise(resolve => {
            this.dialogue.showDialogue(text, null, null, () => {
                this.dialogue.finishDialogue(() => resolve());
            });
        });
    }

    waitOrClick(duration) {
        return new Promise((resolve) => {
            let clicked = false;
            const timer = this.time.delayedCall(duration, () => { if (!clicked) { clicked = true; resolve(); } });
            const clickHandler = () => {
                if (!clicked) {
                    clicked = true; timer.remove();
                    this.input.off('pointerdown', clickHandler);
                    this.input.keyboard.off('keydown-SPACE', clickHandler);
                    this.input.keyboard.off('keydown-ENTER', clickHandler);
                    resolve();
                }
            };
            this.input.once('pointerdown', clickHandler);
            if (this.input.keyboard) {
                this.input.keyboard.once('keydown-SPACE', clickHandler);
                this.input.keyboard.once('keydown-ENTER', clickHandler);
            }
        });
    }
}