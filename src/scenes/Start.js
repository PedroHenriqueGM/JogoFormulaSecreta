export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        this.load.image('quarto', 'assets/janela.png');
        this.load.image('livro', 'assets/livro.png');
        this.load.image('livroZoom', 'assets/livroZoom.png');
    }

    create() {
        this.stage = 0;
        this.background = this.add.image(640, 360, 'quarto');

        this.input.on('pointerdown', () => {
            if (this.stage === 0) {
                this.mostrarLivro();
            }
            else if (this.stage === 1) {
                this.mostrarTextoDoLivro();
            }
            else if (this.stage === 2) {
                this.mostrarLivroZoom();
            }
            else if (this.stage === 3) {
                this.mostrarCortinasETitulo();
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

        
        this.overlay = this.add.rectangle(
            640, 360, 1100, 260, 0x000000, 0.55
        );

        // Texto do livro
        const conteudo = 
`"Ars Magna" — o tratado que sistematiza os métodos
para resolver equações cúbicas e quárticas.

Compilado a partir dos resultados de matemáticos
como Niccolò Tartaglia e Scipione del Ferro,
marca um ponto de virada na matemática renascentista.`;

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

        
        if (this.overlay) this.overlay.destroy();
        if (this.texto) this.texto.destroy();

       
        this.background.setTexture('livroZoom');
        this.background.setScale(0.8);
    }


    criarCortinaEsquerda() {
        const graphics = this.add.graphics();
        
        
        graphics.fillStyle(0x8B0000);
        graphics.fillRect(0, 0, 400, 720);
        
        
        graphics.fillStyle(0x660000);
        for (let i = 0; i < 8; i++) {
            graphics.fillRect(50 + i * 45, 0, 20, 720);
        }
        
        
        graphics.fillStyle(0xDAA520);
        graphics.fillRect(0, 680, 400, 40);
        
        
        graphics.fillStyle(0xB8860B);
        for (let x = 0; x < 400; x += 8) {
            graphics.fillRect(x, 680, 4, 10);
        }
        
        graphics.generateTexture('cortinaEsquerda', 400, 720);
        graphics.destroy();
        
        return this.add.image(-200, 360, 'cortinaEsquerda').setOrigin(0.5).setScale(1.2);
    }

    
    criarCortinaDireita() {
        const graphics = this.add.graphics();
        
        
        graphics.fillStyle(0x8B0000);
        graphics.fillRect(0, 0, 400, 720);
        
       
        graphics.fillStyle(0x660000);
        for (let i = 0; i < 8; i++) {
            graphics.fillRect(330 - i * 45, 0, 20, 720);
        }
        
        
        graphics.fillStyle(0xDAA520);
        graphics.fillRect(0, 680, 400, 40);
        
        
        graphics.fillStyle(0xB8860B);
        for (let x = 0; x < 400; x += 8) {
            graphics.fillRect(x, 680, 4, 10);
        }
        
        graphics.generateTexture('cortinaDireita', 400, 720);
        graphics.destroy();
        
        return this.add.image(1480, 360, 'cortinaDireita').setOrigin(0.5).setScale(1.2);
    }

    
    mostrarCortinasETitulo() {
        this.stage = 4;

        
        this.curtainLeft = this.criarCortinaEsquerda();
        this.curtainRight = this.criarCortinaDireita();

        
        this.tweens.add({
            targets: this.curtainLeft,
            x: 320,
            duration: 1500,
            ease: 'Power2'
        });

        this.tweens.add({
            targets: this.curtainRight,
            x: 960,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                this.mostrarTitulo();
            }
        });
    }

    mostrarTitulo() {
        
        this.titulo = this.add.text(640, 260, 'A FÓRMULA SECRETA', {
            fontFamily: 'Georgia, serif',
            fontSize: '64px',
            color: '#ffffffff',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000',
                blur: 5,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [this.titulo],
            alpha: 1,
            duration: 2000,
            ease: 'Power2'
        });
    }
}
