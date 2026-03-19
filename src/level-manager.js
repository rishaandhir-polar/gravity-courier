import { LEVELS, resolveLevel } from './levels.js';
import { LevelGenerator } from './level-generator.js';

/**
 * Handles level discovery, loading, and procedural fallbacks.
 */
export class LevelManager {
    constructor() {
        this.currentId = 1;
    }

    getLevels() {
        return LEVELS; // Only return predefined ones for the start menu
    }

    findLevel(id) {
        let def = LEVELS.find(l => l.id === id);
        if (!def) {
            // Level is beyond predefined ones, generate it!
            def = LevelGenerator.generate(id);
        }
        return def;
    }

    resolve(def, width, height) {
        return resolveLevel(def, width, height);
    }

    getNextId(id) {
        return id + 1; // Infinite progression
    }
}
