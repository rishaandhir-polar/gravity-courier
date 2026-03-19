/**
 * Manages the world's gravity orientation and vector calculations.
 * Gravity angle represents the screen rotation in degrees (clockwise).
 * 0 = upright (gravity pulls down), 90 = rotated CW (gravity pulls left in world space), etc.
 */
export class GravityManager {
    constructor() {
        this.angle = 0; // cumulative rotation in degrees (can exceed 360)
        this.vx = 0;
        this.vy = 1;
        this.useFreeVector = false;
    }

    /**
     * Enables and sets an arbitrary gravity vector for free-form tilt.
     * @param {number} x 
     * @param {number} y 
     */
    setFreeVector(x, y) {
        this.useFreeVector = true;
        this.vx = x;
        this.vy = y;
    }

    /**
     * Resets to discrete 90-degree snap mode.
     */
    resetToSnap() {
        this.useFreeVector = false;
        this.angle = 0;
    }

    /**
     * Rotates screen by 90 degrees (Snap mode).
     */
    rotateClockwise() {
        this.useFreeVector = false;
        this.angle += 90;
    }

    /**
     * Rotates screen by -90 degrees (Snap mode).
     */
    rotateCounterClockwise() {
        this.useFreeVector = false;
        this.angle -= 90;
    }

    getDisplayAngle() { return ((this.angle % 360) + 360) % 360; }
    getRawAngle()     { return this.angle; }

    /**
     * Calculates the gravity force vector in world (canvas) space.
     * @param {number} strength
     * @returns {{x: number, y: number}}
     */
    getVector(strength) {
        if (this.useFreeVector) {
            return { x: this.vx * strength, y: this.vy * strength };
        }
        const rad = this.angle * (Math.PI / 180);
        return {
            x: (Math.sin(rad) * strength) || 0,
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
