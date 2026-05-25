import { DialogueManager } from "../managers/DialogueManager.js";
import { Guard } from "../entities/Guard.js";
import { Player } from "../entities/Player.js";
import { AnimationManager } from "../managers/AnimationManager.js";
import { SaveManager } from "../managers/SaveManager.js";
import { Stone } from "../entities/Stone.js";

export class Level_1 extends Phaser.Scene {
    // construtor da cena
    constructor() {
        super("Level_1");
    }

    // carrega tudo que a fase vai precisar antes de começar
    preload() {
        // mapas
        this.load.image("tileset", "assets/maps/tileset_1.png");
        this.load.tilemapTiledJSON("level_1_map", "assets/maps/map_1.json");

        // sprites
        this.load.spritesheet("young_niccolo", "assets/entities/young_niccolo.png", { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet("guard", "assets/entities/guard.png", { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('hearts', 'assets/ui/hearts.png', { frameWidth: 14, frameHeight: 12 });
        this.load.spritesheet("npc_fugitivo", "assets/entities/npc_fugitivo.png", { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet("fire_anim", "assets/entities/fire_anim.png", { frameWidth: 32, frameHeight: 32 });

        // audio
        this.load.audio("level1", "assets/audio/level1.wav");
        this.load.audio("voice_a", "assets/audio/voices/voice1/voice_a.wav");
        this.load.audio("voice_e", "assets/audio/voices/voice1/voice_e.wav");
        this.load.audio("voice_i", "assets/audio/voices/voice1/voice_i.wav");
        this.load.audio("voice_o", "assets/audio/voices/voice1/voice_o.wav");
        this.load.audio("voice_u", "assets/audio/voices/voice1/voice_u.wav");
        
        // ui e itens
        this.load.image('menu_box', 'assets/ui/menu_box.png');
        this.load.image('stone', 'assets/ui/stone.png');
    }

    // cria os elementos na tela
    create(data) {
        const { width, height } = this.scale;
        const spawnX = 32;
        const spawnY = 1024;

        // esc para abrir o pause
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.input.keyboard.on("keydown-ESC", () => {
            if(!this.canMove) return; 
            this.scene.pause();
            this.scene.launch("PauseMenu", { origemCena: this.scene.key });
        })

        // config da musica
        this.bgMusic = this.sound.get("level1");
        if (!this.bgMusic) {
            this.bgMusic = this.sound.add("level1", { loop: true, volume: 0 });
        }

        this.dialogue = new DialogueManager(this);
        this.canMove = false;

        // carrega o mapa do tiled
        const map = this.make.tilemap({ key: "level_1_map" });
        const tileset = map.addTilesetImage("tileset_1", "tileset");

        const ground = map.createLayer("Tile Layer 3", tileset, 0, 0);
        
        const objetos = map.createLayer("Objetos", tileset, 0, 0);
        if (objetos) {
            objetos.setDepth(5);
            objetos.setCollisionByExclusion([-1, 0]);
        }

        const walls = map.createLayer("Tile Layer 2", tileset, 0, 0);
        const fire = map.createLayer("Fogo", tileset, 0, 0);
        
        const fireSurprise = map.createLayer("FogoSurpresa", tileset, 0, 0); 
        this.fireSurpriseLayer = fireSurprise;

        //animação do fogo
        this.anims.create({
            key: 'fire_burning',
            frames: this.anims.generateFrameNumbers('fire_anim', { start: 0, end: 1 }),
            frameRate: 6,
            repeat: -1
        });

        //troca o bloco de fogo do tiled pela animaçao
        const replaceFireWithSprite = (layer, isSurprise) => {
            if (!layer) return;
            layer.forEachTile(tile => {
                if (tile && tile.index !== -1) {
                    const sprite = this.add.sprite(tile.pixelX + 16, tile.pixelY + 16, 'fire_anim');
                    sprite.play('fire_burning');
                    sprite.setDepth(4); 

                    if (isSurprise) {
                        sprite.setAlpha(0); 
                        tile.isHiddenFire = true; 
                    }

                    tile.animatedSprite = sprite; 
                    tile.alpha = 0; 
                }
            });
        };

        // aplica animaçao nas duas camadas de fogo
        replaceFireWithSprite(fire, false);
        replaceFireWithSprite(fireSurprise, true);

        this.wallsLayer = walls;
        walls.setCollisionByExclusion([-1, 0]);

        this.fireLayer = fire;

        // cria o player e a colisão
        this.player = new Player(this, spawnX, spawnY, "young_niccolo");
        this.physics.add.collider(this.player, walls);
        if (objetos) {
            this.physics.add.collider(this.player, objetos);
        }

        // cria os coraçoes da vida na tela
        this.heartsGroup = []; 
        const maxHearts = Math.floor(this.player.maxHealth / 2); 
        
        for (let i = 0; i < maxHearts; i++) {
            const heart = this.add.sprite(16 + (i * 18), 16, 'hearts', 2) 
                .setScrollFactor(0)
                .setDepth(100)
                .setOrigin(0, 0);
                
            this.heartsGroup.push(heart);
        }

        this.updateHeartsHUD();

        // ui das pedras (icone + texto)
        this.stoneIcon = this.add.image(16, 36, 'stone')
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(100)
            .setVisible(false);

        this.stonesText = this.add.bitmapText(36, 35, 'pixelFont', 'x 0', 16)
            .setTint(0xcccccc) 
            .setScrollFactor(0) 
            .setDepth(100)
            .setVisible(false);

        this.updateStonesHUD();

        // aviso de apertar E pra pegar
        this.collectPrompt = this.add.bitmapText(0, 0, 'pixelFont', '[E] Pegar', 16)
            .setOrigin(0.5, 1) 
            .setDepth(200)       
            .setVisible(false);  

        // aviso de apertar F pra mirar
        this.throwPrompt = this.add.bitmapText(16, 56, 'pixelFont', '[F] Segure para mirar', 16)
            .setTint(0xffdd88)  
            .setScrollFactor(0) 
            .setDepth(100)
            .setVisible(false); 

        // graficos do rastro da pedra
        this.trajectoryGraphics = this.add.graphics();
        this.trajectoryGraphics.setDepth(150); 

        // cria o grupo de guardas
        this.guardsGroup = this.physics.add.group();

        const guard1Limits = {
            minX: 150,
            maxX: 400,
            minY: 50,
            maxY: 150,
        };

        const guard1 = new Guard(this, 160, 1024, "guard", this.player, [], 64, "vertical");
        this.guardsGroup.add(guard1);

        const guard2 = new Guard(this, 600, 800, "guard", this.player, [], 32);
        this.guardsGroup.add(guard2);

        this.physics.add.collider(this.guardsGroup, walls);
        if (objetos) {
            this.physics.add.collider(this.guardsGroup, objetos);
        }

        // cria os npcs correndo em panico
        this.npcsGroup = this.physics.add.group();
        this.physics.add.collider(this.npcsGroup, walls);
        if (objetos) {
            this.physics.add.collider(this.npcsGroup, objetos);
        }

        const npcPositions = [
            { x: 300, y: 950 },
            { x: 350, y: 900 },
            { x: 400, y: 980 }
        ];

        npcPositions.forEach(pos => {
            const npc = this.npcsGroup.create(pos.x, pos.y, 'npc_fugitivo');
            npc.setBounce(1); 
            npc.setCollideWorldBounds(true); 
            npc.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
        });

        // pedras q ficam caidas no chao
        this.groundStonesGroup = this.physics.add.group();
        this.flyingStonesGroup = this.physics.add.group();

        const stonePositions = [
            { x: 80,  y: 1024 },
            { x: 200, y: 990  },
            { x: 400, y: 850  },
            { x: 550, y: 800  },
        ];

        stonePositions.forEach(pos => {
            const stone = new Stone(this, pos.x, pos.y);
            this.groundStonesGroup.add(stone);
        });

        // destroi a pedra se ela bater na parede
        this.physics.add.collider(this.flyingStonesGroup, walls, (stone) => {
            stone.onHitWall();
        });

        // define as teclas do teclado
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        this.collectCooldown  = false;
        this.throwCooldown    = false;

        // escuta quando a pedra faz barulho
        this.events.on('stoneLanded', ({ x, y }) => {
            this.onStoneLanded(x, y);
        });

        // escuta interaçoes do player
        this.events.on("seen", this.onPlayerCaught, this);
        this.events.on("playerDied", this.onPlayerDied, this);

        // cria as animacoes da cena
        AnimationManager.createCharacterAnims(this, "young_niccolo");
        AnimationManager.createCharacterAnims(this, "guard");

        // faz a camera seguir o personagem
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setRoundPixels(true);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D");

        // sistema de save qndo entra no level
        if (!data?.isRestart && !data?.fromSave) {
            SaveManager.save({
                level: 'Level_1',
                playerX: spawnX,
                playerY: spawnY,
                health: this.player.health
            });
        }

        // restaura se der continuar
        if(data && data.fromSave) {
            const save = SaveManager.load();
            if (save) {
                this.player.setPosition(save.playerX, save.playerY);
                this.player.health = save.health;
            }
            if (!this.bgMusic.isPlaying) this.bgMusic.play();
            this.bgMusic.setVolume(0.5);
            this.canMove = true;
        }

        // volta pro comeco qndo morre
        if (data && data.isRestart) {
            if (!this.bgMusic.isPlaying) {
                this.bgMusic.play(); 
            }

            this.bgMusic.setVolume(0.5);
            this.canMove = true;
        }
    }

    // da o play na musica e solta o texto do começo
    iniciarCutscene() {
        if (!this.bgMusic.isPlaying) {
            this.bgMusic.play(); 
        }

        this.tweens.add({
            targets: this.bgMusic,
            volume: 0.5,
            duration: 4000,
        });

        this.time.delayedCall(2000, () => {
            this.showIntroText();
        });
    }

    // roda a cada frame, controla interacoes e movimentacao
    update() {
        if (!this.canMove) return;
        this.player.update(this.cursors, this.keys, this.canMove);

        this.updateHeartsHUD();
        
        // ativa o fogo escondido qndo chega perto
        if (this.fireSurpriseLayer) {
            const tileX = this.fireSurpriseLayer.worldToTileX(this.player.x);
            const tileY = this.fireSurpriseLayer.worldToTileY(this.player.y);

            for (let x = tileX - 1; x <= tileX + 1; x++) {
                for (let y = tileY - 1; y <= tileY + 1; y++) {
                    const tile = this.fireSurpriseLayer.getTileAt(x, y);
                    
                    if (tile && tile.index !== -1 && tile.isHiddenFire) {
                        tile.isHiddenFire = false; 
                        
                        if (tile.animatedSprite) {
                            tile.animatedSprite.setAlpha(1); 
                        }
                    }
                }
            }
        }

        this.guardsGroup.getChildren().forEach((guard) => {
            guard.update();
        });

        this.flyingStonesGroup.getChildren().forEach((stone) => {
            stone.update();
        });

        // checa arremesso e coleta
        if (Phaser.Input.Keyboard.JustDown(this.keyE) && !this.collectCooldown) {
            this.tryCollectStone();
        }

        if (this.keyF.isDown && this.player.stonesCarried > 0) {
            this.updateTrajectory();
        } else {
            this.trajectoryGraphics.clear();
        }

        if (Phaser.Input.Keyboard.JustUp(this.keyF) && !this.throwCooldown) {
            this.tryThrowStone();
        }

        this.updatePrompts();

        // da dano se o player pisar em qualquer dos fogos
        const tileFire = this.fireLayer.getTileAtWorldXY(this.player.x, this.player.y);
        let tileSurpriseFire = null;
        if (this.fireSurpriseLayer) {
            tileSurpriseFire = this.fireSurpriseLayer.getTileAtWorldXY(this.player.x, this.player.y);
        }

        const tomouDanoNormal = tileFire && tileFire.index !== -1;
        const tomouDanoSurpresa = tileSurpriseFire && tileSurpriseFire.index !== -1;

        if (tomouDanoNormal || tomouDanoSurpresa) {
            this.player.takeDamage(1, true, true);
        }
    }

    // desenha os pontinhos indicando onde a pedra vai cair
    updateTrajectory() {
        const g = this.trajectoryGraphics;
        g.clear(); 

        const dirVectors = {
            up:    { dx: 0,  dy: -1 },
            down:  { dx: 0,  dy:  1 },
            left:  { dx: -1, dy:  0 },
            right: { dx:  1, dy:  0 }
        };

        const dir = dirVectors[this.player.lastDirection] || dirVectors['right'];

        const maxDistance = 200; 
        const dotSpacing  = 14;  
        const dotRadius   = 2.5; 
        const step        = 2;   

        let rayX = this.player.x;
        let rayY = this.player.y;

        let distanceSoFar = 0;
        let nextDotAt     = dotSpacing;

        // faz um raio ate bater numa parede
        while (distanceSoFar < maxDistance) {
            rayX += dir.dx * step;
            rayY += dir.dy * step;
            distanceSoFar += step;

            const tile = this.wallsLayer.getTileAtWorldXY(rayX, rayY);
            if (tile) break; 

            if (distanceSoFar >= nextDotAt) {
                const progress = distanceSoFar / maxDistance;
                const alpha    = 1 - progress * 0.6;          

                g.fillStyle(0xffffff, alpha);
                g.fillCircle(rayX, rayY, dotRadius);

                nextDotAt += dotSpacing; 
            }
        }

        g.fillStyle(0xffdd88, 0.8); 
        g.fillCircle(rayX, rayY, 4);
    }

    // gerencia qndo os textos de apertar E e F devem aparecer
    updatePrompts() {
        const collectRadius = 40; 

        let closestStone = null;
        let closestDist  = Infinity;

        this.groundStonesGroup.getChildren().forEach(stone => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                stone.x, stone.y
            );
            if (dist <= collectRadius && dist < closestDist) {
                closestDist  = dist;
                closestStone = stone;
            }
        });

        if (closestStone) {
            this.collectPrompt.setPosition(closestStone.x, closestStone.y - 16);
            this.collectPrompt.setVisible(true);
        } else {
            this.collectPrompt.setVisible(false);
        }

        this.throwPrompt.setVisible(this.player.stonesCarried > 0);
    }

    // ve se tem uma pedra perto pra por no inventario
    tryCollectStone() {
        const collectRadius = 40; 
        const stones = this.groundStonesGroup.getChildren();

        let closestStone = null;
        let closestDist  = Infinity;

        stones.forEach(stone => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                stone.x, stone.y
            );
            if (dist <= collectRadius && dist < closestDist) {
                closestDist  = dist;
                closestStone = stone;
            }
        });

        if (closestStone && this.player.collectStone()) {
            closestStone.destroy(); 
            this.updateStonesHUD();  
        }

        this.collectCooldown = true;
        this.time.delayedCall(200, () => { this.collectCooldown = false; });
    }

    // lança a pedra na direcao q o player ta olhando
    tryThrowStone() {
        if (!this.player.canThrowStone()) return;

        this.updateStonesHUD();

        const stone = new Stone(this, this.player.x, this.player.y);
        this.flyingStonesGroup.add(stone);
        stone.throw(this.player.lastDirection);

        this.throwCooldown = true;
        this.time.delayedCall(400, () => { this.throwCooldown = false; });
    }

    // avisa os guardas proximos 
    onStoneLanded(x, y) {
        const soundRadius = 150;

        this.guardsGroup.getChildren().forEach(guard => {
            const dist = Phaser.Math.Distance.Between(
                guard.x, guard.y,
                x, y
            );

            if (dist <= soundRadius) {
                guard.investigate(x, y);
            }
        });
    }

    // esconde a ui se nao tiver pedra, ou mostra a quantidade q tem
    updateStonesHUD() {
        const pedras = this.player.stonesCarried;

        if (pedras > 0) {
            this.stoneIcon.setVisible(true);
            this.stonesText.setVisible(true);
            this.stonesText.setText(`x ${pedras}`);
        } else {
            this.stoneIcon.setVisible(false);
            this.stonesText.setVisible(false);
        }
    }

    // textos do tutorial q passam na tela
    showIntroText() {
        const lines = [
        "> Brescia, Itália, 1512.",
        "> Um menino corre entre chamas e espadas.",
        "> Seu nome é Niccolò Fontana.",
        "> O mundo logo o chamará de Tartaglia.",
        ];
        const text = lines.join("\n");

        this.dialogue.showDialogue(text, null, null, () => {
        this.canMove = true;
        });
    }

    // qndo o guarda acha o player
    onPlayerCaught() {
        if (!this.canMove) return; 

        this.canMove = false;

        this.player.setVelocity(0);
        this.player.setTint(0xff0000);

        if (this.player.anims.isPlaying) this.player.anims.stop();
        this.player.setFrame(1); 

        // desliga os guardas p nao virarem e continuarem olhando
        this.guardsGroup.getChildren().forEach((g) => {
            g.isActive = false; 

            if (g.body) {
                g.body.setVelocity(0, 0);
                g.body.moves = false; 
            }

            if (g.anims.isPlaying) {
                g.anims.stop();
                g.setFrame(1); 
            }
        });

        const restartTimeout = this.time.delayedCall(5000, () => {
            this.scene.restart({ isRestart: true });
        });

        this.dialogue.showDialogue(
            "> Você foi visto pelos guardas!",
            null,
            null,
            () => {
                restartTimeout.remove();
                this.scene.restart({ isRestart: true });
            },
        );
    }

    //dano pelo fogo
    handlePlayerFire(player, tile) {
        player.takeDamage(1, true, true);
    }

    // qndo zera os coracoes e morre
    onPlayerDied() {
        if (!this.canMove) return; 

        this.canMove = false;

        this.updateHeartsHUD();

        this.player.setVelocity(0);
        this.player.setTint(0xff0000);

        if (this.player.anims.isPlaying) this.player.anims.stop();
        this.player.setFrame(1); 

        this.guardsGroup.getChildren().forEach((g) => {
            g.isActive = false;

            if (g.body) {
                g.body.setVelocity(0, 0);
                g.body.moves = false;
            }

            if (g.anims.isPlaying) {
                g.anims.stop();
                g.setFrame(1);
            }
        });

        this.dialogue.showDialogue(
            "> Niccolò sucumbiu às chamas!",
            null,
            null,
            () => {
                this.scene.restart({ isRestart: true });
            },
        );
    }

    // checa qnto tem de vida p botar os coracoes certos (cheio, meio ou vazio)
    updateHeartsHUD() {
        const health = this.player.health;

        this.heartsGroup.forEach((heart, index) => {
            const heartValue = index * 2; 

            if (health >= heartValue + 2) {
                heart.setFrame(0); 
            } else if (health === heartValue + 1) {
                heart.setFrame(1); 
            } else {
                heart.setFrame(2); 
            }
        });
    }
}