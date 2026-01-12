export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        // Estaticos
        this.load.image('quarto', 'assets/janela.png');
        this.load.image('livroZoom', 'assets/livroZoom.png');


        // Spritesheets para livro e cortina 
        this.load.spritesheet('livroAnimado', 'assets/livro.png', { 
            frameWidth: 767, 
            frameHeight: 511,
            spacing: 2
        });

        this.load.spritesheet('cortinasAnimadas', 'assets/cortinas.png', { 
            frameWidth: 767, 
            frameHeight: 511,
            spacing: 2 
        });

        //trilha sonora
        this.load.audio('musicaIntro', 'assets/musica1.mp3');

        //aumenta o volume da musica com o tempo
        this.tweens.add({
        targets: this.musica,
        volume: 0.5,
        duration: 3000
    });
    }

    create() {

        const { width, height } = this.scale; 
        
        this.stage = 0;

        this.musica = this.sound.add('musicaIntro', {
            loop: true,   
            volume: 0.5   
        });

        this.musica.play({ seek: 12, volume: 0 }); 

        // fade in
        this.tweens.add({
            targets: this.musica,
            volume: 0.5,
            duration: 3000
        });
        
        this.background = this.add.image(width / 2, height / 2, 'quarto');
        this.background.setDisplaySize(width, height);

        // Animação lenta da igreja
        this.tweens.add({
            targets: this.background,
            scaleX: this.background.scaleX * 1.10, //zoom de 10%
            scaleY: this.background.scaleY * 1.10,
            duration: 8000,
            yoyo: true,
            repeat: -1
        });

        // avança para proxima cena em 5 segundos
        this.agendarProximaCena(5000);

        // pode avançar tambem por clique se o usuario quiser tambem
        this.input.on('pointerdown', () => {
            this.avancarCena();
        });
    }

    // Função para passar de cena 
    agendarProximaCena(tempo) {
        if (this.timerEvento) this.timerEvento.remove(); // Limpa o timer da cena anterior
        this.timerEvento = this.time.delayedCall(tempo, () => this.avancarCena());
    }

    avancarCena() {
        if (this.stage === 0) {
            this.mostrarLivro();
        } else if (this.stage === 1) {
            this.mostrarTextoDoLivro();
        } else if (this.stage === 2) {
            this.mostrarLivroZoom();
        } else if (this.stage === 3) {
            this.mostrarCortinasETitulo();
        }
    }

    // Animação do livro e da vela se mexendo 
    mostrarLivro() {
        this.stage = 1;
        this.background.setVisible(false); // Esconde a igreja

        const { width, height } = this.scale;

        // Criar animação do livro folheando
        if (!this.anims.exists('animacaoLivro')) {
            this.anims.create({
                key: 'animacaoLivro',
                frames: this.anims.generateFrameNumbers('livroAnimado', { start: 0, end: 3 }),//sao 4 frames
                frameRate: 5,
                repeat: -1
            });
        }

        this.livroAtivo = this.add.sprite(width / 2, height / 2, 'livroAnimado');
        
        this.livroAtivo.setDisplaySize(width, height);
        this.livroAtivo.play('animacaoLivro');

        this.agendarProximaCena(5000);
    }

    // passa para o texto da ars magna 
    mostrarTextoDoLivro() {
        this.stage = 2;
        const { width, height } = this.scale;
        this.overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6).setAlpha(0);

        const conteudo = 
        `"Ars Magna" — o tratado que sistematiza os métodos
        para resolver equações cúbicas e quárticas.

        Compilado a partir dos resultados de matemáticos
        como Niccolò Tartaglia e Scipione del Ferro.`;

       this.texto = this.add.text(width / 2, height / 2, conteudo, {
            fontFamily: '"VT323"', 
            fontSize: '18px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 5,
            wordWrap: { width: width * 0.9 } // margem de segurança
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [this.overlay, this.texto],
            alpha: 1,
            duration: 1000
        });

        this.agendarProximaCena(7000);
    }

    // imagem fixa do zoom dos algoritmos ( a mudar )
   mostrarLivroZoom() {
        this.stage = 3;
        const { width, height } = this.scale;

        // limpeza
        if (this.background) this.background.destroy();
        if (this.overlay) this.overlay.destroy();
        if (this.texto) this.texto.destroy();
        if (this.livroAtivo) this.livroAtivo.destroy();

        // background novo centralizado
        this.background = this.add.image(width / 2, height / 2, 'livroZoom');

        // lógica para preencher a tela sem distorcer
        const scaleX = width / this.background.width;
        const scaleY = height / this.background.height;
        const scale = Math.max(scaleX, scaleY);
        this.background.setScale(scale);

        this.tweens.add({
            targets: this.background,
            scaleX: this.background.scaleX * 1.06,
            scaleY: this.background.scaleY * 1.06,
            duration: 6000,
            ease: 'Cubic.easeInOut'
        });

        this.agendarProximaCena(5000);
    }

    // animaçaõ das cortinas ( a melhorar )
    mostrarCortinasETitulo() {
        this.stage = 4;
        if (this.timerEvento) this.timerEvento.remove();

       if (!this.anims.exists('fecharCortinas')) {
            this.anims.create({
                key: 'fecharCortinas',
                frames: this.anims.generateFrameNumbers('cortinasAnimadas', { start: 0, end: 3 }),
                frameRate: 4, // velocidade para fechar de forma suave
                repeat: 0    
            });
        }

        const { width, height } = this.scale;
        this.cortinaSprite = this.add.sprite(width / 2, height / 2, 'cortinasAnimadas');
        this.cortinaSprite.setDisplaySize(width, height);

        this.cortinaSprite.play('fecharCortinas');
        this.cortinaSprite.on('animationcomplete', () => {
        this.mostrarTitulo();
        });
    }

    mostrarTitulo() {
        const { width, height } = this.scale;

        this.titulo = this.add.text(width / 2, height / 2, 'A FÓRMULA SECRETA', {
            fontFamily: '"VT323"',
            fontSize: '60px', 
            color: '#ffffffff',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ 
            targets: this.titulo,
            alpha: 1,
            y: height / 2, 
            duration: 2000,
            ease: 'Back.easeOut'
        });
    }

    
}
