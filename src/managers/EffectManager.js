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

        // Configuração da Textura e Grid
        this.bookTexture = this.scene.add.renderTexture(0, 0, this.width, this.height)
            .setOrigin(0, 0)
            .setDepth(1);

        const tempImg = this.scene.make.image({ key: 'livroZoom', add: false });
        this.bookScale = Math.max(this.width / tempImg.width, this.height / tempImg.height);
        
        this.bookX = (this.width / 2) - (tempImg.width * this.bookScale) / 2;
        this.bookY = (this.height / 2) - (tempImg.height * this.bookScale) / 2;

        tempImg.setScale(this.bookScale);
        this.bookTexture.draw(tempImg, this.width / 2, this.height / 2);

        this.eraserBlock = this.scene.make.graphics({ x: 0, y: 0, add: false });
        this.eraserBlock.fillStyle(0xffffff);
        this.eraserBlock.fillRect(-1, -1, this.gridSize + 2, this.gridSize + 2);

        this.cols = Math.ceil(this.width / this.gridSize);
        this.rows = Math.ceil(this.height / this.gridSize);
        
        for (let x = 0; x < this.cols; x++) {
            this.burnedGrid[x] = [];
            for (let y = 0; y < this.rows; y++) {
                this.burnedGrid[x][y] = false;
            }
        }

        // Inicia o loop
        this.addFire(0, this.rows - 1); 
        
        this.timerEvent = this.scene.time.addEvent({
            delay: 100, 
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
        const index = Phaser.Math.Between(0, this.fireFrontier.length - 1);
        const target = this.fireFrontier[index];
        this.fireFrontier.splice(index, 1);
        this.addFire(target.x, target.y);
    }

    addNeighborToFrontier(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
        if (this.burnedGrid[col][row]) return;
        
        const alreadyListed = this.fireFrontier.some(t => t.x === col && t.y === row);
        if (!alreadyListed) {
            this.fireFrontier.push({ x: col, y: row });
        }
    }

    addFire(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
        if (this.burnedGrid[col][row]) return; 

        this.burnedGrid[col][row] = true;

        this.addNeighborToFrontier(col + 1, row);     
        this.addNeighborToFrontier(col, row - 1);     
        this.addNeighborToFrontier(col + 1, row - 1); 
        if (Math.random() > 0.8) this.addNeighborToFrontier(col - 1, row); 
        if (Math.random() > 0.8) this.addNeighborToFrontier(col, row + 1); 

        const x = col * this.gridSize;
        const y = row * this.gridSize;

        // Efeitos Visuais
        const baseScale = Phaser.Math.FloatBetween(2.4, 3.0);
        const baseAngle = Phaser.Math.Between(-10, 10);

        const fireBase = this.scene.add.sprite(x + 16, y + 16, 'flare')
            .setScale(baseScale).setAngle(baseAngle).setDepth(3); 
        fireBase.play('anim_flare');

        const fireGlow = this.scene.add.sprite(x + 16, y + 16, 'flare')
            .setScale(baseScale * 1.5).setAngle(baseAngle).setDepth(2.9)
            .setAlpha(0.3).setTint(0xFFA500).setBlendMode(Phaser.BlendModes.ADD);
        fireGlow.play('anim_flare');

        const embers = this.scene.add.particles(x + 16, y + 16, 'flare', {
            speed: { min: 40, max: 80 }, angle: { min: 250, max: 290 },
            scale: { start: 0.4, end: 0 }, alpha: { start: 0.6, end: 0 },
            lifespan: 600, frequency: 150, blendMode: 'ADD', tint: 0xFFA500, quantity: 1
        });
        embers.setDepth(2.5);

        // Fade Out e Recorte
        this.scene.time.delayedCall(1000, () => {
            const clone = this.scene.add.image(this.width / 2, this.height / 2, 'livroZoom')
                .setScale(this.bookScale).setDepth(1.5); 
            
            const overlap = 2; 
            const cropX = (x - overlap - this.bookX) / this.bookScale;
            const cropY = (y - overlap - this.bookY) / this.bookScale;
            const cropSize = (this.gridSize + (overlap * 2)) / this.bookScale; 
            clone.setCrop(cropX, cropY, cropSize, cropSize);

            this.bookTexture.erase(this.eraserBlock, x, y);

            this.scene.tweens.add({
                targets: clone,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    clone.destroy();
                    embers.stop(); 
                    this.scene.tweens.add({
                        targets: [fireBase, fireGlow], 
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            fireBase.destroy();
                            fireGlow.destroy();
                            embers.destroy();
                        }
                    });
                }
            });
        });
    }
}