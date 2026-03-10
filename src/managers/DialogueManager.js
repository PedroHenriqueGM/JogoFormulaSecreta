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
        const dialogY = height - 28; 

        //NARRADOR
        this.narratorContainer = this.scene.add.container(width / 2, dialogY);
        this.narratorContainer.setDepth(100).setAlpha(0).setVisible(false).setScrollFactor(0); 

        this.narratorBox = this.scene.add.image(0, 0, 'ui_box_narrator');
        
        // alinha o texto ao topo
        this.narratorText = this.scene.add.bitmapText(-148, -20, 'pixelFont', '', 16)
            .setOrigin(0, 0)
            .setMaxWidth(270); 

        this.narratorContainer.add([this.narratorBox, this.narratorText]);

        //PERSONAGEM
        this.charContainer = this.scene.add.container(width / 2, dialogY);
        this.charContainer.setDepth(100).setAlpha(0).setVisible(false).setScrollFactor(0); 

        this.charBox = this.scene.add.image(0, 0, 'ui_box_character');
        this.portraitImage = this.scene.add.image(-130, 0, 'portrait_placeholder'); 

        this.nameText = this.scene.add.bitmapText(-130, -35, 'pixelFont', '', 8).setOrigin(0.5);
        
        // alinha o texto ao topo
        this.charText = this.scene.add.bitmapText(-90, -20, 'pixelFont', '', 16)
            .setOrigin(0, 0)
            .setMaxWidth(220);

        this.charContainer.add([this.charBox, this.portraitImage, this.nameText, this.charText]);

        // icone v
        this.nextIcon = this.scene.add.image(0, 0, 'selector') 
            .setOrigin(0.5)
            .setAngle(90)
            .setFlipY(true)
            .setDepth(200)
            .setAlpha(0)
            .setVisible(false)
            .setScrollFactor(0);
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
        if (char === ' ') return; 

        const lower = char.toLowerCase();
        let soundKey = null;

        // detecta as vogais e associa ao som correspondente
        if ('aáàãâ'.includes(lower)) soundKey = 'voice_a';
        else if ('eéê'.includes(lower)) soundKey = 'voice_e';
        else if ('ií'.includes(lower)) soundKey = 'voice_i';
        else if ('oóõô'.includes(lower)) soundKey = 'voice_o';
        else if ('uúü'.includes(lower)) soundKey = 'voice_u';

        if (soundKey) {
            // reproduz o som com sobreposição habilitada e pequenas variações
            this.scene.sound.play(soundKey, {
                overlap: true, // permite tocar múltiplas instâncias do mesmo som
                volume: 0.5,
                detune: Phaser.Math.Between(-50, 50) // variação no tom 
            });
        }
    }

    showNextIcon() {
        const isNarrator = this.narratorContainer.visible;
        const activeContainer = isNarrator ? this.narratorContainer : this.charContainer;
        
        const xOffset = 146; //direita do balão
        const yOffset = 12; //altura 

        this.scene.tweens.killTweensOf(this.nextIcon);

        this.iconBaseY = activeContainer.y + yOffset;

        this.nextIcon.setPosition(activeContainer.x + xOffset, this.iconBaseY);
        this.nextIcon.setVisible(true).setAlpha(0);

        this.startBouncing();

        this.scene.tweens.add({
            targets: this.nextIcon,
            alpha: 1,       
            duration: 500
        });
    }

    startBouncing() {
        if (this.bounceTween) this.bounceTween.remove();

        this.bounceTween = this.scene.tweens.addCounter({
            from: 0, 
            to: 360, 
            duration: 1500,
            repeat: -1,
            onUpdate: (tween) => {
                const angle = Phaser.Math.DegToRad(tween.getValue());
                
                this.nextIcon.y = this.iconBaseY + Math.sin(angle) * 3;
            }
        });
    }

    finishDialogue(callback) {
        this.scene.tweens.killTweensOf(this.nextIcon);
        this.nextIcon.setVisible(false);

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
        this.visualTimer = this.scene.time.delayedCall(500, () => this.showNextIcon());

        const activateInput = () => {
            let hasAdvanced = false;
            
            const advance = () => {
                if (hasAdvanced) return;
                hasAdvanced = true;

                if (this.visualTimer) this.visualTimer.remove();

                this.scene.tweens.killTweensOf(this.nextIcon);
                this.nextIcon.setVisible(false); 

                this.scene.input.off('pointerdown', advance);
                if (this.scene.input.keyboard) {
                    this.scene.input.keyboard.off('keydown-SPACE', advance);
                    this.scene.input.keyboard.off('keydown-ENTER', advance);
                }

                this.finishDialogue(callback);
            };

            this.scene.input.once('pointerdown', advance);
            if (this.scene.input.keyboard) {
                this.scene.input.keyboard.once('keydown-SPACE', advance);
                this.scene.input.keyboard.once('keydown-ENTER', advance);
            }
        };

        activateInput();
    }
}