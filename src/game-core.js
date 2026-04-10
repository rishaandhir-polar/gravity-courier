import { GravityManager } from './gravity-manager.js';
import { PhysicsCore }    from './physics-core.js';
import { GameRenderer }   from './game-renderer.js';
import { bindInputEvents, bindTiltEvents } from './game-events.js';
import { Package }        from './package-entity.js';
import { GameUIManager }  from './game-ui-manager.js';
import { LevelManager }   from './level-manager.js';
import { EditorManager }  from './editor-manager.js';
import {
    GRAVITY_STRENGTH, DAMAGE_THRESHOLD, HAZARD_MULTIPLIER, 
    ROTATION_DURATION, LEVEL_TIME
} from './constants.js';

export class Game {
    constructor() {
        this.canvas   = document.getElementById('game-canvas');
        this.world    = document.getElementById('game-world');
        this.gravity  = new GravityManager();
        this.physics  = new PhysicsCore(0.988, 0.42);
        this.levels   = new LevelManager();
        this.ui       = new GameUIManager({
            onRestart: () => this.loadLevel(this.levelDef.id),
            onNext:    () => this.loadLevel(this.levels.getNextId(this.levelDef.id))
        });
        this.renderer = new GameRenderer(this.canvas, this.gravity);
        this.editor   = new EditorManager(this.canvas, this.renderer, this.ui);

        this.pkg       = null;
        this.level     = null;
        this.levelDef  = null;
        this.state     = 'MENU';
        this.rotations = 0;
        this.rotating  = false;
        this.particles = [];
        this.timeLeft  = LEVEL_TIME;
        this.lastTick  = null;
        this.credits   = parseInt(localStorage.getItem('gravity-courier-credits')) || 0;

        this._setupCanvas();
        this._bindEvents();
        this._loop();
    }

    _setupCanvas() {
        const resize = () => {
            const size = Math.min(window.innerWidth, window.innerHeight);
            this.canvas.width = size; this.canvas.height = size;
            if (this.levelDef) this.level = this.levels.resolve(this.levelDef, size, size);
        };
        resize();
        window.addEventListener('resize', resize);
    }

    _bindEvents() {
        bindInputEvents(() => this.state, (dir) => this.rotate(dir), () => {
            if (this.state === 'MENU') this.loadLevel(1);
            if (this.state === 'WIN') this.loadLevel(this.levels.getNextId(this.levelDef.id));
            if (this.state === 'GAMEOVER') this.loadLevel(this.levelDef.id);
        });
        this.ui.initMenu(
            async (id) => {
                this.gravity.resetToSnap();
                await bindTiltEvents(() => this.state, (gx, gy) => this.gravity.setFreeVector(gx, gy));
                this.loadLevel(id);
            },
            () => { this.state = 'EDITOR'; this.ui.hideAllOverlays(); this.editor.start(); }
        );
        window.addEventListener('editor-playtest', (e) => {
            this.editor.stop();
            this.loadLevel(e.detail.level);
        });
    }

    loadLevel(levelData) {
        if (typeof levelData === 'number') {
            this.levelDef = this.levels.findLevel(levelData);
        } else if (typeof levelData === 'string' && levelData.startsWith('custom-')) {
            const index = parseInt(levelData.split('-')[1]);
            const def = this.editor.getCampaignLevel(index);
            if (def) {
                this.levelDef = def;
            } else {
                this.state = 'MENU';
                this.ui.showOverlay('menu-overlay');
                this.ui.showToast('CAMPAIGN COMPLETE');
                return;
            }
        } else {
            this.levelDef = levelData; // Custom level definition object
        }
        
        this.level     = this.levels.resolve(this.levelDef, this.canvas.width, this.canvas.height);
        this.pkg       = new Package(this.level.packageStart.x, this.level.packageStart.y);
        this.rotations = 0;
        this.particles = [];
        this.gravity.reset();
        this.world.style.transform  = 'rotate(0deg)';
        this.timeLeft = this.levelDef.time || LEVEL_TIME;
        this.lastTick = null;
        this.state    = 'PLAYING';
        this.ui.hideAllOverlays();
        this.ui.updateHUD({ gravityLabel: 'DOWN', rotations: 0, time: LEVEL_TIME, health: 100, credits: this.credits });
        document.getElementById('level-title').innerText = this.levelDef.name;
    }

    rotate(dir) {
        if (this.rotating || this.state !== 'PLAYING') return;
        this.rotating = true;
        this.state    = 'ROTATING';
        dir === 'cw' ? this.gravity.rotateClockwise() : this.gravity.rotateCounterClockwise();
        this.rotations++;
        this.ui.updateHUD({ gravityLabel: this.gravity.getDirectionLabel(), rotations: this.rotations });
        this.world.style.transition = `transform ${ROTATION_DURATION}ms cubic-bezier(0.34, 1.4, 0.64, 1)`;
        this.world.style.transform  = `rotate(${this.gravity.getRawAngle()}deg)`;
        setTimeout(() => { this.rotating = false; this.state = 'PLAYING'; }, ROTATION_DURATION);
    }

    _update() {
        if (this.state === 'EDITOR') return;
        if (this.state !== 'PLAYING' && this.state !== 'ROTATING') return;
        
        const now = performance.now();
        if (this.lastTick === null) this.lastTick = now;
        this.timeLeft -= (now - this.lastTick) / 1000;
        this.lastTick = now;
        if (this.timeLeft <= 0) return this._gameOver('timeout');

        this.ui.updateHUD({ time: this.timeLeft, health: this.pkg.health });

        const grav = this.gravity.getVector(GRAVITY_STRENGTH);
        this.physics.applyForce(this.pkg, grav);
        this.physics.updatePosition(this.pkg);
        this.pkg.recordTrail();

        if (this.physics.checkBounds(this.pkg, this.canvas)) this._spawnParticles(this.pkg.x, this.pkg.y, '#00f2ff');
        const hit = this.physics.checkObstacles(this.pkg, this.level.obstacles);
        if (hit.hit) {
            if (hit.type === 'hazard' && hit.speed > DAMAGE_THRESHOLD) {
                this.pkg.damage(Math.floor(hit.speed * HAZARD_MULTIPLIER));
                this._spawnParticles(this.pkg.x, this.pkg.y, '#ff2d55');
                this._shake();
            } else if (hit.type === 'repair') {
                this.pkg.heal(20);
                this._spawnParticles(this.pkg.x, this.pkg.y, '#00ff99', 12);
            } else if (hit.type === 'shatter') {
                this.level.obstacles = this.level.obstacles.filter(o => o !== hit.obstacle);
                this._spawnParticles(this.pkg.x, this.pkg.y, '#ffffff', 24);
                this._shake();
            } else if (hit.type !== 'hazard') {
                this._spawnParticles(this.pkg.x, this.pkg.y, '#ffffff');
            }
        }

        const { x, y, w, h } = this.level.destination;
        if (this.pkg.x > x && this.pkg.x < x + w && this.pkg.y > y && this.pkg.y < y + h) return this._win();
        if (this.pkg.destroyed) return this._gameOver('integrity');

        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });

        // Collectibles
        this.level.collectibles = this.level.collectibles.filter(c => {
            if (Math.hypot(this.pkg.x - c.x, this.pkg.y - c.y) < 20) {
                this.credits++;
                localStorage.setItem('gravity-courier-credits', this.credits);
                this._spawnParticles(c.x, c.y, '#ffd700');
                this.ui.updateHUD({ credits: this.credits });
                return false;
            }
            return true;
        });
    }

    _spawnParticles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 1.5 + Math.random() * 3;
            this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 20 + Math.random() * 15, maxLife: 35, color });
        }
    }

    _shake() {
        this.canvas.classList.remove('shake');
        void this.canvas.offsetWidth;
        this.canvas.classList.add('shake');
    }

    _win() { this.state = 'WIN'; this.ui.showWin(this.rotations, this.pkg.health, () => this.loadLevel(this.levels.getNextId(this.levelDef.id))); }
    _gameOver(reason) { this.state = 'GAMEOVER'; this.ui.showGameOver(reason); }

    _draw() {
        this.renderer.clear();
        if (this.state === 'MENU') return;
        
        this.renderer.drawBackground();

        if (this.state === 'EDITOR') return this.editor.draw();
        
        this.renderer.drawDestination(this.level.destination);
        this.renderer.drawCollectibles(this.level.collectibles);
        this.renderer.drawObstacles(this.level.obstacles);
        this.renderer.drawParticles(this.particles);
        this.renderer.drawPackageTrail(this.pkg.trail);
        this.renderer.drawPackage(this.pkg);
        this.renderer.drawCompass(this.pkg, this.level.destination);
        this.renderer.drawGravityArrow();
    }

    _loop() { this._update(); this._draw(); requestAnimationFrame(() => this._loop()); }
}
