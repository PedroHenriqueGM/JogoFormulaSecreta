import { AnimationManager } from '../managers/AnimationManager.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        // adiciona o player visualmente e fisicamente na cena
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // caixa de colisão e profundidade 
        this.body.setSize(18, 12);
        this.body.setOffset(7, 20);
        this.setDepth(10);

        // atributos
        this.speed = 70;
        this.baseSpeed = this.speed;
        this.slowSpeed = 35;
        this.slowTime = 500;
        this.slowTimer = null;
        this.lastDirection = 'down'; // começa nessa posição
        this.setFrame(1);

        // sistema de vida
        this.maxHealth = 6;
        this.health = this.maxHealth;
        this.isInvulnerable = false;
        this.invulnerabilityTime = 1000; // 1 segundo de invulnerabilidade após levar dano
        this.isDead = false;
        this.isKnockedBack = false;
        this.knockbackSpeed = 150;
        this.knockbackTime = 180;
    }

    update(cursors, keys, canMove) {
        //trava se não pode se mover
        if (!canMove) {
            this.setVelocity(0);
            if (this.anims.isPlaying) this.anims.stop();
            return;
        }

        if (this.isKnockedBack) {
            return;
        }

        this.setVelocity(0);

        // leitura dos botoes
        let left = cursors.left.isDown || keys.A.isDown;
        let right = cursors.right.isDown || keys.D.isDown;
        let up = cursors.up.isDown || keys.W.isDown;
        let down = cursors.down.isDown || keys.S.isDown;

        const texKey = this.texture.key; // para trocar a imagem do player (adulto/criança)

        // velocidade de cada direção e animações
        if (left) {
            this.setVelocityX(-this.speed);
            this.anims.play(`${texKey}_walk_left`, true);
            this.lastDirection = 'left';
        } 
        else if (right) {
            this.setVelocityX(this.speed);
            this.anims.play(`${texKey}_walk_right`, true);
            this.lastDirection = 'right';
        } 
        else if (up) {
            this.setVelocityY(-this.speed);
            this.anims.play(`${texKey}_walk_up`, true);
            this.lastDirection = 'up';
        } 
        else if (down) {
            this.setVelocityY(this.speed);
            this.anims.play(`${texKey}_walk_down`, true);
            this.lastDirection = 'down';
        } 
        else {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);

            // repouso baseado na última direção
            AnimationManager.handleIdle(this);
        }
    }

    takeDamage(amount, shouldKnockback = false, shouldSlow = false) {
        if(this.isInvulnerable || this.isDead) return;

        this.health -= amount;

        // feedback visual de dano
        this.setTint(0xff0000); // pinta o player de vermelho
        this.isInvulnerable = true;

        this.scene.time.delayedCall(150, () => {
            if (!this.isDead) this.clearTint();
        });

        if (shouldKnockback) {
            this.applyKnockback();
        }

        if (this.health <= 0){
            this.health = 0;
        }

        if(this.scene.healthText) {
            this.scene.healthText.setText(`❤️ ${this.health}/${this.maxHealth}`);
        }

        if (this.health <= 0){
            this.die();
            return;
        }

        if (shouldSlow) {
            const slowDelay = shouldKnockback ? this.knockbackTime : 0;
            this.applySlow(slowDelay);
        }

        this.scene.time.delayedCall(this.invulnerabilityTime, () => {
            this.isInvulnerable = false;
            if(!this.isDead) this.clearTint();
        });

    }

    applySlow(delay = 0) {
        if (this.slowTimer) {
            this.slowTimer.remove();
        }

        const startSlow = () => {
            if (this.isDead) return;

            this.speed = this.slowSpeed;

            this.slowTimer = this.scene.time.delayedCall(this.slowTime, () => {
                this.speed = this.baseSpeed;
                this.slowTimer = null;
            });
        };

        if (delay > 0) {
            this.slowTimer = this.scene.time.delayedCall(delay, startSlow);
            return;
        }

        startSlow();
    }

    applyKnockback() {
        if (this.isDead) return;

        this.isKnockedBack = true;

        let velocityX = 0;
        let velocityY = 0;

        if (this.lastDirection === 'left') {
            velocityX = this.knockbackSpeed;
        }
        else if (this.lastDirection === 'right') {
            velocityX = -this.knockbackSpeed;
        }
        else if (this.lastDirection === 'up') {
            velocityY = this.knockbackSpeed;
        }
        else if (this.lastDirection === 'down') {
            velocityY = -this.knockbackSpeed;
        }

        this.setVelocity(velocityX, velocityY);

        if(this.anims.isPlaying) {
            this.anims.stop();
        }

        this.scene.time.delayedCall(this.knockbackTime, () => {
            this.isKnockedBack = false;

            if(!this.isDead) {
                this.setVelocity(0);
            }
        });
    }

    die() {

        if(this.isDead) return; // previne múltiplas mortes

        this.isDead = true;
        this.setVelocity(0);

        if(this.anims.isPlaying) {
            this.anims.stop();
        }

        this.scene.events.emit('playerDied'); // avisa a cena que o player morreu

    }

}
