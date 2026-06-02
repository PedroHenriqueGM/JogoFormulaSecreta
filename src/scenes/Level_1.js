import { DialogueManager }  from "../managers/DialogueManager.js";
import { Guard }            from "../entities/Guard.js";
import { Player }           from "../entities/Player.js";
import { AnimationManager } from "../managers/AnimationManager.js";
import { SaveManager }      from "../managers/SaveManager.js";
import { HUDManager }       from "../managers/HUDManager.js";
import { StoneSystem }      from "../managers/StoneSystem.js";
import { Stone }            from "../entities/Stone.js"; 

export class Level_1 extends Phaser.Scene {

    constructor() {
        super("Level_1");
    }

    create(data) {
        const spawnX = 32;
        const spawnY = 1024;

        this.input.keyboard.on("keydown-ESC", () => {
            if (!this.canMove) return;
            this.scene.pause();
            this.scene.launch("PauseMenu", { origemCena: this.scene.key });
        });

        this.bgMusic = this.sound.get("level1");
        if (!this.bgMusic) {
            this.bgMusic = this.sound.add("level1", { loop: true, volume: 0 });
        }

        this.dialogue = new DialogueManager(this);
        this.canMove  = false; 

        const map     = this.make.tilemap({ key: "level_1_map" });
        const tileset = map.addTilesetImage("tileset_1", "tileset");

        const ground       = map.createLayer("Tile Layer 3",  tileset, 0, 0);
        const objetos      = map.createLayer("Objetos",        tileset, 0, 0);
        const walls        = map.createLayer("Tile Layer 2",  tileset, 0, 0);
        const fire         = map.createLayer("Fogo",           tileset, 0, 0);
        const fireSurprise = map.createLayer("FogoSurpresa",  tileset, 0, 0);

        if (objetos) {
            objetos.setDepth(5);
            objetos.setCollisionByExclusion([-1, 0]);
        }

        this.fireSurpriseLayer = fireSurprise;

        this.anims.create({
            key: 'fire_burning',
            frames: this.anims.generateFrameNumbers('fire_anim', { start: 0, end: 1 }),
            frameRate: 6,
            repeat: -1
        });

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

        replaceFireWithSprite(fire, false);
        replaceFireWithSprite(fireSurprise, true);

        this.wallsLayer = walls;
        this.fireLayer  = fire;
        walls.setCollisionByExclusion([-1, 0]);

        this.player = new Player(this, spawnX, spawnY, "young_niccolo");
        this.physics.add.collider(this.player, walls);
        if (objetos) {
            this.physics.add.collider(this.player, objetos);
        }

        this.hud = new HUDManager(this, this.player);

        this.guardsGroup = this.physics.add.group();
        this.physics.add.collider(this.guardsGroup, walls);

        this.stoneSystem = new StoneSystem(this, this.player, this.wallsLayer, this.guardsGroup);

        const spawnsLayer = map.getObjectLayer('Spawns');
        if (spawnsLayer) {
            spawnsLayer.objects.forEach(obj => {
                
                if (obj.name === 'pedra') {
                    const stone = new Stone(this, obj.x, obj.y);
                    if(this.stoneSystem.groundStonesGroup) {
                        this.stoneSystem.groundStonesGroup.add(stone);
                    }
                }

                if (obj.name === 'guarda') {
                    const guard = new Guard(this, obj.x, obj.y, "guard", this.player, [], 64, "vertical");
                    this.guardsGroup.add(guard);
                }
            });
        }

        // ── LEITURA DOS GATILHOS ATUALIZADA (0, 1 e 2) ──
        const gatilhosLayer = map.getObjectLayer('Gatilhos');
        this.dialogueTriggers = [];
        
        if (gatilhosLayer) {
            gatilhosLayer.objects.forEach(obj => {
                
                // Só processa se o nome começar com "dialogo"
                if (obj.name && obj.name.startsWith('dialogo')) {
                    let textoDoTiled = "";
                    
                    if (obj.name === 'dialogo0') {
                        textoDoTiled = "> “Niccolò! Use a cabeça!\n> Faça o guarda olhar para outro lado!”";
                    } else if (obj.name === 'dialogo1') {
                        textoDoTiled = "> “Se eu lançar a pedra longe o bastante…\n> ele vai seguir o som.”";
                    } else if (obj.name === 'dialogo2') {
                        textoDoTiled = "> “Rápido, para dentro da igreja!\n> É o lugar mais seguro!”";
                    }

                    this.dialogueTriggers.push({
                        id: obj.name, 
                        rect: new Phaser.Geom.Rectangle(obj.x, obj.y, obj.width, obj.height),
                        activated: false,
                        text: textoDoTiled
                    });
                }
            });
        }

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

        AnimationManager.createCharacterAnims(this, "young_niccolo");
        AnimationManager.createCharacterAnims(this, "guard");

        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setRoundPixels(true);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys    = this.input.keyboard.addKeys("W,A,S,D");

        this.events.on("seen",       this.onPlayerCaught, this);
        this.events.on("playerDied", this.onPlayerDied,   this);

        if (!data?.isRestart && !data?.fromSave) {
            SaveManager.save({
                level:   'Level_1',
                playerX: spawnX,
                playerY: spawnY,
                health:  this.player.health
            });
        }

        if (data && data.fromSave) {
            const save = SaveManager.load();
            if (save) {
                this.player.setPosition(save.playerX, save.playerY);
                this.player.health = save.health;
            }
            if (!this.bgMusic.isPlaying) this.bgMusic.play();
            this.bgMusic.setVolume(0.5);
            this.canMove = true;
        }

        if (data && data.isRestart) {
            if (!this.bgMusic.isPlaying) this.bgMusic.play();
            this.bgMusic.setVolume(0.5);
            this.canMove = true;
        }
    }

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

    update() {
        if (!this.canMove) return;

        this.player.update(this.cursors, this.keys, this.canMove);
        this.hud.updateHearts();

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

        this.dialogueTriggers.forEach(trigger => {
            if (!trigger.activated && Phaser.Geom.Rectangle.Contains(trigger.rect, this.player.x, this.player.y)) {
                
                trigger.activated = true; 
                this.canMove = false;     

                this.player.setVelocity(0, 0);
                if (this.player.anims.isPlaying) this.player.anims.stop();

                this.dialogue.showDialogue(trigger.text, null, null, () => {
                    this.canMove = true; 
                });
            }
        });

        this.guardsGroup.getChildren().forEach(guard => guard.update());
        this.stoneSystem.update(this.hud);

        if(this.stoneSystem.getGroundStones) {
            this.hud.updatePrompts(this.stoneSystem.getGroundStones());
        }

        const tileFire = this.fireLayer.getTileAtWorldXY(this.player.x, this.player.y);
        let tileSurpriseFire = null;
        if (this.fireSurpriseLayer) {
            tileSurpriseFire = this.fireSurpriseLayer.getTileAtWorldXY(this.player.x, this.player.y);
        }

        const tomouDanoNormal   = tileFire         && tileFire.index !== -1;
        const tomouDanoSurpresa = tileSurpriseFire && tileSurpriseFire.index !== -1;

        if (tomouDanoNormal || tomouDanoSurpresa) {
            this.player.takeDamage(1, true, true);
        }
    }

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

    _freezeScene() {
        this.canMove = false;

        this.player.setVelocity(0);
        this.player.setTint(0xff0000);
        if (this.player.anims.isPlaying) this.player.anims.stop();
        this.player.setFrame(1);

        this.guardsGroup.getChildren().forEach(g => {
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
    }

    onPlayerCaught() {
        if (!this.canMove) return;

        this._freezeScene();

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

    onPlayerDied() {
        if (!this.canMove) return;

        this._freezeScene();
        this.hud.updateHearts();

        this.dialogue.showDialogue(
            "> Niccolò sucumbiu às chamas!",
            null,
            null,
            () => {
                this.scene.restart({ isRestart: true });
            },
        );
    }
}