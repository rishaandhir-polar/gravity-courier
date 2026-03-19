import { describe, it, expect } from 'vitest';
import { LevelGenerator } from '../src/level-generator.js';

describe('LevelGenerator', () => {
    it('generates a valid level structure', () => {
        const level = LevelGenerator.generate(6);
        expect(level).toHaveProperty('id', 6);
        expect(level).toHaveProperty('packageStart');
        expect(level).toHaveProperty('destination');
        expect(level.obstacles).toBeInstanceOf(Array);
    });

    it('increases difficulty over level IDs', () => {
        const lv6 = LevelGenerator.generate(6);
        const lv20 = LevelGenerator.generate(20);
        
        // Higher levels should generally have more obstacles
        // (Note: randomness might cause local fluctuations, but the logic should scale)
        expect(lv20.obstacles.length).toBeGreaterThanOrEqual(lv6.obstacles.length);
        
        // Destination should be smaller
        expect(lv20.destination.fw).toBeLessThan(lv6.destination.fw);
    });

    it('generates deterministic levels for the same seed', () => {
        const l1 = LevelGenerator.generate(10);
        const l2 = LevelGenerator.generate(10);
        expect(l1).toEqual(l2);
    });
});
