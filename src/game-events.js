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
            baseGamma = null;
            return;
        }

        // Determine if we should use gamma (portrait) or beta (landscape)
        const isLandscape = window.innerWidth > window.innerHeight;
        const rawTilt    = isLandscape ? e.beta : e.gamma;
        
        // Initial calibration on the first frame of gameplay
        if (baseGamma === null) { baseGamma = rawTilt; return; }

        let deltaTilt = rawTilt - baseGamma;
        // Invert delta if in 'landscape-right' (simple detection based on beta sign if needed)
        // For simplicity, we assume standard landscape-primary
        const currentDir = Math.abs(deltaTilt) > THRESHOLD ? (deltaTilt > 0 ? 'cw' : 'ccw') : null;

        // Ignore if phone is nearly flat or totally vertical
        if (Math.abs(e.beta) < 15 || Math.abs(e.beta) > 165) return;

        if (currentDir && currentDir === pendingDir) {
            if (Date.now() - sustainStart > SUSTAIN_MS) {
                onRotate(currentDir);
                lastRotation = Date.now();
                pendingDir   = null;
                baseGamma    = rawTilt; 
            }
        } else if (currentDir) {
            pendingDir   = currentDir;
            sustainStart = Date.now();
        } else {
            pendingDir = null;
        }
    });
}
