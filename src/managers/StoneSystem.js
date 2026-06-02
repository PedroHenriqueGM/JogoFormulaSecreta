// ============================================================
// StoneSystem.js — Sistema de Pedras
// Centraliza toda a lógica relacionada a pedras:
//   - Spawn das pedras no chão do nível
//   - Leitura do input de coleta (tecla E) e arremesso (tecla F)
//   - Simulação da trajetória (pontinhos) enquanto o jogador mira
//   - Notificação dos guardas quando a pedra pousa
// ============================================================

import { Stone } from '../entities/Stone.js';

export class StoneSystem {

    /**
     * @param {Phaser.Scene}                 scene       - A cena atual
     * @param {Player}                       player      - O jogador
     * @param {Phaser.Tilemaps.TilemapLayer} wallsLayer  - Camada de paredes (colisão e trajetória)
     * @param {Phaser.Physics.Arcade.Group}  guardsGroup - Grupo de guardas (avisar ao ouvir barulho)
     */
    constructor(scene, player, wallsLayer, guardsGroup) {
        this.scene       = scene;
        this.player      = player;
        this.wallsLayer  = wallsLayer;
        this.guardsGroup = guardsGroup;

        // Grupos de física separados: pedras paradas no chão e pedras em voo
        this.groundStonesGroup = scene.physics.add.group();
        this.flyingStonesGroup = scene.physics.add.group();

        // Cooldowns para evitar coleta e arremesso acidentais ao segurar as teclas
        this.collectCooldown = false;
        this.throwCooldown   = false;

        // Teclas de interação com as pedras
        this.keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyF = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        // Gráficos para desenhar os pontinhos da trajetória prevista
        this.trajectoryGraphics = scene.add.graphics().setDepth(150);

        // Configura a colisão: pedra voando bate na parede → pousa
        scene.physics.add.collider(this.flyingStonesGroup, wallsLayer, (stone) => {
            stone.onHitWall();
        });

        // Guarda a referência do handler para poder removê-lo depois
        // (necessário para evitar acúmulo entre restarts da cena)
        this._stoneLandedHandler = ({ x, y }) => this._onStoneLanded(x, y);
        scene.events.on('stoneLanded', this._stoneLandedHandler);

        // Quando a cena encerrar (inclusive ao reiniciar), remove o listener.
        // Sem isso, cada restart adicionaria um novo handler em cima do anterior,
        // e os handlers antigos apontariam para o guardsGroup já destruído → trava.
        scene.events.once('shutdown', () => {
            scene.events.off('stoneLanded', this._stoneLandedHandler);
        });

        // Cria as pedras iniciais espalhadas pelo chão do nível
        this._spawnGroundStones();
    }

    // ----------------------------------------------------------
    // _spawnGroundStones()
    //   Cria as pedras que ficam paradas no chão do nível,
    //   aguardando o jogador chegar perto e apertar E.
    //
    //   DICA FUTURA: essas posições poderiam vir do mapa Tiled
    //   via map.getObjectLayer('Pedras'), eliminando o hardcode.
    // ----------------------------------------------------------
    _spawnGroundStones() {
        const stonePositions = [
            { x: 80,  y: 1024 },
            { x: 200, y: 990  },
            { x: 400, y: 850  },
            { x: 550, y: 800  },
        ];

        stonePositions.forEach(pos => {
            const stone = new Stone(this.scene, pos.x, pos.y);
            this.groundStonesGroup.add(stone);
        });
    }

    // ----------------------------------------------------------
    // update(hud)
    //   Chamado a cada frame pelo update() do Level_1.
    //   Processa o input de pedras e atualiza os objetos em voo.
    //
    //   @param {HUDManager} hud - Referência ao HUD para atualizar
    //                             o contador de pedras após coleta/arremesso
    // ----------------------------------------------------------
    update(hud) {
        // Atualiza cada pedra que está em voo (verifica distância máxima)
        this.flyingStonesGroup.getChildren().forEach(stone => stone.update());

        // ── Coleta (apertar E) ─────────────────────────────────────────
        if (Phaser.Input.Keyboard.JustDown(this.keyE) && !this.collectCooldown) {
            this._tryCollect(hud);
        }

        // ── Mira / Trajetória (segurar F) ─────────────────────────────
        if (this.keyF.isDown && this.player.stonesCarried > 0) {
            // Enquanto F está pressionado, desenha a trajetória prevista
            this._updateTrajectory();
        } else {
            // Limpa os pontos quando não está mirando
            this.trajectoryGraphics.clear();
        }

        // ── Arremesso (soltar F) ───────────────────────────────────────
        if (Phaser.Input.Keyboard.JustUp(this.keyF) && !this.throwCooldown) {
            this._tryThrow(hud);
        }
    }

    // ----------------------------------------------------------
    // _tryCollect(hud)
    //   Verifica se há uma pedra no chão dentro do raio de coleta.
    //   Se sim, adiciona ao inventário do player e remove do chão.
    // ----------------------------------------------------------
    _tryCollect(hud) {
        const collectRadius = 40; // raio em pixels para considerar "perto"
        const stones = this.groundStonesGroup.getChildren();

        let closestStone = null;
        let closestDist  = Infinity;

        // Encontra a pedra mais próxima dentro do raio
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

        // Tenta adicionar ao inventário — player.collectStone() retorna false se cheio
        if (closestStone && this.player.collectStone()) {
            closestStone.destroy(); // remove o objeto físico do chão
            hud.updateStones();     // atualiza o contador na interface
        }

        // Cooldown curto para evitar coletar várias vezes num único apertar
        this.collectCooldown = true;
        this.scene.time.delayedCall(200, () => { this.collectCooldown = false; });
    }

    // ----------------------------------------------------------
    // _tryThrow(hud)
    //   Cria uma pedra em voo na direção que o player está olhando.
    //   O método player.canThrowStone() já decrementa o inventário.
    // ----------------------------------------------------------
    _tryThrow(hud) {
        // Cancela se não há pedras no inventário
        if (!this.player.canThrowStone()) return;

        hud.updateStones(); // atualiza o contador imediatamente após decrementar

        // Cria a pedra na posição do player e a coloca no grupo de voo
        const stone = new Stone(this.scene, this.player.x, this.player.y);
        this.flyingStonesGroup.add(stone);
        stone.throw(this.player.lastDirection); // lança na direção que o player está olhando

        // Cooldown para evitar spam de arremessos
        this.throwCooldown = true;
        this.scene.time.delayedCall(400, () => { this.throwCooldown = false; });
    }

    // ----------------------------------------------------------
    // _onStoneLanded(x, y)
    //   Disparado quando uma pedra pousa (evento 'stoneLanded').
    //   Avisa todos os guardas dentro do raio de alcance do barulho.
    // ----------------------------------------------------------
    _onStoneLanded(x, y) {
        const soundRadius = 150; // raio em pixels que o barulho da pedra alcança

        this.guardsGroup.getChildren().forEach(guard => {
            const dist = Phaser.Math.Distance.Between(guard.x, guard.y, x, y);

            if (dist <= soundRadius) {
                guard.investigate(x, y); // manda o guarda checar o ponto de impacto
            }
        });
    }

    // ----------------------------------------------------------
    // _updateTrajectory()
    //   Desenha os pontinhos indicando onde a pedra vai pousar.
    //   Usa um raio que avança até bater numa parede ou atingir
    //   a distância máxima de voo da pedra.
    // ----------------------------------------------------------
    _updateTrajectory() {
        const g = this.trajectoryGraphics;
        g.clear();

        // Mapa de direção por nome → vetor de movimento unitário
        const dirVectors = {
            up:    { dx: 0,  dy: -1 },
            down:  { dx: 0,  dy:  1 },
            left:  { dx: -1, dy:  0 },
            right: { dx:  1, dy:  0 }
        };

        const dir = dirVectors[this.player.lastDirection] || dirVectors['right'];

        const maxDistance = 200; // distância máxima da trajetória (deve bater com Stone.maxDistance)
        const dotSpacing  = 14;  // espaçamento entre os pontos desenhados
        const dotRadius   = 2.5; // tamanho visual de cada ponto
        const step        = 2;   // quantos pixels avança por iteração do raio

        let rayX = this.player.x;
        let rayY = this.player.y;
        let distanceSoFar = 0;
        let nextDotAt     = dotSpacing;

        // Avança o raio passo a passo até bater numa parede ou atingir a distância máxima
        while (distanceSoFar < maxDistance) {
            rayX += dir.dx * step;
            rayY += dir.dy * step;
            distanceSoFar += step;

            const tile = this.wallsLayer.getTileAtWorldXY(rayX, rayY);
            if (tile) break; // encontrou uma parede, para o raio aqui

            // Desenha um ponto a cada dotSpacing pixels percorridos
            if (distanceSoFar >= nextDotAt) {
                // Pontos ficam progressivamente mais transparentes (fade de distância)
                const progress = distanceSoFar / maxDistance;
                const alpha    = 1 - progress * 0.6;

                g.fillStyle(0xffffff, alpha);
                g.fillCircle(rayX, rayY, dotRadius);

                nextDotAt += dotSpacing;
            }
        }

        // Ponto de impacto final (amarelado) — indica onde a pedra vai parar
        g.fillStyle(0xffdd88, 0.8);
        g.fillCircle(rayX, rayY, 4);
    }

    // ----------------------------------------------------------
    // getGroundStones()
    //   Retorna a lista de pedras atualmente no chão.
    //   Usado pelo HUDManager.updatePrompts() para saber quais
    //   pedras verificar na proximidade do jogador.
    // ----------------------------------------------------------
    getGroundStones() {
        return this.groundStonesGroup.getChildren();
    }
}
