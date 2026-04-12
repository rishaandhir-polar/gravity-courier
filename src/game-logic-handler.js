import { 
    GRAVITY_STRENGTH, DAMAGE_THRESHOLD, HAZARD_MULTIPLIER, 
    LEVEL_TIME 
} from './constants.js';

/**
 * Handles the frame-by-frame physics and logic updates for the game.
 */
export function updateGame(game, now) {
    if (game.lastTick === null) game.lastTick = now;
    game.timeLeft -= (now - game.lastTick) / 1000;
    game.lastTick = now;

    if (game.timeLeft <= 0) return game._gameOver('timeout');

    game.ui.updateHUD({ time: game.timeLeft, health: game.pkg.health });

    const grav = game.gravity.getVector(GRAVITY_STRENGTH);
    game.physics.applyForce(game.pkg, grav);
    game.physics.updatePosition(game.pkg);
    game.pkg.recordTrail();

    // Check bounds and obstacles
    if (game.physics.checkBounds(game.pkg, game.canvas)) {
        spawnParticles(game, game.pkg.x, game.pkg.y, '#00f2ff');
    }

    const hit = game.physics.checkObstacles(game.pkg, game.level.obstacles);
    if (hit.hit) {
        handleCollision(game, hit);
    }

    // Goal check
    const { x, y, w, h } = game.level.destination;
    if (game.pkg.x > x && game.pkg.x < x + w && game.pkg.y > y && game.pkg.y < y + h) {
        return game._win();
    }

    if (game.pkg.destroyed) return game._gameOver('integrity');

    updateParticles(game);
    collectCredits(game);
}

function handleCollision(game, hit) {
    if (hit.type === 'hazard' && hit.speed > DAMAGE_THRESHOLD) {
        game.pkg.damage(Math.floor(hit.speed * HAZARD_MULTIPLIER));
        spawnParticles(game, game.pkg.x, game.pkg.y, '#ff2d55');
        game._shake();
    } else if (hit.type === 'repair') {
        game.pkg.heal(20);
        spawnParticles(game, game.pkg.x, game.pkg.y, '#00ff99', 12);
    } else if (hit.type === 'shatter') {
        game.level.obstacles = game.level.obstacles.filter(o => o !== hit.obstacle);
        spawnParticles(game, game.pkg.x, game.pkg.y, '#ffffff', 24);
        game._shake();
    } else if (hit.type !== 'hazard') {
        spawnParticles(game, game.pkg.x, game.pkg.y, '#ffffff');
    }
}

function updateParticles(game) {
    game.particles = game.particles.filter(p => p.life > 0);
    game.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
}

function collectCredits(game) {
    game.level.collectibles = game.level.collectibles.filter(c => {
        if (Math.hypot(game.pkg.x - c.x, game.pkg.y - c.y) < 20) {
            game.credits++;
            localStorage.setItem('gravity-courier-credits', game.credits);
            spawnParticles(game, c.x, c.y, '#ffd700');
            game.ui.updateHUD({ credits: game.credits });
            return false;
        }
        return true;
    });
}

export function spawnParticles(game, x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 1.5 + Math.random() * 3;
        game.particles.push({ 
            x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, 
            life: 20 + Math.random() * 15, maxLife: 35, color 
        });
    }
}
