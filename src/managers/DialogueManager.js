export class DialogueManager {
    constructor(scene) {
        this.scene = scene;
        this.createUI();
    }

    createUI() {
        const { width, height } = this.scene.scale;
        
        this.overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setAlpha(0).setDepth(100);

        this.mainText = this.scene.add.text(width / 2, height / 2, '', {
            fontFamily: '"VT323"', fontSize: '16px', color: '#ffffff',
            align: 'center', wordWrap: { width: width * 0.9 }
        }).setOrigin(0.5).setAlpha(0).setDepth(101);

        this.btnNext = this.scene.add.text(width - 20, height - 10, 'CONTINUAR ▼', {
            fontFamily: '"VT323"', fontSize: '14px', color: '#ffffff'
        }).setOrigin(1, 1).setAlpha(1).setDepth(102)
          .setVisible(false);

        // Pisca-pisca
        this.scene.tweens.add({
            targets: this.btnNext,
            alpha: { from: 0.5, to: 1 },
            yoyo: true, repeat: -1, duration: 800,
            paused: false
        });
    }

    showNarration(content, callback) {
        this.mainText.setText(content);

        this.scene.tweens.add({
            targets: [this.overlay, this.mainText],
            alpha: 1, duration: 1000,
            onComplete: () => {
                // Ao ler texto, deixamos um delay mínimo (500ms) só pra evitar duplo clique acidental
                this.waitForClick(() => {
                    this.finishDialogue(callback);
                }, 0); 
            }
        });
    }

    enableButton() {
        this.btnNext.setVisible(true);
    }

    hideButton() {
        this.btnNext.setVisible(false);
    }

    finishDialogue(callback) {
        this.hideButton();

        this.scene.tweens.add({
            targets: [this.overlay, this.mainText],
            alpha: 0, duration: 500,
            onComplete: () => {
                if (callback) callback(); 
            }
        });
    }

    // --- AQUI ESTÁ A LÓGICA DO SKIP ---
    waitForClick(callback, visualDelay = 0) {
        
        // 1. TIMER VISUAL (Botão "Continuar")
        // Ele obedece o tempo longo (ex: 4s) que você passou no Start.js
        const timerVisual = this.scene.time.delayedCall(visualDelay, () => {
             this.enableButton();
        });

        // 2. TIMER DE INPUT (Bloqueio de segurança)
        // Se o delay visual for longo (>1s), travamos o clique por 1s (seu pedido).
        // Se for curto (ex: lendo texto), travamos só 200ms para limpar o clique anterior.
        const inputBlockTime = (visualDelay > 1000) ? 1000 : 200;

        const activateInput = () => {
            let jaAvançou = false;
            
            const avancar = () => {
                if (jaAvançou) return;
                jaAvançou = true;

                // MAGIA: Se a pessoa clicou ANTES do botão aparecer...
                // Cancelamos o timer visual! Assim o botão nunca vai aparecer na próxima cena.
                timerVisual.remove();

                // Limpeza
                this.scene.input.off('pointerdown', avancar);
                if (this.scene.input.keyboard) {
                    this.scene.input.keyboard.off('keydown', avancar);
                }

                this.hideButton(); // Garante que esconde, caso já estivesse visível

                if (callback) callback();
            };

            // Ativa os ouvintes (Mouse + Teclado)
            this.scene.input.once('pointerdown', avancar);
            if (this.scene.input.keyboard) {
                this.scene.input.keyboard.once('keydown', avancar);
            }
        };

        // Inicia o timer para liberar o clique
        this.scene.time.delayedCall(inputBlockTime, activateInput);
    }
}