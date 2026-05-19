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
        // Tamanho 16 para manter a nitidez dos diálogos
        this.add.bitmapText(width / 2, height / 2 - 40, 'pixelFont', "PAUSADO", 16)
            .setOrigin(0.5);

        // Lógica de Teclado
        this.botoes = [];
        this.selectedIndex = 0;

        //------- Botões (cada um em Y diferente) -------
        // Criamos os botões com tamanho 16 e guardamos no array para navegação
        this.botoes.push(this.criarBotao(width / 2, height / 2 - 15, "Continuar", () => this.continuar()));
        this.botoes.push(this.criarBotao(width / 2, height / 2 + 5,  "Salvar",    () => this.salvar()));
        this.botoes.push(this.criarBotao(width / 2, height / 2 + 25, "Opções",    () => this.opcoes()));
        this.botoes.push(this.criarBotao(width / 2, height / 2 + 45, "Sair",      () => this.sair()));

        // Controles de Teclado
        this.input.keyboard.on('keydown', (event) => {
            switch (event.code) {
                case 'KeyW': case 'ArrowUp': this.mudarSelecao(-1); break;
                case 'KeyS': case 'ArrowDown': this.mudarSelecao(1); break;
                case 'Enter': case 'Space': this.confirmarSelecao(); break;
            }
        });

        //------- ESC fecha o menu -------
        this.input.keyboard.once("keydown-ESC", () => this.continuar());

        // Inicializa o visual do menu (aplica as cores iniciais)
        this.atualizarVisualMenu();
    }

    criarBotao(x, y, label, callback) {
        // bitmapText com tamanho 16 para evitar distorção de pixels
        const btn = this.add.bitmapText(x, y, 'pixelFont', label, 16)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        btn.on("pointerover", () => {
            this.selectedIndex = this.botoes.indexOf(btn); // sincroniza teclado/mouse
            this.atualizarVisualMenu();
        });
        
        btn.on("pointerout", () => {
            this.atualizarVisualMenu();
        });

        btn.on("pointerdown", callback); // executa ao clicar

        return btn;
    }

    mudarSelecao(direcao) {
        const total = this.botoes.length;
        this.selectedIndex = (this.selectedIndex + direcao + total) % total;
        this.atualizarVisualMenu();
    }

    atualizarVisualMenu() {
        this.botoes.forEach((btn, index) => {
            if (index === this.selectedIndex) {
                btn.setTint(0xffffff); // Branco puro para o selecionado
            } else {
                btn.setTint(0xaaaaaa); // Cinza para os desativados
            }
        });
    }

    confirmarSelecao() {
        const botaoAtual = this.botoes[this.selectedIndex];
        botaoAtual.emit('pointerdown');
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

        // feedback visual temporário com bitmapText nítido
        const { width, height } = this.scale;
        const msg = this.add.bitmapText(width / 2, height / 2 + 60, 'pixelFont', "✔ Jogo salvo!", 16)
            .setOrigin(0.5)
            .setTint(0x00ff88);
            
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