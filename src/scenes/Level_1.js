export class Level_1 extends Phaser.Scene {



    constructor() {
        super('Level_1');
    }

    preload() {
        // carregando mapa tilemap em formato JSON
        this.load.image('tiles', 'assets/mapas/Set 1.png');
        this.load.tilemapTiledJSON('level_1_map', 'assets/mapas/map.json');

        // carregando sprite do player
        this.load.spritesheet('player', 'assets/player/tartaglia_crianca.png', {frameWidth: 32, frameHeight: 32});
    }

    create() {
        const { width, height } = this.scale;
        const spawnX = 55;
        const spawnY = 30;

        this.canMove = false;

        // Fade in ao entrar na cena
        this.cameras.main.fadeIn(1000);

        this.cameras.main.once('camerafadeincomplete', () => {
            this.showIntroText();
        })

        const map = this.make.tilemap({key: 'level_1_map' });
        const tileset = map.addTilesetImage('set 1', 'tiles');

        const ground = map.createLayer('chao', tileset, 0, 0);
        const walls = map.createLayer('paredes', tileset, 0, 0);

        // colocando o player no mapa
        this.player = this.physics.add.sprite(spawnX, spawnY, 'player');

        // ajustes básicos
        this.player.body.setSize(18, 12);
        this.player.body.setOffset(7,20);
        this.player.setDepth(10); // pra ficar na frente de tudo

        // colidindo com paredes
        walls.setCollisionByProperty({ collider: true });
        this.physics.add.collider(this.player, walls);

        // câmera seguindo o player
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // controles do player
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D');

        // debug das colisões
        this.physics.world.createDebugGraphic();

        // animações do player
        this.anims.create({
            key: 'walk_up_left',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1 // loop infinito
        })

        this.anims.create({
            key: 'walk_up_right',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1 // loop infinito
        })

        this.anims.create({
            key: 'walk_down_left',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1 // loop infinito
        })

        this.anims.create({
            key: 'walk_down_right',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1 // loop infinito
        })

        this.anims.create({
            key: 'walk_down',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1 // loop infinito
        })

        this.anims.create({
            key: 'walk_left',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1 // loop infinito
        })

        this.anims.create({
            key: 'walk_right',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1 // loop infinito
        })

        this.anims.create({
            key: 'walk_up',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1 // loop infinito
        })
    }

    update() {
        if (!this.canMove) {
            this.player.setVelocity(0);
            return;
        }

        const speed = 100;
        this.player.setVelocity(0);

        // movimentação com setas ou WASD
        let left = this.cursors.left.isDown || this.keys.A.isDown;
        let right = this.cursors.right.isDown || this.keys.D.isDown;
        let up = this.cursors.up.isDown || this.keys.W.isDown;
        let down = this.cursors.down.isDown || this.keys.S.isDown;

        if (left) {
            this.player.setVelocityX(-speed);
        } else if (right) {
            this.player.setVelocityX(speed);
        }

        if (up) {
            this.player.setVelocityY(-speed);
        } else if (down) {
            this.player.setVelocityY(speed);
        }

        // ANIMAÇÃO - DIAGONAIS
        if (left && up) {
            this.player.anims.play('walk_up_left', true);
        } else if (right && up) {
            this.player.anims.play('walk_up_right', true);
        } else if (left && down) {
            this.player.anims.play('walk_down_left', true);
        } else if (right && down) {
            this.player.anims.play('walk_down_right', true);
        }

        // DIREÇÕES SIMPLES
        else if (up) {
            this.player.anims.play('walk_up', true);
        } else if (down) {
            this.player.anims.play('walk_down', true);
        } else if (left) {
            this.player.anims.play('walk_left', true);
        } else if (right) {
            this.player.anims.play('walk_right', true);
        }

        // se não estiver se movendo, para a animação
        if (!left && !right && !up && !down) {
            this.player.anims.stop();
            this.player.setFrame(0);
        }
    }

    showIntroText() {

        const lines = [
            "> Brescia, Itália, 1512.",
            "> Um menino corre entre chamas e espadas.",
            "> Seu nome é Niccolò Fontana.",
            "> O mundo logo o chamará de Tartaglia."
        ]

        const text = lines.join('\n');;

        const width = this.scale.width;
        const height = this.scale.height;

        const boxHeight = 80;
        const boxWidth = width - 40;
        const boxY = height - 97;

        // fundo da caixa
        const box = this.add.rectangle(
            width / 2, 
            boxY, 
            boxWidth, 
            boxHeight, 
            0x000000, 
            0.8
        ).setScrollFactor(0).setDepth(101);

        const border = this.add.rectangle(
            width / 2,
            boxY,
            boxWidth,
            boxHeight,
        ).setScrollFactor(0).setDepth(102);

        border.setStrokeStyle(2, 0xffffff);

        // texto
        const message = this.add.text(
            40, 
            height - 130,
            '',
            {
                fontFamily: 'serif',
                fontSize: '12px',
                color: '#ffffff',
                wordWrap: { width: width - 75 }
            }
        ).setScrollFactor(0).setDepth(102);

        // efeito de máquina de escrever
        let i = 0;
        this.time.addEvent({
            delay: 30,
            repeat: text.length - 1,
            callback: () => {
                message.text += text[i];
                i++;
            }
        });

        // espera clique para remover o texto
        this.input.once('pointerdown', () => {
            box.destroy();
            border.destroy();
            message.destroy();
            this.canMove = true;
        });
    }

}
