export class DialogueManager {
    constructor(scene) {
        this.scene = scene;
        this.createUI();
        
        // velocidade da digitacao (menor = mais rapido)
        this.typeSpeed = 45; 
    }

    createUI() {
        const { width, height } = this.scene.scale;
        
        // altura da linha compacta para fonte 16px
        const fontData = this.scene.cache.bitmapFont.get('pixelFont');
        if (fontData) fontData.data.lineHeight = 12; 

        // margem inferior de 10px
        const dialogY = height - 35; 

        //NARRADOR
        this.narratorContainer = this.scene.add.container(width / 2, dialogY);
        this.narratorContainer.setDepth(100).setAlpha(0).setVisible(false).setScrollFactor(0); 

        this.narratorBox = this.scene.add.image(0, 0, 'ui_box_narrator');
        
        // alinha o texto ao topo
        this.narratorText = this.scene.add.bitmapText(-135, -20, 'pixelFont', '', 16)
            .setOrigin(0, 0)
            .setMaxWidth(270); 

        this.narratorContainer.add([this.narratorBox, this.narratorText]);

        //PERSONAGEM
        this.charContainer = this.scene.add.container(width / 2, dialogY);
        this.charContainer.setDepth(100).setAlpha(0).setVisible(false).setScrollFactor(0); 

        this.charBox = this.scene.add.image(0, 0, 'ui_box_character');
        this.portraitImage = this.scene.add.image(-130, 0, 'portrait_placeholder'); 

        this.nameText = this.scene.add.bitmapText(-130, -35, 'pixelFont', '', 8).setOrigin(0.5);
        
        // alinha o texto ao TOPO
        this.charText = this.scene.add.bitmapText(-90, -20, 'pixelFont', '', 16)
            .setOrigin(0, 0)
            .setMaxWidth(220);

        this.charContainer.add([this.charBox, this.portraitImage, this.nameText, this.charText]);

        // botao v
        this.btnNext = this.scene.add.bitmapText(0, 0, 'pixelFont', 'V', 16)
            .setOrigin(1, 1) 
            .setDepth(200).setAlpha(0).setVisible(false).setScrollFactor(0);
    }

    showDialogue(content, characterName = null, portraitKey = null, callback) {
        const isNarrator = !characterName;
        let targetContainer, targetTextObj;

        if (isNarrator) {
            this.charContainer.setVisible(false);
            this.narratorContainer.setVisible(true);
            targetContainer = this.narratorContainer;
            targetTextObj = this.narratorText;
        } else {
            this.narratorContainer.setVisible(false);
            this.charContainer.setVisible(true);
            this.nameText.setText(characterName);
            if (portraitKey) this.portraitImage.setTexture(portraitKey);
            targetContainer = this.charContainer;
            targetTextObj = this.charText;
        }

        // limpa o texto antes de começar
        targetTextObj.setText('');

        this.scene.tweens.add({
            targets: targetContainer,
            alpha: 1,
            duration: 300,
            onComplete: () => {
                this.typewriteText(targetTextObj, content, callback);
            }
        });
    }

    typewriteText(targetText, fullText, callback) {
        if (this.typingTimer) this.typingTimer.remove();

        let i = 0;
        
        const nextChar = () => {
            const char = fullText[i];
            targetText.text += char;
            
            // TOCA O SOM DAS VOGAIS
            this.playVoiceForChar(char);

            i++;

            if (i >= fullText.length) {
                this.waitForClick(callback);
                return;
            }

            let delay = this.typeSpeed;
            if (char === '\n') delay = 400; 
            else if ('.!?,'.includes(char)) delay = 150;

            this.typingTimer = this.scene.time.delayedCall(delay, nextChar);
        };

        nextChar();
    }

    playVoiceForChar(char) {
        if (char === ' ') return; // Retorna se for espaço em branco

        const lower = char.toLowerCase();
        let soundKey = null;

        // Detecta as vogais e associa ao som correspondente
        if ('aáàãâ'.includes(lower)) soundKey = 'voice_a';
        else if ('eéê'.includes(lower)) soundKey = 'voice_e';
        else if ('ií'.includes(lower)) soundKey = 'voice_i';
        else if ('oóõô'.includes(lower)) soundKey = 'voice_o';
        else if ('uúü'.includes(lower)) soundKey = 'voice_u';

        if (soundKey) {
            // Reproduz o som com sobreposição habilitada e pequenas variações
            this.scene.sound.play(soundKey, {
                overlap: true, // Permite tocar múltiplas instâncias do mesmo som
                volume: 0.5,
                detune: Phaser.Math.Between(-50, 50) // Pequena variação no tom para mais naturalidade
            });
        }
    }

    showNextButton() {
        const isNarrator = this.narratorContainer.visible;
        const activeContainer = isNarrator ? this.narratorContainer : this.charContainer;
        
        const xOffset = 140; 
        const yOffset = 20; 

        this.btnNext.setPosition(activeContainer.x + xOffset, activeContainer.y + yOffset);
        this.btnNext.setVisible(true).setAlpha(0);

        this.scene.tweens.add({
            targets: this.btnNext,
            alpha: 1,       
            duration: 500,
            onComplete: () => this.startBouncing()
        });
    }

    startBouncing() {
        this.scene.tweens.killTweensOf(this.btnNext);
        this.scene.tweens.add({
            targets: this.btnNext,
            y: '-=3',
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    finishDialogue(callback) {
        this.scene.tweens.killTweensOf(this.btnNext);
        this.btnNext.setVisible(false);

        this.scene.tweens.add({
            targets: [this.narratorContainer, this.charContainer],
            alpha: 0, 
            duration: 300,
            onComplete: () => {
                if (callback) callback(); 
            }
        });
    }

    waitForClick(callback) {
        this.timerVisual = this.scene.time.delayedCall(500, () => this.showNextButton());

        const activateInput = () => {
            let jaAvançou = false;
            
            const avancar = () => {
                if (jaAvançou) return;
                jaAvançou = true;

                if (this.timerVisual) this.timerVisual.remove();
                
                this.scene.tweens.killTweensOf(this.btnNext);
                this.btnNext.setVisible(false); 

                this.scene.input.off('pointerdown', avancar);
                if (this.scene.input.keyboard) {
                    this.scene.input.keyboard.off('keydown-SPACE', avancar);
                    this.scene.input.keyboard.off('keydown-ENTER', avancar);
                }

                this.finishDialogue(callback);
            };

            this.scene.input.once('pointerdown', avancar);
            if (this.scene.input.keyboard) {
                this.scene.input.keyboard.once('keydown-SPACE', avancar);
                this.scene.input.keyboard.once('keydown-ENTER', avancar);
            }
        };

        activateInput();
    }
}