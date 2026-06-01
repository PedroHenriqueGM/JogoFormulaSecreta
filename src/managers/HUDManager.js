// ============================================================
// HUDManager.js — Gerenciador da Interface (HUD)
// Responsável por criar e atualizar todos os elementos
// visuais da interface do jogador:
//   - Corações de vida
//   - Ícone e contador de pedras
//   - Prompts de interação ([E] Pegar / [F] Segure para mirar)
// ============================================================

export class HUDManager {

    /**
     * @param {Phaser.Scene} scene  - A cena onde o HUD será exibido
     * @param {Player}       player - O jogador (para ler health e stonesCarried)
     */
    constructor(scene, player) {
        this.scene  = scene;
        this.player = player;

        // Cria todos os elementos visuais do HUD na ordem certa
        this._createHearts();
        this._createStoneHUD();
        this._createPrompts();
    }

    // ----------------------------------------------------------
    // _createHearts()
    //   Cria os sprites de coração na parte superior esquerda.
    //   Cada coração representa 2 pontos de vida:
    //   frame 0 = cheio, frame 1 = meio, frame 2 = vazio.
    // ----------------------------------------------------------
    _createHearts() {
        this.heartsGroup = [];

        // Cada coração representa 2 pontos de vida (ex: maxHealth 6 = 3 corações)
        const maxHearts = Math.floor(this.player.maxHealth / 2);

        for (let i = 0; i < maxHearts; i++) {
            const heart = this.scene.add.sprite(16 + (i * 18), 16, 'hearts', 2)
                .setScrollFactor(0) // fica fixo na tela, não segue a câmera
                .setDepth(100)
                .setOrigin(0, 0);

            this.heartsGroup.push(heart);
        }

        // Já atualiza na criação para mostrar a vida inicial correta
        this.updateHearts();
    }

    // ----------------------------------------------------------
    // _createStoneHUD()
    //   Cria o ícone de pedra e o texto contador (ex: "x 2").
    //   Ficam ocultos enquanto o jogador não carrega nenhuma pedra.
    // ----------------------------------------------------------
    _createStoneHUD() {
        this.stoneIcon = this.scene.add.image(16, 36, 'stone')
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(100)
            .setVisible(false);

        this.stonesText = this.scene.add.bitmapText(36, 35, 'pixelFont', 'x 0', 16)
            .setTint(0xcccccc)
            .setScrollFactor(0)
            .setDepth(100)
            .setVisible(false);

        // Já atualiza na criação (vai esconder pois começa com 0 pedras)
        this.updateStones();
    }

    // ----------------------------------------------------------
    // _createPrompts()
    //   Cria os textos de dica de interação:
    //   - "[E] Pegar"       → aparece flutuando sobre a pedra mais próxima
    //   - "[F] Segure..."   → aparece fixo na tela quando há pedras no inventário
    // ----------------------------------------------------------
    _createPrompts() {
        // Prompt flutuante que aparece acima da pedra mais próxima
        this.collectPrompt = this.scene.add.bitmapText(0, 0, 'pixelFont', '[E] Pegar', 16)
            .setOrigin(0.5, 1) // âncora na base do texto para ficar acima da pedra
            .setDepth(200)     // acima de tudo, incluindo o player
            .setVisible(false);

        // Prompt fixo na tela indicando como mirar com a pedra
        this.throwPrompt = this.scene.add.bitmapText(16, 56, 'pixelFont', '[F] Segure para mirar', 16)
            .setTint(0xffdd88)
            .setScrollFactor(0) // fixo na tela
            .setDepth(100)
            .setVisible(false);
    }

    // ----------------------------------------------------------
    // updateHearts()
    //   Atualiza os frames dos corações de acordo com a vida atual.
    //   Deve ser chamado a cada frame pelo update() da cena.
    // ----------------------------------------------------------
    updateHearts() {
        const health = this.player.health;

        this.heartsGroup.forEach((heart, index) => {
            // Cada coração representa 2 pontos de vida
            // (coração 0 = vida 0-1, coração 1 = vida 2-3, coração 2 = vida 4-5...)
            const heartValue = index * 2;

            if (health >= heartValue + 2) {
                heart.setFrame(0); // coração cheio
            } else if (health === heartValue + 1) {
                heart.setFrame(1); // coração na metade
            } else {
                heart.setFrame(2); // coração vazio
            }
        });
    }

    // ----------------------------------------------------------
    // updateStones()
    //   Mostra ou esconde o ícone e o contador de pedras conforme
    //   a quantidade que o jogador está carregando no inventário.
    // ----------------------------------------------------------
    updateStones() {
        const pedras = this.player.stonesCarried;

        if (pedras > 0) {
            this.stoneIcon.setVisible(true);
            this.stonesText.setVisible(true);
            this.stonesText.setText(`x ${pedras}`);
        } else {
            // Esconde a UI de pedras quando o inventário está vazio
            this.stoneIcon.setVisible(false);
            this.stonesText.setVisible(false);
        }
    }

    // ----------------------------------------------------------
    // updatePrompts(groundStones)
    //   Verifica se há pedra perto do jogador e posiciona
    //   o prompt "[E] Pegar" acima da mais próxima.
    //   Também mostra/oculta o prompt de mira [F].
    //
    //   @param {Phaser.GameObjects.GameObject[]} groundStones
    //     Lista de pedras no chão (filhos do groundStonesGroup)
    // ----------------------------------------------------------
    updatePrompts(groundStones) {
        const collectRadius = 40; // raio em pixels para considerar "perto o suficiente"

        let closestStone = null;
        let closestDist  = Infinity;

        // Encontra a pedra mais próxima dentro do raio de coleta
        groundStones.forEach(stone => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                stone.x,       stone.y
            );

            if (dist <= collectRadius && dist < closestDist) {
                closestDist  = dist;
                closestStone = stone;
            }
        });

        // Posiciona e exibe o prompt sobre a pedra, ou o esconde se não houver nenhuma perto
        if (closestStone) {
            this.collectPrompt.setPosition(closestStone.x, closestStone.y - 16);
            this.collectPrompt.setVisible(true);
        } else {
            this.collectPrompt.setVisible(false);
        }

        // O prompt de mira [F] só aparece se o jogador tem pedras para arremessar
        this.throwPrompt.setVisible(this.player.stonesCarried > 0);
    }
}
