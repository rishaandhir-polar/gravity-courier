import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicsCore } from '../src/physics-core.js';

describe('PhysicsCore', () => {
    let physics;

    beforeEach(() => {
        physics = new PhysicsCore(0.98, 0.5);
    });

    // ── applyForce ────────────────────────────────────────────────────────────
    describe('applyForce', () => {
        it('adds force to velocity', () => {
            const e = { x: 0, y: 0, vx: 0, vy: 0 };
            physics.applyForce(e, { x: 3, y: -2 });
            expect(e.vx).toBe(3);
            expect(e.vy).toBe(-2);
        });

        it('accumulates multiple forces', () => {
            const e = { x: 0, y: 0, vx: 1, vy: 1 };
            physics.applyForce(e, { x: 2, y: 3 });
            expect(e.vx).toBe(3);
            expect(e.vy).toBe(4);
        });
    });

    // ── updatePosition ────────────────────────────────────────────────────────
    describe('updatePosition', () => {
        it('moves entity by velocity', () => {
            const e = { x: 10, y: 20, vx: 5, vy: -3 };
            physics.updatePosition(e);
            expect(e.x).toBe(15);
            expect(e.y).toBe(17);
        });

        it('applies friction to velocity', () => {
            const e = { x: 0, y: 0, vx: 10, vy: 10 };
            physics.updatePosition(e);
            expect(e.vx).toBeCloseTo(9.8);
            expect(e.vy).toBeCloseTo(9.8);
        });
    });

    // ── checkBounds ───────────────────────────────────────────────────────────
    describe('checkBounds', () => {
        const bounds = { width: 100, height: 100 };

        it('returns false when entity is within bounds', () => {
            const e = { x: 50, y: 50, vx: 1, vy: 1, radius: 10 };
            expect(physics.checkBounds(e, bounds)).toBe(false);
        });

        it('bounces off right wall', () => {
            const e = { x: 95, y: 50, vx: 10, vy: 0, radius: 10 };
            const hit = physics.checkBounds(e, bounds);
            expect(hit).toBe(true);
            expect(e.x).toBe(90);
            expect(e.vx).toBeLessThan(0);
        });

        it('bounces off left wall', () => {
            const e = { x: 5, y: 50, vx: -10, vy: 0, radius: 10 };
            const hit = physics.checkBounds(e, bounds);
            expect(hit).toBe(true);
            expect(e.x).toBe(10);
            expect(e.vx).toBeGreaterThan(0);
        });

        it('bounces off top wall', () => {
            const e = { x: 50, y: 5, vx: 0, vy: -10, radius: 10 };
            const hit = physics.checkBounds(e, bounds);
            expect(hit).toBe(true);
            expect(e.y).toBe(10);
            expect(e.vy).toBeGreaterThan(0);
        });

        it('bounces off bottom wall', () => {
            const e = { x: 50, y: 95, vx: 0, vy: 10, radius: 10 };
            const hit = physics.checkBounds(e, bounds);
            expect(hit).toBe(true);
            expect(e.y).toBe(90);
            expect(e.vy).toBeLessThan(0);
        });
    });

    // ── checkObstacles ────────────────────────────────────────────────────────
    describe('checkObstacles', () => {
        const wallObs   = [{ x: 40, y: 40, w: 20, h: 20, type: 'wall' }];
        const hazardObs = [{ x: 40, y: 40, w: 20, h: 20, type: 'hazard' }];

        it('returns no hit when entity is far from obstacles', () => {
            const e = { x: 10, y: 10, vx: 0, vy: 0, radius: 5 };
            const result = physics.checkObstacles(e, wallObs);
            expect(result.hit).toBe(false);
            expect(result.type).toBeNull();
        });

        it('returns no hit for empty obstacle list', () => {
            const e = { x: 50, y: 50, vx: 0, vy: 0, radius: 10 };
            expect(physics.checkObstacles(e, []).hit).toBe(false);
        });

        it('detects collision with wall obstacle', () => {
            const e = { x: 44, y: 50, vx: 5, vy: 0, radius: 8 };
            const result = physics.checkObstacles(e, wallObs);
            expect(result.hit).toBe(true);
            expect(result.type).toBe('wall');
        });

        it('detects collision with hazard obstacle', () => {
            const e = { x: 44, y: 50, vx: 5, vy: 0, radius: 8 };
            const result = physics.checkObstacles(e, hazardObs);
            expect(result.hit).toBe(true);
            expect(result.type).toBe('hazard');
        });

        it('resolves entity approaching from left (normal path)', () => {
            // center x=36, radius=8 → right edge at 44, overlaps obs.x=40
            const e = { x: 36, y: 50, vx: 5, vy: 0, radius: 8 };
            physics.checkObstacles(e, wallObs);
            expect(e.x).toBeCloseTo(32, 0); // pushed to obs.x - r = 32
        });

        it('ejects left when left overlap is shortest (embedded)', () => {
            // center (44,50): overlapL=4, overlapR=16, overlapT=10, overlapB=10 → push left
            const e = { x: 44, y: 50, vx: 0, vy: 0, radius: 8 };
            physics.checkObstacles(e, wallObs);
            expect(e.x).toBe(32); // obs.x - r = 40 - 8
        });

        it('ejects right when right overlap is shortest (embedded)', () => {
            // center (56,50): overlapL=16, overlapR=4, overlapT=10, overlapB=10 → push right
            const e = { x: 56, y: 50, vx: 0, vy: 0, radius: 8 };
            physics.checkObstacles(e, wallObs);
            expect(e.x).toBe(68); // obs.x + obs.w + r = 60 + 8
        });

        it('ejects upward when top overlap is shortest (embedded)', () => {
            // center (50,44): overlapT=4, overlapB=16, overlapL=10, overlapR=10 → push up
            const e = { x: 50, y: 44, vx: 0, vy: 0, radius: 8 };
            physics.checkObstacles(e, wallObs);
            expect(e.y).toBe(32); // obs.y - r = 40 - 8
        });

        it('ejects downward when bottom overlap is shortest (embedded)', () => {
            // center (50,56): overlapT=16, overlapB=4, overlapL=10, overlapR=10 → push down
            const e = { x: 50, y: 56, vx: 0, vy: 0, radius: 8 };
            physics.checkObstacles(e, wallObs);
            expect(e.y).toBe(68); // obs.y + obs.h + r = 60 + 8
        });
    });

    // ── getSpeed ──────────────────────────────────────────────────────────────
    describe('getSpeed', () => {
        it('returns 0 for stationary entity', () => {
            expect(physics.getSpeed({ vx: 0, vy: 0 })).toBe(0);
        });

        it('returns correct speed for moving entity', () => {
            expect(physics.getSpeed({ vx: 3, vy: 4 })).toBe(5); // 3-4-5 triangle
        });
    });
});
