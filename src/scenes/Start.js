export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        // Estaticos (320x180)
        this.load.image('fundo_cena1', 'assets/scene1.png');
        
        // Spritesheets (320x180)
        this.load.spritesheet('cortinasAnimadas', 'assets/curtains.png', { 
            frameWidth: 320, frameHeight: 180 
        });

        this.load.spritesheet('tituloAnimado', 'assets/start_texts.png', { 
            frameWidth: 320, frameHeight: 180 
        });

        // Assets antigos (Alta resolução)
        this.load.image('livroZoom', 'assets/livroZoom.png');
        this.load.spritesheet('livroAnimado', 'assets/Livro.png', { 
            frameWidth: 767, frameHeight: 511, spacing: 2
        });

        // trilha sonora
        this.load.audio('musicaIntro', 'assets/musica1.mp3');
    }

    create() {
        const { width, height } = this.scale;

        this.musica = this.sound.add('musicaIntro', { loop: true, volume: 0 });
        this.musica.play();

        // fade in da musica
        this.tweens.add({ targets: this.musica, volume: 0.5, duration: 2000 });

        this.criarAnimacoes();

        // --- MENU INICIAL ---
        this.fundoJogo = this.add.image(width/2, height/2, 'fundo_cena1');
        this.cortinaSprite = this.add.sprite(width/2, height/2, 'cortinasAnimadas');

        this.grupoInterface = this.add.group();
        
        const titulo = this.add.sprite(width/2, height/2, 'tituloAnimado', 0);
        const btnIniciar = this.add.sprite(width/2, height/2, 'tituloAnimado', 1).setInteractive({ cursor: 'pointer' });
        const btnContinuar = this.add.sprite(width/2, height/2, 'tituloAnimado', 2).setAlpha(0.5);
        const btnOpcoes = this.add.sprite(width/2, height/2, 'tituloAnimado', 3).setAlpha(0.5);

        this.grupoInterface.addMultiple([titulo, btnIniciar, btnContinuar, btnOpcoes]);

        // Interatividade
        btnIniciar.on('pointerover', () => btnIniciar.setTint(0xdddddd));
        btnIniciar.on('pointerout', () => btnIniciar.clearTint());
        
        btnIniciar.once('pointerdown', () => {
            this.iniciarHistoria();
        });
    }

    criarAnimacoes() {
        if (!this.anims.exists('abrir_cortina')) {
            this.anims.create({
                key: 'abrir_cortina',
                frames: this.anims.generateFrameNumbers('cortinasAnimadas', { start: 0, end: 3 }),
                frameRate: 8, repeat: 0
            });
        }
        if (!this.anims.exists('animacaoLivro')) {
            this.anims.create({
                key: 'animacaoLivro',
                frames: this.anims.generateFrameNumbers('livroAnimado', { start: 0, end: 3 }),
                frameRate: 5, repeat: -1
            });
        }
    }

    iniciarHistoria() {
        this.grupoInterface.setVisible(false);
        this.cortinaSprite.play('abrir_cortina');

        this.cortinaSprite.on('animationcomplete', () => {
            this.cortinaSprite.setVisible(false);
            
            // Delay antes de mostrar o livro
            this.time.delayedCall(2000, () => {
                this.mostrarLivro();
            });
        });
    }

    mostrarLivro() {
        const { width, height } = this.scale;

        this.livroAtivo = this.add.sprite(width / 2, height / 2, 'livroAnimado');
        this.livroAtivo.setDisplaySize(width, height); 
        this.livroAtivo.play('animacaoLivro');

        // avança para proxima cena (texto)
        this.time.delayedCall(4000, () => this.mostrarTextoDoLivro());
    }

    mostrarTextoDoLivro() {
        const { width, height } = this.scale;
        
        this.overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setAlpha(0);

        const conteudo = 
        `"Ars Magna" — o tratado que
        sistematiza equações cúbicas.

        Compilado por matemáticos
        como Tartaglia e Scipione.`;

       this.texto = this.add.text(width / 2, height / 2, conteudo, {
            fontFamily: '"VT323"', fontSize: '16px', color: '#ffffff',
            align: 'center', wordWrap: { width: width * 0.9 }
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [this.overlay, this.texto],
            alpha: 1, duration: 1000
        });

        // avança para proxima cena (zoom)
        this.time.delayedCall(6000, () => this.mostrarLivroZoom());
    }

    mostrarLivroZoom() {
        const { width, height } = this.scale;

        // limpeza
        if (this.fundoJogo) this.fundoJogo.destroy();
        if (this.livroAtivo) this.livroAtivo.destroy();
        if (this.overlay) this.overlay.destroy();
        if (this.texto) this.texto.destroy();

        this.imgZoom = this.add.image(width / 2, height / 2, 'livroZoom');
        
        // ajusta escala (cover)
        const scaleX = width / this.imgZoom.width;
        const scaleY = height / this.imgZoom.height;
        const scale = Math.max(scaleX, scaleY);
        this.imgZoom.setScale(scale);

        // Animação de zoom in
        this.tweens.add({
            targets: this.imgZoom,
            scaleX: this.imgZoom.scaleX * 1.1,
            scaleY: this.imgZoom.scaleY * 1.1,
            duration: 6000
        });

        // fim da intro
        this.time.delayedCall(5000, () => {
            console.log("Fim da Intro. Carregar Level 1.");
            // this.scene.start('Level_1');
        });
    }
}