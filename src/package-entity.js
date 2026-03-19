import { PACKAGE_RADIUS, MAX_HEALTH } from './constants.js';

export class Package {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.vx = 0; this.vy = 0;
        this.radius = PACKAGE_RADIUS;
        this.health = MAX_HEALTH;
        this.trail  = [];
    }

    get destroyed() { return this.health <= 0; }

    damage(amount) {
        this.health = Math.max(0, this.health - amount);
    }

    recordTrail() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 18) this.trail.shift();
    }
}
