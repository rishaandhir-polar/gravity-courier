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
        } catch (e) { console.error('Tilt permission denied', e); return; }
    }

    let lastTilt = 0;
    const THRESHOLD = 35; // degrees of tilt to trigger
    const DEBOUNCE  = 800; // ms between tilt rotations

    window.addEventListener('deviceorientation', (e) => {
        if (getState() !== 'PLAYING' || Date.now() - lastTilt < DEBOUNCE) return;
        
        // gamma is left-to-right tilt (-90 to 90)
        // beta is front-to-back tilt (-180 to 180)
        if (Math.abs(e.gamma) > THRESHOLD) {
            onRotate(e.gamma > 0 ? 'cw' : 'ccw');
            lastTilt = Date.now();
        }
    });
}
