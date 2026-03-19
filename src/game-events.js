/**
 * Handles all input event binding for the game.
 * Decoupled from Game — receives callbacks instead of direct references.
 */
export function bindInputEvents(getState, onRotate, onAction) {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { onAction(); return; }
        if (getState() !== 'PLAYING') return;
        if (e.key === 'ArrowRight') onRotate('cw');
        if (e.key === 'ArrowLeft')  onRotate('ccw');
    });

    let touchStartX = 0;
    window.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
    window.addEventListener('touchend', (e) => {
        if (getState() !== 'PLAYING') return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) onRotate(dx > 0 ? 'cw' : 'ccw');
    });
}

/**
 * Binds device tilt (accelerometer) events for mobile rotation.
 */
export async function bindTiltEvents(getState, onRotate) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission !== 'granted') return;
        } catch (e) { return; }
    }

    let lastRotation  = 0;
    let baseGamma     = null;
    let sustainStart  = 0;
    let pendingDir    = null;

    const THRESHOLD   = 45;   // Higher threshold for intentionality
    const DEBOUNCE    = 1000; // Longer debounce for stability
    const SUSTAIN_MS  = 200;  // Must hold tilt for this long

    window.addEventListener('deviceorientation', (e) => {
        if (getState() !== 'PLAYING' || Date.now() - lastRotation < DEBOUNCE) {
            baseGamma = null; // reset calibration when not playing
            return;
        }
        
        // Initial calibration on the first frame of gameplay
        if (baseGamma === null) { baseGamma = e.gamma; return; }

        const deltaGamma = e.gamma - baseGamma;
        const currentDir = Math.abs(deltaGamma) > THRESHOLD ? (deltaGamma > 0 ? 'cw' : 'ccw') : null;

        // Ignore if phone is nearly flat on a table (beta < 20)
        if (Math.abs(e.beta) < 20) return;

        if (currentDir && currentDir === pendingDir) {
            if (Date.now() - sustainStart > SUSTAIN_MS) {
                onRotate(currentDir);
                lastRotation = Date.now();
                pendingDir   = null;
                baseGamma    = e.gamma; // re-calibrate after rotation
            }
        } else if (currentDir) {
            pendingDir   = currentDir;
            sustainStart = Date.now();
        } else {
            pendingDir = null;
        }
    });
}
