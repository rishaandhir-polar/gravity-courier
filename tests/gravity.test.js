import { describe, it, expect, beforeEach } from 'vitest';
import { GravityManager } from '../src/gravity-manager.js';

describe('GravityManager', () => {
    let gm;

    beforeEach(() => {
        gm = new GravityManager();
    });

    it('initializes with angle 0 (gravity DOWN)', () => {
        expect(gm.getDisplayAngle()).toBe(0);
        expect(gm.getRawAngle()).toBe(0);
    });

    it('rotateClockwise increments angle by 90', () => {
        gm.rotateClockwise();
        expect(gm.getDisplayAngle()).toBe(90);
        expect(gm.getRawAngle()).toBe(90);
    });

    it('rotateCounterClockwise decrements angle by 90', () => {
        gm.rotateCounterClockwise();
        expect(gm.getDisplayAngle()).toBe(270); // normalized: -90 → 270
        expect(gm.getRawAngle()).toBe(-90);
    });

    it('getDisplayAngle normalizes to 0–359 after multiple rotations', () => {
        gm.rotateClockwise(); // 90
        gm.rotateClockwise(); // 180
        gm.rotateClockwise(); // 270
        gm.rotateClockwise(); // 360 → 0
        expect(gm.getDisplayAngle()).toBe(0);
    });

    it('getVector returns correct DOWN vector at angle 0', () => {
        const v = gm.getVector(10);
        expect(Math.round(v.x)).toBe(0);
        expect(Math.round(v.y)).toBe(10);
    });

    it('getVector returns correct RIGHT vector after 1 CW rotation (90°)', () => {
        gm.rotateClockwise(); // screen rotated CW → gravity pulls RIGHT in world
        const v = gm.getVector(10);
        expect(Math.round(v.x)).toBe(10);
        expect(Math.round(v.y)).toBe(0);
    });

    it('getVector returns correct UP vector after 2 CW rotations (180°)', () => {
        gm.rotateClockwise();
        gm.rotateClockwise();
        const v = gm.getVector(10);
        // Use Math.abs to avoid -0 vs +0 Object.is inequality
        expect(Math.abs(Math.round(v.x))).toBe(0);
        expect(Math.round(v.y)).toBe(-10);
    });

    it('getDirectionLabel returns correct labels', () => {
        expect(gm.getDirectionLabel()).toBe('DOWN');
        gm.rotateClockwise();
        expect(gm.getDirectionLabel()).toBe('RIGHT');
        gm.rotateClockwise();
        expect(gm.getDirectionLabel()).toBe('UP');
        gm.rotateClockwise();
        expect(gm.getDirectionLabel()).toBe('LEFT');
    });

    it('reset returns angle to 0', () => {
        gm.rotateClockwise();
        gm.rotateClockwise();
        gm.reset();
        expect(gm.getRawAngle()).toBe(0);
        expect(gm.getDisplayAngle()).toBe(0);
    });
});
