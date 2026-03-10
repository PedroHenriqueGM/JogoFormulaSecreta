export class AnimationManager {
    
    // para qualquer spritesheet que siga o padrão 3x4
    static createCharacterAnims(scene, textureKey) {
        // verifica se a animação já existe para não criar duplicado e dar erro
        if (scene.anims.exists(`${textureKey}_walk_down`)) return;

        scene.anims.create({ 
            key: `${textureKey}_walk_down`, 
            frames: scene.anims.generateFrameNumbers(textureKey, { frames: [0, 1, 2, 1] }), 
            frameRate: 6, repeat: -1 
        });
        
        scene.anims.create({ 
            key: `${textureKey}_walk_left`, 
            frames: scene.anims.generateFrameNumbers(textureKey, { frames: [3, 4, 5, 4] }), 
            frameRate: 6, repeat: -1 
        });
        
        scene.anims.create({ 
            key: `${textureKey}_walk_right`, 
            frames: scene.anims.generateFrameNumbers(textureKey, { frames: [6, 7, 8, 7] }), 
            frameRate: 6, repeat: -1 
        });
        
        scene.anims.create({ 
            key: `${textureKey}_walk_up`, 
            frames: scene.anims.generateFrameNumbers(textureKey, { frames: [9, 10, 11, 10] }), 
            frameRate: 6, repeat: -1 
        });
    }

    // faz o sprite parar no frame correto baseado na última direção
    static handleIdle(sprite) {
        sprite.anims.stop();
            
        switch (sprite.lastDirection) {
            case 'left':
                sprite.setFrame(4);
                break;
            case 'right':
                sprite.setFrame(7);
                break;
            case 'up':
                sprite.setFrame(10);
                break;
            case 'down':
            default:
                sprite.setFrame(1); 
                break;
        }
    }
}