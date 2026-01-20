import { DialogueManager } from '../managers/DialogueManager.js';

export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        // Imagens Estáticas
        this.load.image('scene1_frame1', 'assets/scene1_1.png');
        this.load.image('scene1_frame2', 'assets/scene1_2.png');
        this.load.image('scene1bright', 'assets/scene1bright.png');
        this.load.image('placeholder1', 'assets/placeholder1.png');
        
        // Efeitos
        this.load.spritesheet('flare', 'assets/flare.png', {
            frameWidth: 16,
            frameHeight: 16  
        });
      
        // Spritesheets
        this.load.spritesheet('curtains', 'assets/curtains.png', { frameWidth: 320, frameHeight: 180 });
        this.load.spritesheet('start_texts', 'assets/start_texts.png', { frameWidth: 320, frameHeight: 180 });
        
        // Imagens Fixas
        this.load.image('livroZoom', 'assets/livroZoom.png');

        // Áudio
        this.load.audio('musica1', 'assets/musica1.mp3');
    }

    create() {
        const { width, height } = this.scale;

        this.dialogue = new DialogueManager(this);

        // Configuração da Música
        this.music = this.sound.add('musica1', { loop: true, volume: 0 });
        this.music.play();
        this.tweens.add({ targets: this.music, volume: 0.5, duration: 2000 });

        this.createAnimations();

        // Elementos de Fundo
        this.bgNormal = this.add.sprite(width / 2, height / 2, 'scene1_frame1');
        this.bgNormal.play('anim_candle'); 
        this.bgBright = this.add.image(width / 2, height / 2, 'scene1bright');
        this.curtains = this.add.sprite(width / 2, height / 2, 'curtains');

        this.createMenu();
    }

    createAnimations() {
        if (!this.anims.exists('anim_candle')) {
            this.anims.create({
                key: 'anim_candle',
                frames: [{ key: 'scene1_frame1' }, { key: 'scene1_frame2' }],
                frameRate: 3, repeat: -1 
            });
        }
        if (!this.anims.exists('anim_curtains_open')) {
            this.anims.create({
                key: 'anim_curtains_open',
                frames: this.anims.generateFrameNumbers('curtains', { start: 0, end: 3 }),
                frameRate: 4, repeat: 0
            });
        }
        if (!this.anims.exists('anim_flare')) {
            this.anims.create({
                key: 'anim_flare',
                frames: this.anims.generateFrameNumbers('flare', { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1
            });
        }
    }

    createMenu() {
        const { width, height } = this.scale;
        this.uiGroup = this.add.group();

        const title = this.add.sprite(width / 2, height / 2, 'start_texts', 0);
        
        const btnStart = this.add.sprite(width / 2, height / 2, 'start_texts', 1)
            .setInteractive({ cursor: 'pointer' });
        
        const btnContinue = this.add.sprite(width / 2, height / 2, 'start_texts', 2)
            .setAlpha(0.5);
        
        const btnOptions = this.add.sprite(width / 2, height / 2, 'start_texts', 3)
            .setAlpha(0.5);

        this.uiGroup.addMultiple([title, btnStart, btnContinue, btnOptions]);

        // Efeitos de Hover
        btnStart.on('pointerover', () => btnStart.setTint(0xdddddd));
        btnStart.on('pointerout', () => btnStart.clearTint());
        btnStart.once('pointerdown', () => this.startStory());
    }

    startStory() {
        this.uiGroup.setVisible(false);
        this.curtains.play('anim_curtains_open');

        this.tweens.add({
            targets: this.bgBright,
            alpha: 0, duration: 2000, ease: 'Sine.easeInOut'
        });

        this.curtains.on('animationcomplete', () => {
            this.curtains.setVisible(false);
            
            // Aguarda antes de mostrar o livro
            this.dialogue.waitForClick(() => {
                this.showBook();
            }, 4000); 
        });
    }

    showBook() {
        const { width, height } = this.scale;
        
        this.bgNormal.stop(); 

        this.closedBookView = this.add.image(width + 100, height, 'scene1_frame1') 
            .setOrigin(1, 1) 
            .setScale(2)
            .setAlpha(0);

        this.tweens.add({ targets: this.bgNormal, alpha: 0, duration: 2000 });
        this.tweens.add({ targets: this.closedBookView, alpha: 1, duration: 2000 });
        
        // Narração do Livro
        this.dialogue.waitForClick(() => {
            const text = `"Ars Magna" — o tratado que\nsistematiza equações cúbicas.\n\nCompilado por matemáticos\ncomo Tartaglia e Scipione.`;
            
            this.dialogue.showNarration(text, () => {
                this.showBookZoom();
            });
        }, 2000);
    }

    showBookZoom() {
        const { width, height } = this.scale;

        // Limpeza do estado anterior
        if (this.closedBookView) this.closedBookView.destroy();
        if (this.bgNormal) this.bgNormal.destroy();
        if (this.bgBright) this.bgBright.destroy();

        this.imgZoom = this.add.image(width / 2, height / 2, 'livroZoom');
        const scale = Math.max(width / this.imgZoom.width, height / this.imgZoom.height);
        this.imgZoom.setScale(scale);
        this.imgZoom.setAlpha(0);

        this.tweens.add({
            targets: this.imgZoom,
            alpha: 1,
            duration: 1000 
        });

        this.dialogue.waitForClick(() => {
             this.startFireSequence();
        }, 3000);
    }

   startFireSequence() {
        const { width, height } = this.scale;

        // 1. Limpeza Total
        if (this.bgNormal) this.bgNormal.destroy();
        if (this.bgBright) this.bgBright.destroy();
        if (this.curtains) this.curtains.destroy();
        if (this.uiGroup) this.uiGroup.setVisible(false);
        if (this.imgZoom) this.imgZoom.destroy(); 

        // 2. Fundo (Placeholder)
        this.bgFire = this.add.image(width / 2, height / 2, 'placeholder1').setDepth(0);
        const scaleBg = Math.max(width / this.bgFire.width, height / this.bgFire.height);
        this.bgFire.setScale(scaleBg);

        // 3. Frente (RenderTexture - Livro Queimando)
        this.bookTexture = this.add.renderTexture(0, 0, width, height)
            .setOrigin(0, 0) 
            .setDepth(1);

        // 4. Captura escala e posição do livro para o recorte (Crop)
        const tempImg = this.make.image({ key: 'livroZoom', add: false });
        this.bookScale = Math.max(width / tempImg.width, height / tempImg.height);
        
        // Calcula o offset (já que a render texture desenha no centro)
        this.bookX = (width / 2) - (tempImg.width * this.bookScale) / 2;
        this.bookY = (height / 2) - (tempImg.height * this.bookScale) / 2;

        tempImg.setScale(this.bookScale);
        this.bookTexture.draw(tempImg, width / 2, height / 2);

        // 5. Configuração do Grid
        this.gridSize = 32;
        this.eraserBlock = this.make.graphics({ x: 0, y: 0, add: false });
        this.eraserBlock.fillStyle(0xffffff);
        this.eraserBlock.fillRect(-1, -1, this.gridSize + 2, this.gridSize + 2); 

        this.cols = Math.ceil(width / this.gridSize);
        this.rows = Math.ceil(height / this.gridSize);
        
        this.burnedGrid = [];
        for (let x = 0; x < this.cols; x++) {
            this.burnedGrid[x] = [];
            for (let y = 0; y < this.rows; y++) {
                this.burnedGrid[x][y] = false;
            }
        }

        this.fireFrontier = [];
        
        // Inicia o fogo no canto inferior esquerdo
        this.addFire(0, this.rows - 1); 
        
        this.time.addEvent({
            delay: 100, 
            callback: this.processFireFrontier,
            callbackScope: this,
            loop: true
        });
    }

    addFire(col, row) {
        // Verificações de segurança
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
        if (this.burnedGrid[col][row]) return; 

        this.burnedGrid[col][row] = true;

        // Propagação do fogo (Prioridade: Direita, Cima, Diagonal)
        this.addNeighborToFrontier(col + 1, row);     
        this.addNeighborToFrontier(col, row - 1);     
        this.addNeighborToFrontier(col + 1, row - 1); 

        // Aleatoriedade para trás e para baixo
        if (Math.random() > 0.8) this.addNeighborToFrontier(col - 1, row); 
        if (Math.random() > 0.8) this.addNeighborToFrontier(col, row + 1); 

        const x = col * this.gridSize;
        const y = row * this.gridSize;

        // Configuração visual
        const baseScale = Phaser.Math.FloatBetween(2.4, 3.0);
        const baseAngle = Phaser.Math.Between(-10, 10);

        //Base do Fogo (Sólido)
        const fireBase = this.add.sprite(x + 16, y + 16, 'flare')
            .setScale(baseScale)
            .setAngle(baseAngle)
            .setDepth(3); 
        fireBase.play('anim_flare');

        //Brilho do Fogo (Glow Suave / ADD Blend)
        const fireGlow = this.add.sprite(x + 16, y + 16, 'flare')
            .setScale(baseScale * 1.5)
            .setAngle(baseAngle)
            .setDepth(2.9) 
            .setAlpha(0.3) 
            .setTint(0xFFA500) 
            .setBlendMode(Phaser.BlendModes.ADD);
            
        fireGlow.play('anim_flare');

        //Fagulhas (Partículas)
        const embers = this.add.particles(x + 16, y + 16, 'flare', {
            speed: { min: 40, max: 80 },
            angle: { min: 250, max: 290 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 600,
            frequency: 150,
            blendMode: 'ADD',
            tint: 0xFFA500,
            quantity: 1
        });
        embers.setDepth(2.5);

        //Sequência de Fade Out com correção de borda
        this.time.delayedCall(1000, () => {
            const clone = this.add.image(this.scale.width / 2, this.scale.height / 2, 'livroZoom')
                .setScale(this.bookScale)
                .setDepth(1.5); 
            
            // Overlap (Margem) para evitar linhas invisíveis
            const overlap = 2; 

            const cropX = (x - overlap - this.bookX) / this.bookScale;
            const cropY = (y - overlap - this.bookY) / this.bookScale;
            const cropSize = (this.gridSize + (overlap * 2)) / this.bookScale; 

            clone.setCrop(cropX, cropY, cropSize, cropSize);

            // Corte seco na textura
            this.bookTexture.erase(this.eraserBlock, x, y);

            // Fade suave no clone
            this.tweens.add({
                targets: clone,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    clone.destroy();
                    embers.stop(); 
                    
                    // Fade out do visual do fogo
                    this.tweens.add({
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

    processFireFrontier() {
        if (this.fireFrontier.length === 0) return;

        // Escolhe um tile aleatório da fronteira para efeito orgânico
        const index = Phaser.Math.Between(0, this.fireFrontier.length - 1);
        const target = this.fireFrontier[index];

        this.fireFrontier.splice(index, 1);
        this.addFire(target.x, target.y);
    }

    addNeighborToFrontier(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
        if (this.burnedGrid[col][row]) return;

        // Evita duplicatas na fronteira
        const alreadyListed = this.fireFrontier.some(t => t.x === col && t.y === row);
        if (!alreadyListed) {
            this.fireFrontier.push({ x: col, y: row });
        }
    }
}