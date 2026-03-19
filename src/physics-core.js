/**
 * Handles movement, gravity, and collision physics for entities.
 */
export class PhysicsCore {
    constructor(friction = 0.985, bounce = 0.45) {
        this.friction = friction;
        this.bounce = bounce;
    }

    /**
     * Applies a force vector to an entity's velocity.
     * @param {{vx: number, vy: number}} entity
     * @param {{x: number, y: number}} force
     */
    applyForce(entity, force) {
        entity.vx += force.x;
        entity.vy += force.y;
    }

    /**
     * Updates position based on velocity and applies friction.
     * @param {{x: number, y: number, vx: number, vy: number}} entity
     */
    updatePosition(entity) {
        entity.x += entity.vx;
        entity.y += entity.vy;
        entity.vx *= this.friction;
        entity.vy *= this.friction;
    }

    /**
     * Keeps entity within canvas bounds and handles bouncing.
     * Below MIN_BOUNCE_SPEED the velocity component is zeroed so gravity
     * can re-accelerate from rest instead of micro-oscillating against the wall.
     * @returns {boolean} true if a boundary was hit
     */
    checkBounds(entity, bounds) {
        const { width, height } = bounds;
        const r = entity.radius || 0;
        const MIN = 0.5; // px/frame — below this, kill the component
        let hit = false;

        if (entity.x - r < 0) {
            entity.x = r;
            if (entity.vx < 0) {
                const v = Math.abs(entity.vx) * this.bounce;
                entity.vx = v > MIN ? v : 0;
            }
            hit = true;
        } else if (entity.x + r > width) {
            entity.x = width - r;
            if (entity.vx > 0) {
                const v = Math.abs(entity.vx) * this.bounce;
                entity.vx = v > MIN ? -v : 0;
            }
            hit = true;
        }

        if (entity.y - r < 0) {
            entity.y = r;
            // Only bounce if moving toward the wall (vy < 0); if gravity is
            // already pulling away, zeroing vy here would trap it against the wall.
            if (entity.vy < 0) {
                const v = Math.abs(entity.vy) * this.bounce;
                entity.vy = v > MIN ? v : 0;
            }
            hit = true;
        } else if (entity.y + r > height) {
            entity.y = height - r;
            if (entity.vy > 0) {
                const v = Math.abs(entity.vy) * this.bounce;
                entity.vy = v > MIN ? -v : 0;
            }
            hit = true;
        }

        return hit;
    }

    /**
     * Checks and resolves collision with obstacles of different shapes.
     * @returns {{hit: boolean, type: string|null, speed: number}}
     */
    checkObstacles(entity, obstacles) {
        for (const obs of obstacles) {
            const r = entity.radius || 0;
            let nx, ny, distSq, closestX, closestY;

            if (obs.shape === 'circle') {
                const dx = entity.x - obs.x;
                const dy = entity.y - obs.y;
                distSq = dx * dx + dy * dy;
                const combinedR = r + obs.radius;
                
                if (distSq < combinedR * combinedR) {
                    const d = Math.sqrt(distSq) || 1e-6;
                    nx = dx / d; ny = dy / d;
                    entity.x = obs.x + nx * combinedR;
                    entity.y = obs.y + ny * combinedR;
                    this._resolveCollision(entity, obs, nx, ny);
                    return { hit: true, obstacle: obs, type: obs.type, speed: this.getSpeed(entity) };
                }
            } else {
                // Default to Rect
                closestX = Math.max(obs.x, Math.min(entity.x, obs.x + obs.w));
                closestY = Math.max(obs.y, Math.min(entity.y, obs.y + obs.h));
                const dx = entity.x - closestX;
                const dy = entity.y - closestY;
                distSq = dx * dx + dy * dy;

                if (distSq < r * r) {
                    if (distSq === 0) {
                        const overlapL = entity.x - obs.x; const overlapR = (obs.x + obs.w) - entity.x;
                        const overlapT = entity.y - obs.y; const overlapB = (obs.y + obs.h) - entity.y;
                        const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);
                        if (minOverlap === overlapL)      { nx = -1; ny = 0; entity.x = obs.x - r; }
                        else if (minOverlap === overlapR) { nx =  1; ny = 0; entity.x = obs.x + obs.w + r; }
                        else if (minOverlap === overlapT) { nx = 0; ny = -1; entity.y = obs.y - r; }
                        else                              { nx = 0; ny =  1; entity.y = obs.y + obs.h + r; }
                    } else {
                        const d = Math.sqrt(distSq);
                        nx = dx / d; ny = dy / d;
                        entity.x = closestX + nx * r;
                        entity.y = closestY + ny * r;
                    }
                    this._resolveCollision(entity, obs, nx, ny);
                    return { hit: true, obstacle: obs, type: obs.type, speed: this.getSpeed(entity) };
                }
            }
        }
        return { hit: false, obstacle: null, type: null, speed: 0 };
    }

    _resolveCollision(entity, obs, nx, ny) {
        const bounce = obs.bounce || this.bounce;
        const traction = obs.traction || 1.0;
        const dot = entity.vx * nx + entity.vy * ny;
        const vnx = dot * nx, vny = dot * ny;
        const vtx = entity.vx - vnx, vty = entity.vy - vny;
        entity.vx = (vtx * traction) - (vnx * bounce);
        entity.vy = (vty * traction) - (vny * bounce);
    }

    /**
     * Returns the current speed of an entity.
     * @param {{vx: number, vy: number}} entity
     * @returns {number}
     */
    getSpeed(entity) {
        return Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
    }
}
