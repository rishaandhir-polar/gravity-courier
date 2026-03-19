/**
 * Manages all HUD and Overlay DOM interactions.
 */
export class GameUIManager {
    constructor(callbacks) {
        this.callbacks = callbacks; // e.g., onRestart, onNextLevel, onMenu
        this._bindStaticButtons();
    }

    _bindStaticButtons() {
        document.getElementById('retry-btn').onclick = () => this.callbacks.onRestart();
        // Next level button is dynamic, bound in showWin
    }

    updateHUD({ gravityLabel, rotations, time, health }) {
        document.getElementById('gravity-dir').innerText    = gravityLabel;
        document.getElementById('rotation-count').innerText = rotations;
        const timerEl = document.getElementById('timer-display');
        timerEl.innerText = Math.max(0, Math.ceil(time));
        timerEl.classList.toggle('urgent', time <= 10);
        
        const healthFill = document.getElementById('health-fill');
        healthFill.style.width      = `${health}%`;
        healthFill.style.background = health > 50 ? 'var(--accent)' : health > 25 ? '#ffcc00' : 'var(--danger)';
    }

    showOverlay(id, active = true) {
        const overlay = document.getElementById(id);
        if (overlay) overlay.classList.toggle('active', active);
    }

    hideAllOverlays() {
        ['menu-overlay', 'game-over-overlay', 'win-overlay'].forEach(id => {
            this.showOverlay(id, false);
        });
    }

    showWin(rotations, health, onNext) {
        document.getElementById('win-rotations').innerText = rotations;
        document.getElementById('win-health').innerText    = Math.round(health);
        const btn = document.getElementById('next-level-btn');
        btn.onclick = onNext;
        this.showOverlay('win-overlay');
    }

    showGameOver(reason) {
        const msg = reason === 'timeout' 
            ? 'Time expired. Sector locked down.' 
            : 'Package integrity lost. Sector offline.';
        document.getElementById('game-over-msg').innerText = msg;
        this.showOverlay('game-over-overlay');
    }

    initMenu(onStart) {
        document.getElementById('start-game-btn').onclick = () => onStart(1);
        this.showOverlay('menu-overlay');
    }
}
