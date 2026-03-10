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
        this.lastDirection = 'down'; // começa nessa posição
        this.setFrame(1);
    }

    update(cursors, keys, canMove) {
        //trava se não pode se mover
        if (!canMove) {
            this.setVelocity(0);
            if (this.anims.isPlaying) this.anims.stop();
            return;
        }

         this.setVelocity(0);

        // leitura dos botoes
        let left = cursors.left.isDown || keys.A.isDown;
        let right = cursors.right.isDown || keys.D.isDown;
        let up = cursors.up.isDown || keys.W.isDown;
        let down = cursors.down.isDown || keys.S.isDown;

        // velocidade de cada direção
        if (left) this.setVelocityX(-this.speed);
        else if (right) this.setVelocityX(this.speed);

        if (up) this.setVelocityY(-this.speed);
        else if (down) this.setVelocityY(this.speed);
        
        const texKey = this.texture.key; // para trocar a imagem do player (adulto/criança)

        // animações
        if (left) {
            this.anims.play(`${texKey}_walk_left`, true);
            this.lastDirection = 'left';
        } 
        else if (right) {
            this.anims.play(`${texKey}_walk_right`, true);
            this.lastDirection = 'right';
        } 
        else if (up) {
            this.anims.play(`${texKey}_walk_up`, true);
            this.lastDirection = 'up';
        } 
        else if (down) {
            this.anims.play(`${texKey}_walk_down`, true);
            this.lastDirection = 'down';
        } 
        else {
            // repouso baseado na última direção
            AnimationManager.handleIdle(this);
        }
    }
}