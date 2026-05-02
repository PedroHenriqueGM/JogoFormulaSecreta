import { DialogueManager } from "../managers/DialogueManager.js";
import { Guard } from "../entities/Guard.js";
import { Player } from "../entities/Player.js";
import { AnimationManager } from "../managers/AnimationManager.js";
import { SaveManager } from "../managers/SaveManager.js";
import { Stone } from "../entities/Stone.js"; // sistema de pedras para distração de guardas

export class Level_1 extends Phaser.Scene {
    constructor() {
        super("Level_1");
    }

    preload() {
        // carregando mapa tilemap
        this.load.image("tileset", "assets/maps/tileset_1.png");
        this.load.tilemapTiledJSON("level_1_map", "assets/maps/map_1.json");

        // carregando sprites
        this.load.spritesheet(
        "young_niccolo",
        "assets/entities/young_niccolo.png",
        { frameWidth: 32, frameHeight: 32 },
        );
        this.load.spritesheet("guard", "assets/entities/guard.png", {
        frameWidth: 32,
        frameHeight: 32,
        });

        // audio
        this.load.audio("level1", "assets/audio/level1.wav");
        this.load.audio("voice_a", "assets/audio/voices/voice1/voice_a.wav");
        this.load.audio("voice_e", "assets/audio/voices/voice1/voice_e.wav");
        this.load.audio("voice_i", "assets/audio/voices/voice1/voice_i.wav");
        this.load.audio("voice_o", "assets/audio/voices/voice1/voice_o.wav");
        this.load.audio("voice_u", "assets/audio/voices/voice1/voice_u.wav");
        
        //ui
        this.load.image('menu_box', 'assets/ui/menu_box.png');
    }

    // ----------------------------------------------------------
    // Gera a textura da pedra via Phaser Graphics (sem precisar de imagem)
    // Chamado no create() antes de criar as pedras no mapa
    // ----------------------------------------------------------
    createStoneTexture() {
        // Só cria a textura se ainda não existir (evita duplicatas no restart)
        if (this.textures.exists('stone')) return;

        // Cria um canvas de 16x16 e desenha um círculo cinza
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x888888, 1);   // cinza médio
        g.fillCircle(8, 8, 6);      // círculo de raio 6 dentro do canvas 16x16
        g.fillStyle(0x555555, 0.5); // sombra escura
        g.fillEllipse(8, 13, 10, 4); // sombra oval abaixo da pedra
        g.generateTexture('stone', 16, 16); // gera a textura com o nome 'stone'
        g.destroy(); // limpa o graphics temporário
    }

    create(data) {
        const { width, height } = this.scale;
        const spawnX = 32;
        const spawnY = 1024;

        // Tecla ESC para abrir o pause
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.input.keyboard.on("keydown-ESC", () => {
            if(!this.canMove) return; //não abre durante cutscene/diálogo
            this.scene.pause();
            this.scene.launch("PauseMenu", { origemCena: this.scene.key });
        })

        this.bgMusic = this.sound.get("level1");
        if (!this.bgMusic) {
        this.bgMusic = this.sound.add("level1", { loop: true, volume: 0 });
        }

        this.dialogue = new DialogueManager(this);
        this.canMove = false;

        const map = this.make.tilemap({ key: "level_1_map" });
        const tileset = map.addTilesetImage("tileset_1", "tileset");

        const ground = map.createLayer("Tile Layer 3", tileset, 0, 0);
        const walls = map.createLayer("Tile Layer 2", tileset, 0, 0);
        const fire = map.createLayer("Fogo", tileset, 0, 0);

        this.wallsLayer = walls;
        // A propriedade "collider" está na layer do Tiled, não em cada tile.
        // Como esta layer representa as paredes, marcamos todo tile visível como colidível.
        walls.setCollisionByExclusion([-1, 0]);

        this.fireLayer = fire;

        // player
        this.player = new Player(this, spawnX, spawnY, "young_niccolo");
        this.physics.add.collider(this.player, walls);

        this.healthText = this.add
        .text(16, 16, `❤️ ${this.player.health}/${this.player.maxHealth}`, {
            fontSize: "16px",
            fill: "#ffffff",
        })
        .setScrollFactor(0) // fixa na tela
        .setDepth(100); // fica por cima de tudo

        // ── HUD de pedras ────────────────────────────────────────────
        // Texto que mostra quantas pedras o player está carregando
        this.stonesText = this.add
        .text(16, 36, `🪨 ${this.player.stonesCarried}/${this.player.maxStones}`, {
            fontSize: "16px",
            fill: "#cccccc",
        })
        .setScrollFactor(0) // fixo na tela
        .setDepth(100);

        // ── Prompt de coleta: [E] Pegar ──────────────────────────────
        // Texto que flutua acima da pedra mais próxima quando o player pode coletar
        // Começa invisível e só aparece quando o player entra no raio de coleta
        this.collectPrompt = this.add
        .text(0, 0, '[E] Pegar', {
            fontSize: '12px',
            fill: '#ffffff',
            backgroundColor: '#000000aa', // fundo preto semitransparente
            padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5, 1)   // ancorado pelo centro-base (fica acima da pedra)
        .setDepth(200)        // na frente de tudo
        .setVisible(false);   // começa escondido

        // ── Prompt de arremesso: [F] Lançar ───────────────────────────
        // Texto fixo na HUD que aparece quando o player tem pedras no inventário
        // Começa invisível e atualiza junto com o stonesCarried
        this.throwPrompt = this.add
        .text(16, 56, '[F] Segure para mirar', {
            fontSize: '11px',
            fill: '#ffdd88',           // amarelo suave
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 },
        })
        .setScrollFactor(0)  // fixo na tela
        .setDepth(100)
        .setVisible(false);  // começa escondido

        // ── Trajetória de mira (Graphics no mundo) ──────────────────────
        // Objeto Graphics reutilizável que redesenha os pontos da trajetória
        // a cada frame enquanto F está pressionado. Não é fixo na HUD —
        // fica no espaço do mundo e a câmera já cuida do scroll.
        this.trajectoryGraphics = this.add.graphics();
        this.trajectoryGraphics.setDepth(150); // acima das pedras (8) e abaixo dos prompts (200)

        // grupo e guardas
        this.guardsGroup = this.physics.add.group();

        const guard1Limits = {
        minX: 150,
        maxX: 400,
        minY: 50,
        maxY: 150,
        };

        // 5 * 32 = 160 | 32 * 32 = 1024
        // guarda que pode andar 64 pixels (2 tiles) para qualquer lado
        // direções aceitas: all, horizontal, vertical, right, direita, left, esquerda, down, baixo, up, cima (aceita português e inglês)
        const guard1 = new Guard(
        this,
        160,
        1024,
        "guard",
        this.player,
        [],
        64,
        "vertical",
        );
        this.guardsGroup.add(guard1);

        // guarda que anda 32 pixels
        const guard2 = new Guard(this, 600, 800, "guard", this.player, [], 32);
        this.guardsGroup.add(guard2);

        this.physics.add.collider(this.guardsGroup, walls);

        // ── Sistema de Pedras ────────────────────────────────────────────

        // Gera a textura visual da pedra (círculo cinza via graphics)
        this.createStoneTexture();

        // Grupo estático de pedras no chão (as coletáveis)
        // Usamos um grupo dinâmico para poder remover pedras ao coletar
        this.groundStonesGroup = this.physics.add.group();

        // Grupo de pedras voando (projéteis arremessados pelo player)
        this.flyingStonesGroup = this.physics.add.group();

        // ── Posições fixas das pedras no mapa ─────────────────────────
        // Cada objeto {x, y} é onde uma pedra aparece no mapa
        // Ajuste as coordenadas de acordo com o layout do seu mapa!
        const stonePositions = [
            { x: 80,  y: 1024 },  // próximo ao spawn do player
            { x: 200, y: 990  },  // perto do guarda 1
            { x: 400, y: 850  },  // caminho do meio do mapa
            { x: 550, y: 800  },  // próximo ao guarda 2
        ];

        // Cria uma pedra no chão para cada posição definida
        stonePositions.forEach(pos => {
            const stone = new Stone(this, pos.x, pos.y);
            this.groundStonesGroup.add(stone); // adiciona ao grupo de pedras no chão
        });

        // ── Colisão das pedras voando com as paredes ────────────────────
        // Quando uma pedra voando bate numa parede, chama onHitWall()
        this.physics.add.collider(this.flyingStonesGroup, walls, (stone) => {
            stone.onHitWall(); // avisa a pedra que bateu na parede
        });

        // ── Teclas de interação com pedras ──────────────────────────
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        // Cooldown para evitar que o player colete ou arremesse várias vezes
        // com um único pressionamento de tecla (debounce manual)
        this.collectCooldown  = false; // E — coletar
        this.throwCooldown    = false; // F — arremessar

        // ── Listener: pedra pousou ───────────────────────────────────
        // Quando uma Stone emite 'stoneLanded', verificamos quais guardas
        // estão no raio sonoro e os mandamos investigar o local
        this.events.on('stoneLanded', ({ x, y }) => {
            this.onStoneLanded(x, y);
        });

        // escutar o seen para disparar o game over
        this.events.on("seen", this.onPlayerCaught, this);

        // escutar o playerDied para reiniciar a fase
        this.events.on("playerDied", this.onPlayerDied, this);

        // animações
        AnimationManager.createCharacterAnims(this, "young_niccolo");
        AnimationManager.createCharacterAnims(this, "guard");

        // câmera seguindo o player
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setRoundPixels(true);

        // controles do teclado
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D");

        // entrada nova no level: salva o ponto de início
        if (!data?.isRestart && !data?.fromSave) {
            SaveManager.save({
                level: 'Level_1',
                playerX: spawnX,
                playerY: spawnY,
                health: this.player.health
            });
        }

        // se vier do "Continuar" no menu
        if(data && data.fromSave) {
            const save = SaveManager.load();
            if (save) {
                this.player.setPosition(save.playerX, save.playerY);
                this.player.health = save.health;
                this.healthText.setText(
                    `❤️ ${this.player.health}/${this.player.maxHealth}`,
                ); 
            }
            if (!this.bgMusic.isPlaying) this.bgMusic.play();
            this.bgMusic.setVolume(0.5);
            this.canMove = true;
        }

         // se for restart após morte/captura
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
        duration: 4000,
        });

        this.time.delayedCall(2000, () => {
        this.showIntroText();
        });
    }

    update() {
        if (!this.canMove) return;
        this.player.update(this.cursors, this.keys, this.canMove);

        this.guardsGroup.getChildren().forEach((guard) => {
        guard.update();
        });

        // Atualiza as pedras voando (verifica distância máxima)
        this.flyingStonesGroup.getChildren().forEach((stone) => {
        stone.update();
        });

        // ── Tecla E — Coletar pedra do chão ───────────────────────────
        if (Phaser.Input.Keyboard.JustDown(this.keyE) && !this.collectCooldown) {
            this.tryCollectStone();
        }

        // ── Tecla F — Lógica de mira e arremesso ────────────────────────
        // Se F está sendo SEGURADO e o player tem pedras: desenha a trajetória
        if (this.keyF.isDown && this.player.stonesCarried > 0) {
            this.updateTrajectory();
        } else {
            // F foi soltado ou o player não tem pedras: limpa o desenho
            this.trajectoryGraphics.clear();
        }

        // Se F acabou de ser SOLTO (JustUp) e o cooldown permite: lança a pedra
        if (Phaser.Input.Keyboard.JustUp(this.keyF) && !this.throwCooldown) {
            this.tryThrowStone();
        }

        // ── Prompts de interação ───────────────────────────────────
        this.updatePrompts();

        // verifica se o player está em um tile de fogo
        const tileFire = this.fireLayer.getTileAtWorldXY(
        this.player.x,
        this.player.y,
        );
        if (tileFire && tileFire.properties.isFire) {
        this.player.takeDamage(1, true, true);
        }
    }

    // ----------------------------------------------------------
    // updateTrajectory()
    //   Desenha pontos pontilhados no caminho que a pedra vai percorrer.
    //   Chamado a cada frame enquanto F está pressionado.
    //   Para de desenhar ao encontrar uma parede (usa castRay igual ao guarda).
    // ----------------------------------------------------------
    updateTrajectory() {
        const g = this.trajectoryGraphics;
        g.clear(); // apaga o desenho do frame anterior antes de redesenhar

        // Vetor de direção baseado no lastDirection do player
        // (mesma lógica do Stone.throw)
        const dirVectors = {
            up:    { dx: 0,  dy: -1 },
            down:  { dx: 0,  dy:  1 },
            left:  { dx: -1, dy:  0 },
            right: { dx:  1, dy:  0 }
        };

        const dir = dirVectors[this.player.lastDirection] || dirVectors['right'];

        // Parâmetros do rastro
        const maxDistance = 200; // igual ao maxDistance da Stone
        const dotSpacing  = 14;  // distância entre cada ponto (pixels)
        const dotRadius   = 2.5; // tamanho de cada ponto
        const step        = 2;   // precisão do ray cast (menor = mais preciso)

        // Ponto de início: posição atual do player
        let rayX = this.player.x;
        let rayY = this.player.y;

        // Avança passo a passo verificando paredes
        // Acumula distância para saber onde desenhar os pontos
        let distanceSoFar = 0;
        let nextDotAt     = dotSpacing; // distância em que o próximo ponto deve aparecer

        while (distanceSoFar < maxDistance) {
            // Avança um passo
            rayX += dir.dx * step;
            rayY += dir.dy * step;
            distanceSoFar += step;

            // Verifica se bateu numa parede
            const tile = this.wallsLayer.getTileAtWorldXY(rayX, rayY);
            if (tile) break; // para o rastro aqui

            // Se chegou no ponto onde o próximo ponto deve aparecer, desenha
            if (distanceSoFar >= nextDotAt) {
                // Gradiente de opacidade: mais transparente conforme se afasta
                const progress = distanceSoFar / maxDistance; // 0 → 1
                const alpha    = 1 - progress * 0.6;          // de 1.0 até 0.4

                // Cor branca semitransparente
                g.fillStyle(0xffffff, alpha);
                g.fillCircle(rayX, rayY, dotRadius);

                nextDotAt += dotSpacing; // próximo ponto
            }
        }

        // Desenha um círculo maior no ponto final para indicar o impacto
        g.fillStyle(0xffdd88, 0.8); // amarelo, igual ao throwPrompt
        g.fillCircle(rayX, rayY, 4);
    }

    // ----------------------------------------------------------
    // updatePrompts()
    //   Atualiza a visibilidade e posição dos prompts de interação
    //   a cada frame. Chamado dentro do update().
    // ----------------------------------------------------------
    updatePrompts() {
        const collectRadius = 40; // mesmo raio usado em tryCollectStone()

        // ── Prompt [E] Pegar ─────────────────────────────────────
        // Procura a pedra mais próxima dentro do raio
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
            // Tem pedra perto: mostra o prompt acima dela (16px acima)
            this.collectPrompt.setPosition(closestStone.x, closestStone.y - 16);
            this.collectPrompt.setVisible(true);
        } else {
            // Nenhuma pedra perto: esconde o prompt
            this.collectPrompt.setVisible(false);
        }

        // ── Prompt [F] Lançar ─────────────────────────────────────
        // Só aparece quando o player tem pelo menos 1 pedra no inventário
        this.throwPrompt.setVisible(this.player.stonesCarried > 0);
    }

    // ----------------------------------------------------------
    // tryCollectStone()
    //   Tenta coletar uma pedra do chão próxima ao player.
    //   Raio de coleta: 40 pixels.
    // ----------------------------------------------------------
    tryCollectStone() {
        const collectRadius = 40; // distância máxima para coletar

        // Pega todas as pedras do chão e filtra as que estão próximas
        const stones = this.groundStonesGroup.getChildren();

        // Procura a pedra mais próxima dentro do raio
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

        // Se encontrou uma pedra próxima e o player tem espaço no inventário
        if (closestStone && this.player.collectStone()) {
            closestStone.destroy(); // remove a pedra do chão
            this.updateStonesHUD();  // atualiza o contador na tela
        }

        // Cooldown de 200ms para evitar múltiplas coletas por pressionamento
        this.collectCooldown = true;
        this.time.delayedCall(200, () => { this.collectCooldown = false; });
    }

    // ----------------------------------------------------------
    // tryThrowStone()
    //   Cria uma pedra voando na direção que o player está olhando.
    //   Só funciona se o player tiver pedras no inventário.
    // ----------------------------------------------------------
    tryThrowStone() {
        // Tenta decrementar o inventário — se não tiver pedras, para aqui
        if (!this.player.canThrowStone()) return;

        // Atualiza o HUD antes de criar a pedra
        this.updateStonesHUD();

        // Cria uma nova pedra na posição atual do player
        const stone = new Stone(this, this.player.x, this.player.y);

        // Adiciona ao grupo de pedras voando para colisão e update
        this.flyingStonesGroup.add(stone);

        // Arremessa na direção que o player está olhando
        stone.throw(this.player.lastDirection);

        // Cooldown de 400ms para evitar spam de pedras
        this.throwCooldown = true;
        this.time.delayedCall(400, () => { this.throwCooldown = false; });
    }

    // ----------------------------------------------------------
    // onStoneLanded(x, y)
    //   Chamado pelo evento 'stoneLanded'. Verifica quais guardas
    //   estão no raio sonoro e manda cada um investigar.
    // ----------------------------------------------------------
    onStoneLanded(x, y) {
        // Raio em que o barulho da pedra é ouvido pelos guardas (pixels)
        const soundRadius = 150;

        this.guardsGroup.getChildren().forEach(guard => {
            // Calcula a distância entre o guarda e o ponto de impacto
            const dist = Phaser.Math.Distance.Between(
                guard.x, guard.y,
                x, y
            );

            // Se o guarda está no raio sonoro, manda investigar
            if (dist <= soundRadius) {
                guard.investigate(x, y);
            }
        });
    }

    // ----------------------------------------------------------
    // updateStonesHUD()
    //   Atualiza o texto de pedras na tela com o valor atual.
    // ----------------------------------------------------------
    updateStonesHUD() {
        if (this.stonesText) {
            this.stonesText.setText(`🪨 ${this.player.stonesCarried}/${this.player.maxStones}`);
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
        this.guardsGroup.getChildren().forEach((g) => {
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

    handlePlayerFire(player, tile) {
        player.takeDamage(1, true, true);
    }

    onPlayerDied() {
        if (!this.canMove) return; // previne múltiplas execuções

        this.canMove = false;

        this.player.setVelocity(0);
        this.player.setTint(0xff0000);

        if (this.player.anims.isPlaying) this.player.anims.stop();
        this.player.setFrame(1); // frame de morte

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
}
