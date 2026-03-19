/**
 * Manages the world's gravity orientation and vector calculations.
 * Gravity angle represents the screen rotation in degrees (clockwise).
 * 0 = upright (gravity pulls down), 90 = rotated CW (gravity pulls left in world space), etc.
 */
export class GravityManager {
    constructor() {
        this.angle = 0; // cumulative rotation in degrees (can exceed 360)
    }

    /**
     * Rotates the screen (and thus gravity direction) clockwise by 90 degrees.
     */
    rotateClockwise() {
        this.angle += 90;
    }

    /**
     * Rotates the screen (and thus gravity direction) counter-clockwise by 90 degrees.
     */
    rotateCounterClockwise() {
        this.angle -= 90;
    }

    /**
     * Returns the normalized display angle (0-359) for CSS transform.
     * @returns {number}
     */
    getDisplayAngle() {
        return ((this.angle % 360) + 360) % 360;
    }

    /**
     * Returns the raw cumulative angle (for smooth CSS transitions).
     * @returns {number}
     */
    getRawAngle() {
        return this.angle;
    }

    /**
     * Calculates the gravity force vector in world (canvas) space.
     * When screen rotates clockwise by N degrees, gravity vector rotates counter-clockwise by N degrees.
     * @param {number} strength
     * @returns {{x: number, y: number}}
     */
    getVector(strength) {
        // Base gravity is always "down" on screen (positive Y in canvas coords).
        // When screen rotates CW by `angle`, the world-space gravity direction rotates CCW.
        const rad = this.angle * (Math.PI / 180);
        return {
            x: (Math.sin(rad) * strength) || 0,  // || 0 eliminates -0 from floating point
            y: (Math.cos(rad) * strength) || 0
        };
    }

    /**
     * Returns a human-readable direction label.
     * @returns {string}
     */
    getDirectionLabel() {
        const normalized = this.getDisplayAngle();
        const labels = { 0: 'DOWN', 90: 'RIGHT', 180: 'UP', 270: 'LEFT' };
        return labels[normalized] || 'DOWN';
    }

    /**
     * Resets angle to 0.
     */
    reset() {
        this.angle = 0;
    }
}
