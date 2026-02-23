export class Guard extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, texture, path = []) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        
        // MOVIMENTO
        this.speed = 40;

        // direção inicial aleatória (4 direções possíveis)
        const dirs = [
            new Phaser.Math.Vector2(1,0),
            new Phaser.Math.Vector2(-1,0),
            new Phaser.Math.Vector2(0,1),
            new Phaser.Math.Vector2(0,-1)
        ];
        this.direction = Phaser.Utils.Array.GetRandom(dirs);

        // VISÃO
        this.visionDistance = 120;
        this.visionAngle = Phaser.Math.DegToRad(60); // 60 graus
        this.facing = this.direction.clone();

        this.visionGraphics = scene.add.graphics();
        this.visionGraphics.setDepth(5);

        this.rayCount = 20;
        this.wallsLayer = scene.wallsLayer; // camada de paredes para checar colisões

        // CONFIGURAÇÃO FÍSICA (ricochete)
        this.body.setBounce(1,1);
        this.body.setImmovable(false);

        this.turnCooldown = 0;

    }

    update(player) {
        this.moveFree();
        this.handleCollision();
        this.updateVisionCone();
        return this.checkPlayerInSight(player);
    }

    // patrol() {
    //     if (!this.path.length) return;

    //     const target = this.path[this.currentPoint]; // ponto alvo atual
    //     const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y); // distância até o ponto alvo

    //     // movendo em direção ao ponto alvo
    //     if (dist < 4) {
    //         this.currentPoint = (this.currentPoint + 1) % this.path.length;
    //         return;
    //     }

    //     const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y); // ângulo em direção ao ponto alvo
    //     this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);

    //     this.facing.setTo(Math.cos(angle), Math.sin(angle));
    // }

    updateVisionCone() {
        const g = this.visionGraphics;
        g.clear();
        g.fillStyle(0xff0000, 0.2);
        g.beginPath();
        g.moveTo(this.x, this.y);

        const baseAngle = Phaser.Math.Angle.Between(0, 0, this.facing.x, this.facing.y);
        const startAngle = baseAngle - this.visionAngle / 2;
        const step = this.visionAngle / this.rayCount;

        for (let i = 0; i <= this.rayCount; i++) {
            const angle = startAngle + step * i;
            const end = this.castRay(angle);
            g.lineTo(end.x, end.y);
        }

        g.closePath();
        g.fill();
    }

    checkPlayerInSight(player) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (dist > this.visionDistance) return false;

        const dirToPlayer = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
        const dot = this.facing.dot(dirToPlayer);
        const angleBetween = Math.acos(dot);

        if (angleBetween > this.visionAngle / 2) return false;

        // ray até o player para ver se tem parede no meio
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const hit = this.castRay(angle);

        const distToHit = Phaser.Math.Distance.Between(this.x, this.y, hit.x, hit.y);

        return distToHit + 4 >= dist; // se não bateu antes no muro
    }

    castRay(angle) {
        const step = 4;
        let x = this.x;
        let y = this.y;

        for (let i = 0; i < this.visionDistance; i += step) {
            x += Math.cos(angle) * step;
            y += Math.sin(angle) * step;

            const tile = this.wallsLayer.getTileAtWorldXY(x, y);
            if (tile) {
                return { x, y };
            }
        }

        return {
            x: this.x + Math.cos(angle) * this.visionDistance,
            y: this.y + Math.sin(angle) * this.visionDistance
        }
    }

    moveFree() {
        this.body.setVelocity(
            this.direction.x * this.speed,
            this.direction.y * this.speed
        );

        this.facing = new Phaser.Math.Vector2(this.direction.x, this.direction.y).normalize();
    }

    handleCollision() {

        if (this.turnCooldown > 0) {
            this.turnCooldown--;
            return;
        }

        const body = this.body;
        let turned = false;

        if (body.blocked.left || body.blocked.right) {
            this.direction.x *= -1;
            turned = true;
        }

        if (body.blocked.up || body.blocked.down) {
            this.direction.y *= -1;
            turned = true;
        }

        if (turned) {
            this.direction.normalize();
            this.turnCooldown = 10; // frames até poder virar novamente
        }

    }

}