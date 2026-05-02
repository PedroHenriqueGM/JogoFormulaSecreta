import { AnimationManager } from '../managers/AnimationManager.js';

export class Guard extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, texture, player, path = [], range = 100, allowedDirections = ['right', 'left', 'down', 'up']) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;

        this.isActive = true;
        
        // MOVIMENTO
        this.speed = 40;

        // direção inicial aleatória entre as direções permitidas
        this.allowedDirections = this.normalizeAllowedDirections(allowedDirections);
        this.direction = this.getRandomAllowedDirection();

        // VISÃO
        this.visionDistance = 120;
        this.visionAngle = Phaser.Math.DegToRad(60); // 60 graus
        this.facing = this.direction.clone();

        this.visionGraphics = scene.add.graphics();
        this.visionGraphics.setDepth(5);

        this.rayCount = 20;
        this.wallsLayer = scene.wallsLayer; // camada de paredes para checar colisões

        this.body.setImmovable(false);

        this.turnCooldown = 0;
        this.targetPlayer = player; 
        this.lastDirection = 'down'; 

        this.setDepth(10); // para ficar na frente de tudo

        this.spawnX = x; // onde ele nasceu
        this.spawnY = y; 
        this.patrolRange = range; // o quanto ele pode se afastar do ponto de spawn (se tiver limites de movimento)

        // ── Sistema de estados ─────────────────────────────────────────
        // 'patrolling'   → comportamento normal de patrulha (padrão)
        // 'investigating'→ guarda ouviu barulho e vai checar o local
        // 'returning'    → guarda verificou o local e está voltando ao spawn
        this.state = 'patrolling';

        // Destino da investigação (onde a pedra caiu)
        this.investigateTarget = null;

        // Quanto tempo (ms) o guarda fica parado no local antes de voltar
        this.investigateDuration = 2500;

        // Flag para evitar disparar o timer de investigação múltiplas vezes
        this.investigateTimerActive = false;

        // Distância (pixels) para considerar que chegou ao destino
        this.arriveThreshold = 12;
    }

    // normaliza as direções permitidas, aceitando termos como "horizontal", "vertical", "all" e traduções
    normalizeAllowedDirections(allowedDirections) {
        const directionAliases = {
            all: ['right', 'left', 'down', 'up'],
            horizontal: ['right', 'left'],
            vertical: ['down', 'up'],
            right: 'right',
            direita: 'right',
            left: 'left',
            esquerda: 'left',
            down: 'down',
            baixo: 'down',
            up: 'up',
            cima: 'up'
        };

        // aceita tanto string única quanto array de strings
        const requestedDirections = Array.isArray(allowedDirections) ? allowedDirections : [allowedDirections];
        const normalizedDirections = [];

        // processa cada direção solicitada, convertendo para as direções reais usando os aliases
        requestedDirections.forEach(direction => {
            const directionKey = typeof direction === 'string' ? direction.trim().toLowerCase() : direction; // para evitar erros de formatação
            const alias = directionAliases[directionKey]; // pode ser uma string única ou um array de strings dependendo do alias
            const directions = Array.isArray(alias) ? alias : [alias]; // garante que seja sempre um array para facilitar o processamento

            // adiciona as direções normalizadas, evitando duplicatas
            directions.forEach(normalizedDirection => {
                // só adiciona se for uma direção válida e ainda não tiver sido adicionada
                if (normalizedDirection && !normalizedDirections.includes(normalizedDirection)) {
                    normalizedDirections.push(normalizedDirection);
                }
            });
        });

        // se nenhuma direção válida foi encontrada, retorna todas as direções como padrão
        return normalizedDirections.length > 0 ? normalizedDirections : directionAliases.all;
    }

    // escolhe uma direção aleatória entre as permitidas
    getRandomAllowedDirection() {
        const directionName = Phaser.Utils.Array.GetRandom(this.allowedDirections);

        // converte o nome da direção para um vetor de movimento
        const directions = {
            right: new Phaser.Math.Vector2(1, 0),
            left: new Phaser.Math.Vector2(-1, 0),
            down: new Phaser.Math.Vector2(0, 1),
            up: new Phaser.Math.Vector2(0, -1)
        };

        // retorna o vetor correspondente à direção escolhida
        return directions[directionName].clone();
    }

    // ----------------------------------------------------------
    // investigate(x, y)
    //   Chamado pela cena quando uma pedra pousa perto do guarda.
    //   Muda o estado para 'investigating' e define o destino.
    // ----------------------------------------------------------
    investigate(x, y) {
        // Ignora se já está investigando ou retornando
        // (evita que uma segunda pedra interrompa a primeira investigação)
        if (this.state !== 'patrolling') return;

        // Define o destino da investigação
        this.investigateTarget = { x, y };

        // Muda o estado
        this.state = 'investigating';

        // Reseta o flag do timer para poder disparar ao chegar
        this.investigateTimerActive = false;
    }

    update() {

        if (!this.isActive) return; // trava tudo

        // ── Roteamento por estado ──────────────────────────────────────
        if (this.state === 'patrolling') {
            // Comportamento original de patrulha
            this.moveFree();
            this.handleCollision();

        } else if (this.state === 'investigating') {
            // Move o guarda em direção ao ponto de impacto da pedra
            this.moveTowardsTarget(this.investigateTarget);

            // Checa se chegou ao destino
            const dist = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.investigateTarget.x, this.investigateTarget.y
            );

            if (dist <= this.arriveThreshold && !this.investigateTimerActive) {
                // Chegou! Para o guarda e aguarda antes de retornar
                this.investigateTimerActive = true;
                this.body.setVelocity(0, 0);

                // Após investigateDuration ms, começa a voltar
                this.scene.time.delayedCall(this.investigateDuration, () => {
                    // Verifica se o guarda ainda existe e está investigando
                    if (this.active && this.state === 'investigating') {
                        this.state = 'returning';
                        this.investigateTimerActive = false;
                    }
                });
            }

        } else if (this.state === 'returning') {
            // Move o guarda de volta ao ponto de spawn original
            this.moveTowardsTarget({ x: this.spawnX, y: this.spawnY });

            // Checa se chegou ao spawn
            const distToSpawn = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.spawnX, this.spawnY
            );

            if (distToSpawn <= this.arriveThreshold) {
                // Voltou ao spawn, retoma a patrulha normal
                this.state = 'patrolling';
                this.investigateTarget = null;

                // Redefine uma direção aleatória para a patrulha
                this.direction = this.getRandomAllowedDirection();
            }
        }

        // \u2500\u2500 Detecção do player em TODOS os estados \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        // O guarda continua enxergando mesmo quando está investigando ou
        // voltando ao spawn — ele tem olhos independente do que está fazendo
        const seen = this.checkPlayerInSight(this.targetPlayer);
        if (seen) {
            this.scene.events.emit('seen');
        }

        // Atualiza visualmente o cone e as animações em todos os estados
        this.updateVisionCone();
        this.handleAnimations();
    }

    // ----------------------------------------------------------
    // moveTowardsTarget(target)
    //   Move o guarda em direção a um ponto {x, y} usando velocidade.
    //   Usado tanto para investigar quanto para retornar ao spawn.
    // ----------------------------------------------------------
    moveTowardsTarget(target) {
        // Calcula o vetor de direção normalizado até o alvo
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        // Evita dividir por zero se já estiver no destino
        if (len < 1) {
            this.body.setVelocity(0, 0);
            return;
        }

        // Normaliza e aplica a velocidade
        const normX = dx / len;
        const normY = dy / len;

        this.body.setVelocity(normX * this.speed, normY * this.speed);

        // Atualiza o facing para as animações ficarem corretas
        this.facing = new Phaser.Math.Vector2(normX, normY).normalize();

        // Atualiza lastDirection baseado na direção predominante
        // (usado pelo handleAnimations)
        if (Math.abs(normX) > Math.abs(normY)) {
            this.direction = new Phaser.Math.Vector2(normX > 0 ? 1 : -1, 0);
        } else {
            this.direction = new Phaser.Math.Vector2(0, normY > 0 ? 1 : -1);
        }
    }


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

        // colisão com paredes
        if (body.blocked.left || body.blocked.right) { this.direction.x *= -1; turned = true; }
        if (body.blocked.up || body.blocked.down) { this.direction.y *= -1; turned = true; }

        //limites de patrulha (se tiver)
        const distDeltaX = Math.abs(this.x - this.spawnX);
        const distDeltaY = Math.abs(this.y - this.spawnY);

        // colisão invisível
        if (distDeltaX > this.patrolRange) {
            this.direction.x *= -1;
            this.x = this.x < this.spawnX ? this.spawnX - this.patrolRange + 1 : this.spawnX + this.patrolRange - 1;
            turned = true;
        }
        if (distDeltaY > this.patrolRange) {
            this.direction.y *= -1;
            this.y = this.y < this.spawnY ? this.spawnY - this.patrolRange + 1 : this.spawnY + this.patrolRange - 1;
            turned = true;
        }

        if (turned) {
            this.direction.normalize();
            this.turnCooldown = 15; // evita virar muito rápido em cantos
        }
    }

    handleAnimations() {
        const texKey = this.texture.key;

        if (this.body.velocity.x < -1) {
            this.anims.play(`${texKey}_walk_left`, true);
            this.lastDirection = 'left';
        } else if (this.body.velocity.x > 1) {
            this.anims.play(`${texKey}_walk_right`, true);
            this.lastDirection = 'right';
        } else if (this.body.velocity.y < -1) {
            this.anims.play(`${texKey}_walk_up`, true);
            this.lastDirection = 'up';
        } else if (this.body.velocity.y > 1) {
            this.anims.play(`${texKey}_walk_down`, true);
            this.lastDirection = 'down';
        } else {
            AnimationManager.handleIdle(this);
        }
    }

}
