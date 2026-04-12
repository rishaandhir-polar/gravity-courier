/**
 * Handles all canvas drawing for the game.
 * Orchestrates specialized rendering functions from other modules.
 */

import { PACKAGE_RADIUS, MAX_HEALTH } from './constants.js';
import * as Scene from './scene-renderer.js';
import * as Accessory from './accessory-renderer.js';

export class GameRenderer {
    constructor(canvas, gravityManager) {
        this.canvas  = canvas;
        this.ctx     = canvas.getContext('2d');
        this.gravity = gravityManager;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        Scene.drawBackground(this.ctx, this.canvas.width, this.canvas.height);
    }

    drawDestination(destination) {
        Scene.drawDestination(this.ctx, destination);
    }

    drawObstacles(obstacles) {
        Scene.drawObstacles(this.ctx, obstacles);
    }

    drawPackageTrail(trail) {
        const ctx = this.ctx;
        for (let i = 0; i < trail.length; i++) {
            const alpha = (i / trail.length) * 0.4;
            const r     = PACKAGE_RADIUS * (i / trail.length) * 0.7;
            ctx.beginPath();
            ctx.arc(trail[i].x, trail[i].y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 242, 255, ${alpha})`;
            ctx.fill();
        }
    }

    drawPackage(pkg) {
        const { x, y, radius, health } = pkg;
        const healthRatio = health / MAX_HEALTH;
        const color = healthRatio > 0.5 ? '#ffffff' : healthRatio > 0.25 ? '#ffcc00' : '#ff2d55';
        const ctx   = this.ctx;
        const s     = radius;

        ctx.save();
        ctx.shadowBlur  = 18;
        ctx.shadowColor = color;
        ctx.fillStyle   = color;
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.roundRect(x - s, y - s, s * 2, s * 2, 4);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x + s * 0.5, y);
        ctx.moveTo(x, y - s * 0.5); ctx.lineTo(x, y + s * 0.5);
        ctx.stroke();
        ctx.restore();
    }

    drawParticles(particles) {
        const ctx = this.ctx;
        particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0, 2.5 * alpha), 0, Math.PI * 2);
            ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.fill();
        });
    }

    drawCompass(pkg, destination) {
        Accessory.drawCompass(this.ctx, pkg, destination);
    }

    drawCollectibles(collectibles) {
        Accessory.drawCollectibles(this.ctx, collectibles);
    }

    drawGravityArrow() {
        Accessory.drawGravityArrow(this.ctx, this.canvas.width, this.canvas.height, this.gravity);
    }
}
