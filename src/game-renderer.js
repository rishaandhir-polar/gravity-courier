/**
 * Handles all canvas drawing for the game.
 * Receives game state as arguments — no direct coupling to Game class internals.
 */

import { PACKAGE_RADIUS, MAX_HEALTH } from './constants.js';

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
        const { width: W, height: H } = this.canvas;
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth   = 1;
        const step = 60;
        for (let x = 0; x < W; x += step) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += step) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
    }

    drawDestination(destination) {
        const { x, y, w, h } = destination;
        const pulse = 0.3 + 0.15 * Math.sin(Date.now() / 1000 * 3);
        const ctx   = this.ctx;

        ctx.save();
        ctx.shadowBlur  = 20;
        ctx.shadowColor = '#00f2ff';
        ctx.fillStyle   = `rgba(0, 242, 255, ${pulse})`;
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth   = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0,242,255,0.9)';
        ctx.font      = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DROP ZONE', x + w / 2, y - 6);
        ctx.restore();
    }

    drawObstacles(obstacles) {
        const ctx = this.ctx;
        obstacles.forEach(obs => {
            const color = obs.color || (obs.type === 'hazard' ? '#ff2d55' : '#b4c8ff');
            ctx.save();
                        ctx.fillStyle   = `${color}${obs.type === 'wall' ? '14' : '40'}`; 
            ctx.strokeStyle = color;
            ctx.lineWidth   = 1.5;
            
            if (obs.type !== 'wall') {
                ctx.shadowBlur  = 10;
                ctx.shadowColor = color;
            }

            ctx.beginPath();
            if (obs.shape === 'circle') {
                ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
            } else {
                if (ctx.roundRect) ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 4);
                else ctx.rect(obs.x, obs.y, obs.w, obs.h);
            }
            ctx.fill();
            ctx.stroke();
            if (obs.type !== 'wall') {
                ctx.fillStyle = color;
                const label   = obs.type.toUpperCase();
                const maxW    = (obs.shape === 'circle' ? obs.radius * 1.6 : obs.w * 0.85);
                ctx.font      = `bold ${Math.min(8, 8 * (maxW / Math.max(1, ctx.measureText(label).width)))}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(label, obs.shape === 'circle' ? obs.x : obs.x + obs.w / 2, obs.shape === 'circle' ? obs.y + 3 : obs.y + obs.h / 2 + 3);
            }
            ctx.restore();
        });
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
        if (!pkg || !destination) return;
        const dx = destination.x + destination.w / 2 - pkg.x;
        const dy = destination.y + destination.h / 2 - pkg.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) return; // Hide when close

        const angle = Math.atan2(dy, dx);
        const orbit = 35;
        const ctx   = this.ctx;

        ctx.save();
        ctx.translate(pkg.x + Math.cos(angle) * orbit, pkg.y + Math.sin(angle) * orbit);
        ctx.rotate(angle);
        ctx.fillStyle   = 'rgba(0, 242, 255, 0.7)';
        ctx.shadowBlur  = 8;
        ctx.shadowColor = '#00f2ff';
        ctx.beginPath();
        ctx.moveTo(8, 0); ctx.lineTo(-6, -5); ctx.lineTo(-6, 5); ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawCollectibles(collectibles) {
        const ctx = this.ctx;
        const time = Date.now() / 1000;
        collectibles.forEach(c => {
            const timeOffset = (c.x + c.y) * 0.1; // Unique pulse offset
            const bounce = Math.sin(time * 4 + timeOffset) * 5;
            const s = 9;
            ctx.save();
            ctx.translate(c.x, c.y + bounce);
            ctx.rotate(time * 2 + timeOffset);
            ctx.shadowBlur  = 20;
            ctx.shadowColor = '#ffd700';
            ctx.fillStyle   = `rgba(255, 215, 0, ${0.8 + Math.sin(time * 5) * 0.2})`;
            ctx.beginPath();
            ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0); ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
    }

    drawGravityArrow() {
        const { width: W, height: H } = this.canvas;
        const grav  = this.gravity.getVector(1);
        const cx    = W - 40;
        const cy    = H - 40;
        const len   = 22;
        const ex    = cx + grav.x * len;
        const ey    = cy + grav.y * len;
        const angle = Math.atan2(ey - cy, ex - cx);
        const ctx   = this.ctx;

        ctx.save();
        ctx.strokeStyle = 'rgba(0,242,255,0.6)';
        ctx.fillStyle   = 'rgba(0,242,255,0.6)';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 7 * Math.cos(angle - 0.4), ey - 7 * Math.sin(angle - 0.4));
        ctx.lineTo(ex - 7 * Math.cos(angle + 0.4), ey - 7 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}
