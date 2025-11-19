export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        // Imagens principais
        this.load.image('quarto', 'assets/janela.png');
        this.load.image('livro', 'assets/livro.png');
        this.load.image('livroZoom', 'assets/livroZoom.png');

        // UI
        this.load.image('textbox', 'assets/textbox.png');
    }

    create() {
        this.stage = 0;

        // Primeira tela — quarto com janela
        this.background = this.add.image(640, 360, 'quarto');

        this.input.on('pointerdown', () => {
            if (this.stage === 0) {
                this.mostrarLivro();
            }
            else if (this.stage === 1) {
                this.mostrarTextoDoLivro();
            }
            else if (this.stage === 2) {
                this.mostrarLivroZoom(); // já sem a caixa de texto
            }
        });
    }

    // --- Clique 1 ---
    mostrarLivro() {
        this.stage = 1;
        this.background.setTexture('livro');
        this.background.setScale(1);
    }

    // --- Clique 2 ---
    mostrarTextoDoLivro() {
        this.stage = 2;

        // Fundo escuro translúcido
        this.overlay = this.add.rectangle(
            640,    // centro X
            360,    // centro Y
            1100,   // largura
            260,    // altura
            0x000000,
            0.55
        );

        // Texto do livro
        const conteudo = 
`"Ars Magna" — o tratado que sistematiza os métodos
para resolver equações cúbicas e quárticas.

Compilado a partir dos resultados de matemáticos
como Niccolò Tartaglia e Scipione del Ferro,
marca um ponto de virada na matemática renascentista.`;

        // Centralização do texto
        this.texto = this.add.text(640, 360, conteudo, {
            fontFamily: 'serif',
            fontSize: '22px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 1000 }
        }).setOrigin(0.5);
    }

    // --- Clique 3 ---
    mostrarLivroZoom() {
        this.stage = 3;

        // Remover caixa de texto + fundo escurecido
        if (this.overlay) this.overlay.destroy();
        if (this.texto) this.texto.destroy();

        // Trocar para a imagem do livro ampliado
        this.background.setTexture('livroZoom');
        this.background.setScale(0.8);
    }
}
