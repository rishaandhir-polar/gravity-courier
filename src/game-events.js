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

let tiltBound = false;
let permissionGranted = false;

export async function bindTiltEvents(getState, onRotate) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function' && !permissionGranted) {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            permissionGranted = (permission === 'granted');
            if (!permissionGranted) return;
        } catch (e) { return; }
    } else {
        permissionGranted = true;
    }

    if (tiltBound) return;
    tiltBound = true;

    const DEG_TO_RAD = Math.PI / 180;
    window.addEventListener('deviceorientation', (e) => {
        const state = getState();
        if (state !== 'PLAYING') return;

        // In Portrait: gamma is X-tilt, beta is Y-tilt
        // In Landscape: beta is X-tilt, gamma is Y-tilt
        const isLandscape = window.innerWidth > window.innerHeight;
        const xField = isLandscape ? e.beta : e.gamma;
        const yField = isLandscape ? -e.gamma : e.beta;

        // Normalize to a 2D vector
        const gx = Math.max(-1, Math.min(1, xField / 45));
        const gy = Math.max(-1, Math.min(1, yField / 45));
        
        // Deadzone check (ignore center)
        if (Math.hypot(gx, gy) < 0.1) return;

        onRotate(gx, gy);
    });
}
