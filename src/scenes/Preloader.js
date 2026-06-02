export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        // ── Assets da Intro / Menu ──────────────────────────────────────
        // Imagens de fundo da intro
        this.load.image('scene1_frame1', 'assets/intro/scene1_1.png');
        this.load.image('scene1_frame2', 'assets/intro/scene1_2.png');
        this.load.image('scene1bright',  'assets/intro/scene1bright.png');
        this.load.image('livroZoom',     'assets/intro/livroZoom.png');

        // Imagens da UI do menu
        this.load.image('selector',         'assets/intro/selector.png');
        this.load.image('ui_box_narrator',  'assets/ui/ui_box_narrator.png');
        this.load.image('ui_box_character', 'assets/ui/ui_box_character.png');
        this.load.image('confirm_box',      'assets/ui/confirm_box.png');
        this.load.image('textGlow',         'assets/intro/glow.png');

        // Spritesheets da intro
        this.load.spritesheet('curtains',   'assets/intro/curtains.png',   { frameWidth: 320, frameHeight: 180 });
        this.load.spritesheet('startTexts', 'assets/intro/startTexts.png', { frameWidth: 320, frameHeight: 180 });
        this.load.spritesheet('flare',      'assets/intro/flare.png',      { frameWidth: 16,  frameHeight: 16  });

        // Áudios da intro
        this.load.audio('intro',   'assets/audio/intro.wav');
        this.load.audio('burning', 'assets/audio/burning.wav');

        // Fonte bitmap usada em todas as cenas
        this.load.bitmapFont('pixelFont', 'assets/fonts/pixelFont/pixelFont.png', 'assets/fonts/pixelFont/pixelFont.xml');

        // ── Assets do Level 1 ───────────────────────────────────────────
        // Mapa (tileset + JSON exportado pelo Tiled)
        this.load.image('tileset', 'assets/maps/tileset_1.png');
        this.load.tilemapTiledJSON('level_1_map', 'assets/maps/map_1.json');

        // Sprites de personagens e objetos
        this.load.spritesheet('young_niccolo', 'assets/entities/young_niccolo.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('guard',         'assets/entities/guard.png',         { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('npc_fugitivo',  'assets/entities/npc_fugitivo.png',  { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('fire_anim',     'assets/entities/fire_anim.png',     { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('hearts',        'assets/ui/hearts.png',              { frameWidth: 14, frameHeight: 12 });

        // UI do jogo (pause, inventário)
        this.load.image('menu_box', 'assets/ui/menu_box.png');
        this.load.image('stone',    'assets/ui/stone.png');

        // Música do nível
        this.load.audio('level1', 'assets/audio/level1.wav');

        // ── Vozes (usadas tanto na intro quanto no level) ───────────────
        // Carregadas UMA VEZ aqui — sem duplicação entre cenas
        this.load.audio('voice_a', 'assets/audio/voices/voice1/voice_a.wav');
        this.load.audio('voice_e', 'assets/audio/voices/voice1/voice_e.wav');
        this.load.audio('voice_i', 'assets/audio/voices/voice1/voice_i.wav');
        this.load.audio('voice_o', 'assets/audio/voices/voice1/voice_o.wav');
        this.load.audio('voice_u', 'assets/audio/voices/voice1/voice_u.wav');
    }

    create() {
        // Todos os assets foram carregados com sucesso.
        // Inicia o menu principal.
        this.scene.start('Start');
    }
}
