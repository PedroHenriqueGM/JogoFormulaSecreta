export class DialogueManager {
    constructor(scene) {
        this.scene = scene;
        this.createUI();
    }

    createUI() {
        const { width, height } = this.scene.scale;

        // Fundo
        this.box = this.scene.add.rectangle(0, 0, 0, 0, 0x000000, 0.9)
            .setScrollFactor(0).setDepth(100).setAlpha(0);

        // Borda
        this.border = this.scene.add.rectangle(0, 0, 0, 0)
            .setScrollFactor(0).setDepth(101).setStrokeStyle(1, 0xffffff).setAlpha(0);

        // Texto
        this.mainText = this.scene.add.bitmapText(0, 0, 'pixelFont', '', 8)
            .setOrigin(0.5).setCenterAlign()
            .setScrollFactor(0).setDepth(102).setAlpha(0);
        this.mainText.maxWidth = width - 40; 

        // Indicador "Continuar"
        this.btnNext = this.scene.add.bitmapText(width - 10, height - 10, 'alkhemikal', '▼', 10)
            .setOrigin(1, 1).setScrollFactor(0).setDepth(200).setAlpha(0);

        // Animação do indicador
        this.scene.tweens.add({
            targets: this.btnNext, alpha: { from: 0.5, to: 1 }, yoyo: true, repeat: -1, duration: 600
        });
    }

    showNarration(content, callback) {
        const { width, height } = this.scene.scale;
        
        // Configura texto e caixa
        this.mainText.setText(content);
        const bounds = this.mainText.getTextBounds().global;
        const boxHeight = Math.max(40, bounds.height + 20); 
        const boxWidth = width - 20;
        const centerX = width / 2;
        const centerY = height / 2;

        this.box.setPosition(centerX, centerY).setSize(boxWidth, boxHeight);
        this.border.setPosition(centerX, centerY).setSize(boxWidth, boxHeight);
        this.mainText.setPosition(centerX, centerY);

        // Animação de Entrada
        this.scene.tweens.add({
            targets: [this.box, this.border, this.mainText],
            alpha: 1, duration: 500,
            onComplete: () => {
                this.waitForClick(() => {
                    this.finishDialogue(callback);
                }, 1000); 
            }
        });
    }

    showNextButton() {
        this.btnNext.setVisible(true).setAlpha(1);
    }

    finishDialogue(callback) {
        this.btnNext.setAlpha(0);
        this.scene.tweens.add({
            targets: [this.box, this.border, this.mainText],
            alpha: 0, duration: 500,
            onComplete: () => {
                if (callback) callback(); 
            }
        });
    }

    waitForClick(callback, visualDelay = 0) {
        // Timer para mostrar o "▼"
        const timerVisual = this.scene.time.delayedCall(visualDelay, () => {
             this.showNextButton();
        });

        // Função que ativa os ouvintes de input
        const activateInput = () => {
            let jaAvançou = false;
            
            // Função única que roda ao avançar
            const avancar = () => {
                if (jaAvançou) return;
                jaAvançou = true;

                timerVisual.remove(); // Cancela o timer visual se avançar rápido
                
                //Remove todos os ouvintes para não bugar o próximo diálogo
                this.scene.input.off('pointerdown', avancar);
                if (this.scene.input.keyboard) {
                    this.scene.input.keyboard.off('keydown-SPACE', avancar);
                    this.scene.input.keyboard.off('keydown-ENTER', avancar);
                }

                if (callback) callback();
            };

            // Registra Click
            this.scene.input.once('pointerdown', avancar);
            
            // Registra Espaço e Enter (específicos)
            if (this.scene.input.keyboard) {
                this.scene.input.keyboard.once('keydown-SPACE', avancar);
                this.scene.input.keyboard.once('keydown-ENTER', avancar);
            }
        };

        // Pequeno delay (200ms) antes de aceitar input para evitar "pulo duplo" acidental
        this.scene.time.delayedCall(200, activateInput);
    }
}