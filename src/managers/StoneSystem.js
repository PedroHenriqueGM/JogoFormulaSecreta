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

    constructor(scene, player, wallsLayer, guardsGroup) {
        this.scene       = scene;
        this.player      = player;
        this.wallsLayer  = wallsLayer;
        this.guardsGroup = guardsGroup;

        this.groundStonesGroup = scene.physics.add.group();
        this.flyingStonesGroup = scene.physics.add.group();

        this.collectCooldown = false;
        this.throwCooldown   = false;

        this.keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyF = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        this.trajectoryGraphics = scene.add.graphics().setDepth(150);

        scene.physics.add.collider(this.flyingStonesGroup, wallsLayer, (stone) => {
            stone.onHitWall();
        });

        this._stoneLandedHandler = ({ x, y }) => this._onStoneLanded(x, y);
        scene.events.on('stoneLanded', this._stoneLandedHandler);

        scene.events.once('shutdown', () => {
            scene.events.off('stoneLanded', this._stoneLandedHandler);
        });

        // Chama a função (que agora está vazia porque o Tiled cuida disso)
        this._spawnGroundStones();
    }

    // ── AGORA VAZIO: AS PEDRAS VÊM DO MAPA TILED! ──
    _spawnGroundStones() {
        // As antigas coordenadas fixas foram apagadas daqui.
    }

    update(hud) {
        this.flyingStonesGroup.getChildren().forEach(stone => stone.update());

        if (Phaser.Input.Keyboard.JustDown(this.keyE) && !this.collectCooldown) {
            this._tryCollect(hud);
        }

        if (this.keyF.isDown && this.player.stonesCarried > 0) {
            this._updateTrajectory();
        } else {
            this.trajectoryGraphics.clear();
        }

        if (Phaser.Input.Keyboard.JustUp(this.keyF) && !this.throwCooldown) {
            this._tryThrow(hud);
        }
    }

    _tryCollect(hud) {
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
            hud.updateStones();     
        }

        this.collectCooldown = true;
        this.scene.time.delayedCall(200, () => { this.collectCooldown = false; });
    }

    _tryThrow(hud) {
        if (!this.player.canThrowStone()) return;

        hud.updateStones(); 

        const stone = new Stone(this.scene, this.player.x, this.player.y);
        this.flyingStonesGroup.add(stone);
        stone.throw(this.player.lastDirection); 

        this.throwCooldown = true;
        this.scene.time.delayedCall(400, () => { this.throwCooldown = false; });
    }

    _onStoneLanded(x, y) {
        const soundRadius = 150; 

        this.guardsGroup.getChildren().forEach(guard => {
            const dist = Phaser.Math.Distance.Between(guard.x, guard.y, x, y);

            if (dist <= soundRadius) {
                guard.investigate(x, y); 
            }
        });
    }

    _updateTrajectory() {
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

    getGroundStones() {
        return this.groundStonesGroup.getChildren();
    }
}