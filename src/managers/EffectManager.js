export class EffectManager {
    constructor(scene) {
        this.scene = scene;
        this.gridSize = 32;
        this.width = scene.scale.width;
        this.height = scene.scale.height;
        this.burnedGrid = [];
        this.fireFrontier = [];
    }

    start(onComplete) {
        this.onComplete = onComplete;

        this.bookTexture = this.scene.add.renderTexture(0, 0, this.width, this.height)
            .setOrigin(0, 0)
            .setDepth(1);

        const tempImg = this.scene.make.image({ key: 'livroZoom', add: false });
        this.bookScale = Math.max(this.width / tempImg.width, this.height / tempImg.height);
        
        this.bookX = (this.width / 2) - (tempImg.width * this.bookScale) / 2;
        this.bookY = (this.height / 2) - (tempImg.height * this.bookScale) / 2;

        tempImg.setScale(this.bookScale);
        tempImg.setPosition(this.width / 2, this.height / 2);
        this.bookTexture.draw(tempImg);
        tempImg.destroy();

        this.eraserBrush = this.scene.make.graphics({ x: 0, y: 0, add: false });
        this.eraserBrush.fillStyle(0xffffff, 1);
        this.eraserBrush.fillCircle(0, 0, 32); 

        this.cols = Math.ceil(this.width / this.gridSize);
        this.rows = Math.ceil(this.height / this.gridSize);
        
        for (let x = 0; x < this.cols; x++) {
            this.burnedGrid[x] = [];
            for (let y = 0; y < this.rows; y++) {
                this.burnedGrid[x][y] = false;
            }
        }

        this.addFire(0, this.rows - 1); 
        
        this.timerEvent = this.scene.time.addEvent({
            delay: 80, 
            callback: this.processFireFrontier,
            callbackScope: this,
            loop: true
        });
    }

    processFireFrontier() {
        if (this.fireFrontier.length === 0) {
            this.timerEvent.remove();
            this.scene.time.delayedCall(1000, () => {
                if (this.onComplete) this.onComplete();
            });
            return;
        }

        this.fireFrontier.sort((a, b) => {
            const distA = this.getDistanceToDiagonal(a.x, a.y);
            const distB = this.getDistanceToDiagonal(b.x, b.y);
            const randomFactor = 6; 
            return (distA + Math.random() * randomFactor) - (distB + Math.random() * randomFactor);
        });

        const range = Math.min(this.fireFrontier.length, 4);
        const index = Phaser.Math.Between(0, range - 1);
        
        const target = this.fireFrontier[index];
        this.fireFrontier.splice(index, 1);
        
        this.addFire(target.x, target.y);
    }

    getDistanceToDiagonal(x, y) {
        const numerator = Math.abs((this.rows * x) + (this.cols * y) - (this.rows * this.cols));
        const denominator = Math.sqrt((this.rows * this.rows) + (this.cols * this.cols));
        return numerator / denominator;
    }

    addNeighborToFrontier(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
        if (this.burnedGrid[col][row]) return;
        
        const alreadyListed = this.fireFrontier.some(t => t.x === col && t.y === row);
        if (!alreadyListed) {
            this.fireFrontier.push({ x: col, y: row });
        }
    }

    spawnConnectorFire(x, y) {
        const scale = Phaser.Math.FloatBetween(2.0, 2.8);

        const shouldFlip = Math.random() > 0.5; 

        const fireBase = this.scene.add.sprite(x, y, 'flare')
            .setScale(scale)
            .setDepth(3.3)
            .setFlipX(shouldFlip)
            .play('anim_flare');

        const fireGlow = this.scene.add.sprite(x, y, 'flare')
            .setScale(scale * 1.4)
            .setDepth(3.2)
            .setAlpha(0.25)
            .setTint(0xFFA500)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setFlipX(shouldFlip)
            .play('anim_flare');
        
        this.scene.tweens.add({
            targets: [fireBase, fireGlow],
            alpha: 0, scale: scale * 0.5, duration: 400, delay: 100,
            onComplete: () => { fireBase.destroy(); fireGlow.destroy(); }
        });
    }

    addFire(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
        if (this.burnedGrid[col][row]) return; 

        this.burnedGrid[col][row] = true;
        const x = col * this.gridSize;
        const y = row * this.gridSize;

        if (col > 0 && this.burnedGrid[col - 1][row]) this.spawnConnectorFire(x, y + 16);
        if (row > 0 && this.burnedGrid[col][row - 1]) this.spawnConnectorFire(x + 16, y);

        this.addNeighborToFrontier(col + 1, row);     
        this.addNeighborToFrontier(col, row - 1);     
        this.addNeighborToFrontier(col + 1, row - 1); 
        if (Math.random() > 0.7) this.addNeighborToFrontier(col - 1, row); 
        if (Math.random() > 0.7) this.addNeighborToFrontier(col, row + 1); 

        const baseScale = Phaser.Math.FloatBetween(3.0, 3.8); 
        const randomOffsetX = Phaser.Math.Between(10, 22);
        const randomOffsetY = Phaser.Math.Between(10, 22);
        const fireX = x + randomOffsetX;
        const fireY = y + randomOffsetY;

        const shouldFlip = Math.random() > 0.5; 

        const fireBase = this.scene.add.sprite(fireX, fireY, 'flare')
            .setScale(baseScale)
            .setDepth(3.5)
            .setFlipX(shouldFlip)
            .play('anim_flare');
        
        const fireGlow = this.scene.add.sprite(fireX, fireY, 'flare')
            .setScale(baseScale * 1.5)
            .setDepth(3.4)
            .setAlpha(0.3)
            .setTint(0xFFA500)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setFlipX(shouldFlip) 
            .play('anim_flare');
            
        const embers = this.scene.add.particles(fireX, fireY, 'flare', {
            speed: { min: 40, max: 80 }, angle: { min: 250, max: 290 }, 
            scale: { start: 0.4, end: 0 }, alpha: { start: 0.6, end: 0 },
            lifespan: 600, frequency: 150, blendMode: 'ADD', 
            tint: 0xFFA500, quantity: 1
        });
        embers.setDepth(3.3);

        const drawX = x + 16;
        const drawY = y + 16;

        this.scene.time.delayedCall(700, () => {
            this.bookTexture.erase(this.eraserBrush, drawX, drawY);

            embers.stop(); 
            this.scene.tweens.add({
                targets: [fireBase, fireGlow], alpha: 0, duration: 300,
                onComplete: () => {
                    fireBase.destroy(); fireGlow.destroy(); embers.destroy();
                }
            });
        });
    }
}