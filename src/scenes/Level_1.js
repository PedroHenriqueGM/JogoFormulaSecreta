import { DialogueManager } from '../managers/DialogueManager.js';
import { Guard } from '../entities/Guard.js';
import { Player } from '../entities/Player.js';
import { AnimationManager } from '../managers/AnimationManager.js';

export class Level_1 extends Phaser.Scene {

    constructor() {
        super('Level_1');
    }

    preload() {
        // carregando mapa tilemap
        this.load.image('tiles', 'assets/mapas/Set 1.png');
        this.load.tilemapTiledJSON('level_1_map', 'assets/mapas/map.json');

        // carregando sprites
        this.load.spritesheet('young_niccolo', 'assets/entities/young_niccolo.png', {frameWidth: 32, frameHeight: 32});
        this.load.spritesheet('guard', 'assets/entities/guard.png', {frameWidth: 32, frameHeight: 32});
        
        // audio
        this.load.audio('level1', 'assets/audio/level1.wav');
        this.load.audio('voice_a', 'assets/audio/voices/voice1/voice_a.wav');
        this.load.audio('voice_e', 'assets/audio/voices/voice1/voice_e.wav');
        this.load.audio('voice_i', 'assets/audio/voices/voice1/voice_i.wav');
        this.load.audio('voice_o', 'assets/audio/voices/voice1/voice_o.wav');
        this.load.audio('voice_u', 'assets/audio/voices/voice1/voice_u.wav');
    }

    create(data) {
        const { width, height } = this.scale;
        const spawnX = 55;
        const spawnY = 30;

        this.bgMusic = this.sound.get('level1');
        if (!this.bgMusic) {
            this.bgMusic = this.sound.add('level1', { loop: true, volume: 0 });
        }

        this.dialogue = new DialogueManager(this);
        this.canMove = false;

        const map = this.make.tilemap({key: 'level_1_map' });
        const tileset = map.addTilesetImage('set 1', 'tiles');

        const ground = map.createLayer('chao', tileset, 0, 0);
        const walls = map.createLayer('paredes', tileset, 0, 0);

        this.wallsLayer = walls;
        walls.setCollisionByProperty({ collider: true });

        // player
        this.player = new Player(this, spawnX, spawnY, 'young_niccolo');
        this.physics.add.collider(this.player, walls);

        // grupo e guardas
        this.guardsGroup = this.add.group({
            runChildUpdate: true
        });

        const guard1 = new Guard(this, 200, 100, 'guard', this.player);
        this.physics.add.collider(guard1, walls);
        this.guardsGroup.add(guard1);

        // escutar o seen para disparar o game over
        this.events.on('seen', this.onPlayerCaught, this);

        // animações
        AnimationManager.createCharacterAnims(this, 'young_niccolo');
        AnimationManager.createCharacterAnims(this, 'guard');

        // câmera seguindo o player
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // controles do teclado
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D');

        // se for restart da fase, recomeça sem a cutscene e libera o boneco
        if (data && data.isRestart) {
            if (!this.bgMusic.isPlaying) {
                this.bgMusic.play(); // só toca se não estiver tocando
            }

            this.bgMusic.setVolume(0.5);
            this.canMove = true;
        }
    }

    iniciarCutscene() {
        if (!this.bgMusic.isPlaying) {
            this.bgMusic.play(); // ssó toca se ainda não estiver tocando
        }
        
        this.tweens.add({
            targets: this.bgMusic,
            volume: 0.5,
            duration: 4000 
        });

        this.time.delayedCall(2000, () => {  
            this.showIntroText();
        });
    }

    update() {
        if (!this.canMove) return;
        this.player.update(this.cursors, this.keys, this.canMove);
    }

    showIntroText() {
        const lines = [
            "> Brescia, Itália, 1512.",
            "> Um menino corre entre chamas e espadas.",
            "> Seu nome é Niccolò Fontana.",
            "> O mundo logo o chamará de Tartaglia."
        ];
        const text = lines.join('\n');

        this.dialogue.showDialogue(text, null, null, () => {
            this.canMove = true;
        });
    }

    onPlayerCaught() {
         if (!this.canMove) return; // evita rodar duas vezes se dois guardas virem ao mesmo tempo

        this.canMove = false;

        // PARA o player completamente
        this.player.setVelocity(0);
        this.player.setTint(0xff0000);

        // para a animação do player
        if (this.player.anims.isPlaying) this.player.anims.stop();
        this.player.setFrame(1); // frame de ser pego

        // paralisa/destrói todos os guardas dentro do grupo
        this.guardsGroup.getChildren().forEach(g => {
            g.isActive = false; // DESLIGA O GUARDA

            if (g.body) {
                g.body.setVelocity(0, 0);
                g.body.moves = false; // garante que não mexe mais
            }

            if (g.anims.isPlaying) {
                g.anims.stop();
                g.setFrame(1); // frame de ver o player
            }

            // g.visionGraphics.clear();
            // g.visionGraphics.setVisible(false);

        });

        // fallback em caso de erro no diálogo
        const restartTimeout = this.time.delayedCall(5000, () => {
            console.warn("Timeout: reiniciando cena após ser pego");
            this.scene.restart({ isRestart: true });
        });

        this.dialogue.showDialogue("> Você foi visto pelos guardas!", null, null, () => {
            restartTimeout.remove();
            this.scene.restart({ isRestart: true });
        });
    }
}