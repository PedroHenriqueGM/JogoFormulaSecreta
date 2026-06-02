import { DialogueManager } from '../managers/DialogueManager.js';
import { EffectManager } from '../managers/EffectManager.js';
import { SaveManager } from '../managers/SaveManager.js';

export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    // preload() removido — todos os assets são carregados pelo Preloader.js

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

        // desabilita o botão "Continuar" visualmente se não houver save
        this.continueDisabled = !SaveManager.hasSave();
        if (this.continueDisabled) {
            btnContinue.setTint(0x444444); // cinza escuro
        }

        this.setupMenuInputs();
        this.updateSelectorPosition(); 

        this.selectorTween = this.tweens.addCounter({
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
            btn.on('pointerover', () => {
                if (!this.isMenuReady) return;
                if (index === 1 && this.continueDisabled) return; // ignora hover no botão desabilitado
                this.selectedButtonIndex = index;
                this.updateSelectorPosition();
            });
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
        let next = (this.selectedButtonIndex + direction + len) % len;

        // pula o índice 1 (Continuar) se estiver desabilitado
        if (next === 1 && this.continueDisabled) {
            next = (next + direction + len) % len;
        }

        this.selectedButtonIndex = next;
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

        if (this.selectedButtonIndex === 0) {
            // Novo jogo: pede confirmação se já houver save
            if (SaveManager.hasSave()) {
                this.showConfirmNewGame();
            } else {
                this.runIntroSequence();
            }
        } else if (this.selectedButtonIndex === 1) {
            // Continuar
            const save = SaveManager.load();
            if (save) {
                this.startContinue(save.level);
            } else {
                console.log('Nenhum save encontrado.');
                this.isMenuReady = true;
                this.setupMenuInputs();
            }
        } else {
            // Outras opções (Configurações, etc.)
            console.log('Opção em desenvolvimento.');
            this.isMenuReady = true;
            this.setupMenuInputs();
        }
    }

    startContinue(levelKey) {
        // faz fade out da música e da câmera ao mesmo tempo
        if (this.musicIntro) {
            this.tweens.add({
                targets: this.musicIntro,
                volume: 0,
                duration: 800,
                onComplete: () => this.musicIntro.stop()
            });
        }

        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(levelKey, { fromSave: true });
        });
    }

    showConfirmNewGame() {
        const { width, height } = this.scale;
        
        if (this.selectorTween) this.selectorTween.pause(); // pausa o seletor do fundo

        // Índice 0 = Sim | Índice 1 = Não  (começa no "Não" por segurança)
        this.confirmIndex = 1;

        // Escurece o fundo
        this.confirmOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
            .setDepth(60).setScrollFactor(0);

        this.confirmBox = this.add.image(width / 2, height / 2, 'confirm_box')
            .setDepth(61).setScrollFactor(0);

        // Mensagem
        this.confirmMsg = this.add.bitmapText(width / 2, height / 2 - 16, 'pixelFont',
            'O save atual será apagado.\nTem certeza que deseja iniciar um novo jogo?', 16)
            .setOrigin(0.5, 0.5).setDepth(62).setScrollFactor(0);

        // Opções "Sim" e "Não"
        this.confirmOptSim = this.add.bitmapText(width / 2 - 50, height / 2 + 18, 'pixelFont', 'Sim', 16)
            .setOrigin(0.5).setDepth(62).setScrollFactor(0);

        this.confirmOptNao = this.add.bitmapText(width / 2 + 50, height / 2 + 18, 'pixelFont', 'Não', 16)
            .setOrigin(0.5).setDepth(62).setScrollFactor(0);

        // seletor
        this.confirmCursor = this.add.image(0, height / 2 + 20, 'selector')
            .setOrigin(0.5).setDepth(62).setScrollFactor(0);

        //variável de controle para a posição do seletor
        this.baseCursorX = 0;

        // animação do seletor flutuando
        this.confirmTween = this.tweens.addCounter({
            from: 0, to: 360, duration: 1500, repeat: -1,
            onUpdate: (tween) => {
                if (!this.confirmCursor || !this.confirmCursor.active) return;
                const angle = Phaser.Math.DegToRad(tween.getValue());
                // Usa a variável baseCursorX e adiciona o balanço
                this.confirmCursor.x = this.baseCursorX + Math.sin(angle) * 6;
            }
        });

        this.updateConfirmCursor();
        this.setupConfirmInputs();
    }

    updateConfirmCursor() {
        const { width } = this.scale;
        
        // posição base de onde o cursor deve flutuar (-20px para não encostar na letra)
        const xSim = width / 2 - 50;
        const xNao = width / 2 + 50;
        this.baseCursorX = this.confirmIndex === 0 ? xSim - 26 : xNao - 26;

        // Pinta a opção selecionada de Branco e a outra de Cinza
        this.confirmOptSim.setTint(this.confirmIndex === 0 ? 0xffffff : 0x888888);
        this.confirmOptNao.setTint(this.confirmIndex === 1 ? 0xffffff : 0x888888);
    }

    setupConfirmInputs() {
        // navegação por teclado
        this.input.keyboard.on('keydown', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.confirmIndex = 0;
                this.updateConfirmCursor();
            } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.confirmIndex = 1;
                this.updateConfirmCursor();
            } else if (e.code === 'Enter' || e.code === 'Space') {
                this.resolveConfirm();
            } else if (e.code === 'Escape') {
                this.confirmIndex = 1;
                this.resolveConfirm();
            }
        });

        // navegação por mouse 
        this.confirmOptSim.setInteractive({ useHandCursor: true })
            .on('pointerover', () => { this.confirmIndex = 0; this.updateConfirmCursor(); })
            .on('pointerdown', () => { this.confirmIndex = 0; this.resolveConfirm(); });

        this.confirmOptNao.setInteractive({ useHandCursor: true })
            .on('pointerover', () => { this.confirmIndex = 1; this.updateConfirmCursor(); })
            .on('pointerdown', () => { this.confirmIndex = 1; this.resolveConfirm(); });
    }

    resolveConfirm() {
        if (this.confirmTween) this.confirmTween.remove();

        this.input.keyboard.removeAllListeners('keydown');

        [this.confirmOverlay, this.confirmBox, this.confirmMsg,
         this.confirmOptSim, this.confirmOptNao, this.confirmCursor].forEach(o => o?.destroy());

        if (this.confirmIndex === 0) {
            // confirmou: apaga o save e inicia novo jogo
            SaveManager.deleteSave();
            this.runIntroSequence();
        } else {
            // cancelou: volta ao menu
            this.isMenuReady = true;
            this.setupMenuInputs();
        }
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