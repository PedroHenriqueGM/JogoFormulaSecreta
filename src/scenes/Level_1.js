import { DialogueManager } from "../managers/DialogueManager.js";
import { Guard }            from "../entities/Guard.js";
import { Player }           from "../entities/Player.js";
import { AnimationManager } from "../managers/AnimationManager.js";
import { SaveManager }      from "../managers/SaveManager.js";
import { HUDManager }       from "../managers/HUDManager.js";
import { StoneSystem }      from "../managers/StoneSystem.js";

export class Level_1 extends Phaser.Scene {

    // construtor da cena
    constructor() {
        super("Level_1");
    }

    // cria todos os elementos da fase
    create(data) {
        const spawnX = 32;
        const spawnY = 1024;

        // ── Tecla ESC → abre o menu de pausa ──────────────────────────
        this.input.keyboard.on("keydown-ESC", () => {
            if (!this.canMove) return;
            this.scene.pause();
            this.scene.launch("PauseMenu", { origemCena: this.scene.key });
        });

        // ── Música de fundo ────────────────────────────────────────────
        // Reutiliza a instância se ela já existir (para evitar sobreposição)
        this.bgMusic = this.sound.get("level1");
        if (!this.bgMusic) {
            this.bgMusic = this.sound.add("level1", { loop: true, volume: 0 });
        }

        // ── Managers de cena ───────────────────────────────────────────
        this.dialogue = new DialogueManager(this);
        this.canMove  = false; // travado até a cutscene inicial terminar

        // ── Mapa (Tiled) ───────────────────────────────────────────────
        // Carrega o mapa e cria as camadas individualmente por nome
        const map     = this.make.tilemap({ key: "level_1_map" });
        const tileset = map.addTilesetImage("tileset_1", "tileset");

        const ground       = map.createLayer("Tile Layer 3",  tileset, 0, 0);
        const objetos      = map.createLayer("Objetos",        tileset, 0, 0);
        const walls        = map.createLayer("Tile Layer 2",  tileset, 0, 0);
        const fire         = map.createLayer("Fogo",           tileset, 0, 0);
        const fireSurprise = map.createLayer("FogoSurpresa",  tileset, 0, 0);

        // Configura a camada de objetos: fica na frente e tem colisão
        if (objetos) {
            objetos.setDepth(5);
            objetos.setCollisionByExclusion([-1, 0]);
        }

        // Guarda referência da camada de fogo surpresa para usar no update()
        this.fireSurpriseLayer = fireSurprise;

        // ── Animação do fogo ───────────────────────────────────────────
        this.anims.create({
            key: 'fire_burning',
            frames: this.anims.generateFrameNumbers('fire_anim', { start: 0, end: 1 }),
            frameRate: 6,
            repeat: -1
        });

        // Substitui os tiles de fogo do Tiled por sprites animados
        const replaceFireWithSprite = (layer, isSurprise) => {
            if (!layer) return;
            layer.forEachTile(tile => {
                if (tile && tile.index !== -1) {
                    const sprite = this.add.sprite(tile.pixelX + 16, tile.pixelY + 16, 'fire_anim');
                    sprite.play('fire_burning');
                    sprite.setDepth(4);

                    if (isSurprise) {
                        sprite.setAlpha(0);        // fogo surpresa começa invisível
                        tile.isHiddenFire = true;  // marcado para ser revelado ao aproximar
                    }

                    tile.animatedSprite = sprite; // referência para revelar depois
                    tile.alpha = 0;               // esconde o tile original do Tiled
                }
            });
        };

        replaceFireWithSprite(fire, false);
        replaceFireWithSprite(fireSurprise, true);

        // Guarda referências das camadas importantes para uso no update()
        this.wallsLayer = walls;
        this.fireLayer  = fire;
        walls.setCollisionByExclusion([-1, 0]);

        // ── Player ────────────────────────────────────────────────────
        this.player = new Player(this, spawnX, spawnY, "young_niccolo");
        this.physics.add.collider(this.player, walls);
        if (objetos) {
            this.physics.add.collider(this.player, objetos);
        }

        // ── HUD (interface visual) ─────────────────────────────────────
        // Corações de vida, contador de pedras e prompts [E]/[F]
        this.hud = new HUDManager(this, this.player);

        // ── Guardas ────────────────────────────────────────────────────
        this.guardsGroup = this.physics.add.group();

        // Guarda 1: patrulha vertical perto do spawn
        const guard1 = new Guard(this, 160, 1024, "guard", this.player, [], 64, "vertical");
        this.guardsGroup.add(guard1);

        // Guarda 2: patrulha horizontal numa área mais ao centro
        const guard2 = new Guard(this, 600, 800, "guard", this.player, [], 32);
        this.guardsGroup.add(guard2);

        this.physics.add.collider(this.guardsGroup, walls);
        if (objetos) {
            this.physics.add.collider(this.guardsGroup, objetos);
        }

        // ── NPCs em pânico ─────────────────────────────────────────────
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

        // ── Sistema de Pedras ──────────────────────────────────────────
        // Gerencia spawn, coleta, arremesso, trajetória e alerta de guardas
        this.stoneSystem = new StoneSystem(this, this.player, this.wallsLayer, this.guardsGroup);

        // ── Animações dos personagens ──────────────────────────────────
        AnimationManager.createCharacterAnims(this, "young_niccolo");
        AnimationManager.createCharacterAnims(this, "guard");

        // ── Câmera ─────────────────────────────────────────────────────
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setRoundPixels(true);

        // Teclas de movimento (repassadas ao player.update() a cada frame)
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys    = this.input.keyboard.addKeys("W,A,S,D");

        // ── Eventos de estado do player ────────────────────────────────
        this.events.on("seen",       this.onPlayerCaught, this);
        this.events.on("playerDied", this.onPlayerDied,   this);

        // ── Sistema de Save ────────────────────────────────────────────
        // Salva automaticamente ao entrar no nível pela primeira vez
        if (!data?.isRestart && !data?.fromSave) {
            SaveManager.save({
                level:   'Level_1',
                playerX: spawnX,
                playerY: spawnY,
                health:  this.player.health
            });
        }

        // Restaura posição e vida ao clicar em "Continuar" no menu
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

        // Reinicia direto no modo jogável ao morrer/ser capturado
        if (data && data.isRestart) {
            if (!this.bgMusic.isPlaying) this.bgMusic.play();
            this.bgMusic.setVolume(0.5);
            this.canMove = true;
        }
    }

    // inicia a música com fade e exibe a cutscene de texto inicial
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

    // roda a cada frame — controla movimento, HUD, interações e dano
    update() {
        if (!this.canMove) return;

        // Atualiza o movimento do player com base no teclado
        this.player.update(this.cursors, this.keys, this.canMove);

        // Atualiza os corações de vida na interface
        this.hud.updateHearts();

        // ── Fogo surpresa ──────────────────────────────────────────────
        // Revela os fogos escondidos quando o player chega perto deles
        if (this.fireSurpriseLayer) {
            const tileX = this.fireSurpriseLayer.worldToTileX(this.player.x);
            const tileY = this.fireSurpriseLayer.worldToTileY(this.player.y);

            for (let x = tileX - 1; x <= tileX + 1; x++) {
                for (let y = tileY - 1; y <= tileY + 1; y++) {
                    const tile = this.fireSurpriseLayer.getTileAt(x, y);

                    if (tile && tile.index !== -1 && tile.isHiddenFire) {
                        tile.isHiddenFire = false;

                        if (tile.animatedSprite) {
                            tile.animatedSprite.setAlpha(1); // torna o fogo visível
                        }
                    }
                }
            }
        }

        // Atualiza a IA de todos os guardas
        this.guardsGroup.getChildren().forEach(guard => guard.update());

        // Atualiza o sistema de pedras (input, voo, trajetória)
        this.stoneSystem.update(this.hud);

        // Atualiza os prompts de interação [E] e [F] no HUD
        this.hud.updatePrompts(this.stoneSystem.getGroundStones());

        // ── Dano por fogo ──────────────────────────────────────────────
        // Verifica se o player está sobre qualquer tile de fogo (normal ou surpresa)
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

    // exibe os textos de contexto histórico ao iniciar a fase
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

    // ----------------------------------------------------------
    // _freezeScene()
    //   Paralisa o player e todos os guardas imediatamente.
    //   Chamado tanto ao ser capturado quanto ao morrer,
    //   eliminando a duplicação de código entre os dois métodos.
    // ----------------------------------------------------------
    _freezeScene() {
        this.canMove = false;

        // Para o player e colore de vermelho como feedback visual
        this.player.setVelocity(0);
        this.player.setTint(0xff0000);
        if (this.player.anims.isPlaying) this.player.anims.stop();
        this.player.setFrame(1);

        // Para e congela todos os guardas
        this.guardsGroup.getChildren().forEach(g => {
            g.isActive = false;

            if (g.body) {
                g.body.setVelocity(0, 0);
                g.body.moves = false; // desativa completamente a física
            }

            if (g.anims.isPlaying) {
                g.anims.stop();
                g.setFrame(1);
            }
        });
    }

    // quando o guarda avista o player
    onPlayerCaught() {
        if (!this.canMove) return;

        // Paralisa a cena inteira
        this._freezeScene();

        // Reinicia automaticamente após 5 segundos se o player não clicar
        const restartTimeout = this.time.delayedCall(5000, () => {
            this.scene.restart({ isRestart: true });
        });

        this.dialogue.showDialogue(
            "> Você foi visto pelos guardas!",
            null,
            null,
            () => {
                restartTimeout.remove(); // cancela o timer automático
                this.scene.restart({ isRestart: true });
            },
        );
    }

    // quando o player perde todos os corações e morre
    onPlayerDied() {
        if (!this.canMove) return;

        // Paralisa a cena inteira e atualiza os corações para mostrar 0
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