import { SaveManager } from "../managers/SaveManager.js";

export class PauseMenu extends Phaser.Scene {
    constructor() {
        super({ key: "PauseMenu" });
    }

    // `data.origemCena` é a chave da cena que foi pausada (ex: "Level_1", "Level_2"...)
    create(data) {
        this.origemCena = data?.origemCena ?? "Level_1"; // fallback de segurança
        
        const { width, height } = this.scale;

        //------- Fundo escurecido -------
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
            .setScrollFactor(0);

        //------- Título -------
        this.add.text(width / 2, height / 2 - 40, "PAUSADO", {
            fontSize: "14px",
            fill: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        //------- Botões (cada um em Y diferente) -------
        this.criarBotao(width / 2, height / 2 - 15, "Continuar", () => this.continuar());
        this.criarBotao(width / 2, height / 2 + 5,  "Salvar",    () => this.salvar());
        this.criarBotao(width / 2, height / 2 + 25, "Opções",    () => this.opcoes());
        this.criarBotao(width / 2, height / 2 + 45, "Sair",      () => this.sair());

        //------- ESC fecha o menu -------
        this.input.keyboard.once("keydown-ESC", () => this.continuar());
    }

    criarBotao(x, y, label, callback) {
        const btn = this.add.text(x, y, label, {
            fontSize: "10px",
            fill: "#aaaaaa"
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on("pointerover", () => btn.setStyle({ fill: "#ffffff" })); // clareia ao passar
        btn.on("pointerout",  () => btn.setStyle({ fill: "#aaaaaa" })); // volta ao sair
        btn.on("pointerdown", callback);                                 // executa ao clicar
    }

    continuar() {
        // retoma a cena que estava pausada e fecha o menu
        this.scene.resume(this.origemCena);
        this.scene.stop();
    }

    salvar() {
        // lê o estado atual da cena de origem (qualquer level)
        const cena = this.scene.get(this.origemCena);
        SaveManager.save({
            level:   this.origemCena,
            playerX: cena.player.x,
            playerY: cena.player.y,
            health:  cena.player.health
        });

        // feedback visual temporário
        const { width, height } = this.scale;
        const msg = this.add.text(width / 2, height / 2 + 60, "✔ Jogo salvo!", {
            fontSize: "8px",
            fill: "#00ff88"
        }).setOrigin(0.5);
        this.time.delayedCall(1500, () => msg.destroy());
    }

    opcoes() {
        // TODO: abrir sub-cena de opções futuramente
        console.log("Opções ainda não implementadas");
    }

    sair() {
        // Para a música da cena de origem antes de sair
        const cena = this.scene.get(this.origemCena);
        if (cena.bgMusic && cena.bgMusic.isPlaying) {
            cena.bgMusic.stop();
        }

        // Para todas as cenas ativas e volta para o menu inicial
        this.scene.stop(this.origemCena);
        this.scene.stop();
        this.scene.start("Start");
    }
}