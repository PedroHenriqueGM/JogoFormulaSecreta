// ============================================================
// Stone.js — Entidade da pedra
// Representa a pedra em dois estados:
//   'on_ground'  → pedra visível no chão, aguardando ser coletada
//   'flying'     → pedra arremessada, voando em uma direção
//   'landed'     → pedra pousou, emitiu o evento e desapareceu
// ============================================================

export class Stone extends Phaser.Physics.Arcade.Sprite {

    /**
     * @param {Phaser.Scene} scene   - A cena onde a pedra existe
     * @param {number}       x       - Posição X inicial (no chão)
     * @param {number}       y       - Posição Y inicial (no chão)
     */
    constructor(scene, x, y) {
        // Usamos a textura 'stone' que é gerada via graphics na cena
        super(scene, x, y, 'stone');

        // Adiciona a pedra como objeto visual e físico na cena
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;

        // ── Configurações visuais ──────────────────────────────
        this.setDepth(8);          // abaixo do player (depth 10) mas acima do chão
        this.setScale(0.8);        // levemente menor que o tile

        // ── Corpo físico ───────────────────────────────────────
        this.body.setSize(10, 10); // caixa de colisão pequena
        this.body.setOffset(3, 3);

        // ── Estado inicial ─────────────────────────────────────
        // A pedra começa no chão, parada, esperando ser coletada
        this.state = 'on_ground';

        // ── Parâmetros de voo ──────────────────────────────────
        this.flySpeed    = 280;    // pixels por segundo ao voar
        this.maxDistance = 200;    // distância máxima que a pedra alcança (pixels)
        this.distanceTraveled = 0; // contador de distância percorrida

        // Guarda a posição de onde foi lançada para calcular distância
        this.launchX = x;
        this.launchY = y;
    }

    // ----------------------------------------------------------
    // throw(direction)
    //   Ativa o modo de voo da pedra.
    //   @param {string} direction - 'up' | 'down' | 'left' | 'right'
    // ----------------------------------------------------------
    throw(direction) {
        // Muda o estado para voando
        this.state = 'flying';

        // Guarda onde a pedra foi lançada
        this.launchX = this.x;
        this.launchY = this.y;
        this.distanceTraveled = 0;

        // Define a velocidade de acordo com a direção
        // (baseada no lastDirection do player)
        const velocities = {
            up:    { x: 0,              y: -this.flySpeed },
            down:  { x: 0,              y:  this.flySpeed },
            left:  { x: -this.flySpeed, y: 0              },
            right: { x:  this.flySpeed, y: 0              }
        };

        const vel = velocities[direction] || velocities['right']; // fallback para direita

        // Aplica a velocidade no corpo físico
        this.body.setVelocity(vel.x, vel.y);

        // A pedra não deve ser imovível enquanto voa
        this.body.setImmovable(false);
    }

    // ----------------------------------------------------------
    // land()
    //   Chamado quando a pedra para (bateu em parede ou atingiu
    //   a distância máxima). Emite o evento 'stoneLanded' com
    //   a posição onde parou, para os guardas ouvirem.
    // ----------------------------------------------------------
    land() {
        // Evita chamar land() mais de uma vez
        if (this.state === 'landed') return;

        this.state = 'landed';

        // Para a pedra completamente
        this.body.setVelocity(0, 0);
        this.body.setImmovable(true);

        // Emite o evento para a cena saber onde a pedra caiu
        // Os guardas na cena vão escutar esse evento
        this.scene.events.emit('stoneLanded', { x: this.x, y: this.y });

        // Faz a pedra desaparecer após 1.5 segundos (efeito visual limpo)
        this.scene.time.delayedCall(1500, () => {
            this.destroy(); // remove a pedra da cena
        });
    }

    // ----------------------------------------------------------
    // update()
    //   Chamado a cada frame enquanto a pedra está voando.
    //   Verifica se atingiu a distância máxima.
    // ----------------------------------------------------------
    update() {
        // Só atualiza se estiver em voo
        if (this.state !== 'flying') return;

        // Calcula a distância percorrida desde o lançamento
        this.distanceTraveled = Phaser.Math.Distance.Between(
            this.launchX, this.launchY,
            this.x,       this.y
        );

        // Se passou da distância máxima, pousa
        if (this.distanceTraveled >= this.maxDistance) {
            this.land();
        }
    }

    // ----------------------------------------------------------
    // onHitWall()
    //   Chamado pela cena quando a pedra colide com uma parede.
    //   Aciona o pouso no ponto de impacto.
    // ----------------------------------------------------------
    onHitWall() {
        // Só reage se estiver em voo (evita chamadas duplicadas)
        if (this.state === 'flying') {
            this.land();
        }
    }
}
