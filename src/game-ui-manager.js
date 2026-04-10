/**
 * Manages all HUD and Overlay DOM interactions.
 */
export class GameUIManager {
    constructor(callbacks) {
        this.callbacks = callbacks; // e.g., onRestart, onNextLevel, onMenu
        this._bindStaticButtons();
        this._bindHUDToggles();
    }

    _bindStaticButtons() {
        document.getElementById('retry-btn').onclick = () => this.callbacks.onRestart();
        // Next level button is dynamic, bound in showWin
    }

    _bindHUDToggles() {
        const toggleBtn = document.getElementById('hud-toggle');
        const panel     = document.getElementById('status-panel');
        
        if (toggleBtn && panel) {
            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                panel.classList.toggle('collapsed');
            };
        }
    }

    updateHUD({ gravityLabel, rotations, time, health, credits }) {
        if (gravityLabel) document.getElementById('gravity-dir').innerText = gravityLabel;
        if (rotations !== undefined) document.getElementById('rotation-count').innerText = rotations;
        if (credits !== undefined) document.getElementById('credit-count').innerText = credits;
        
        const timerEl = document.getElementById('timer-display');
        if (time !== undefined) {
            timerEl.innerText = Math.max(0, Math.ceil(time));
            timerEl.classList.toggle('urgent', time <= 10);
        }
        
        const healthFill = document.getElementById('health-fill');
        if (health !== undefined) {
            healthFill.style.width      = `${health}%`;
            healthFill.style.background = health > 50 ? 'var(--accent)' : health > 25 ? '#ffcc00' : 'var(--danger)';
        }
    }

    showOverlay(id, active = true) {
        const overlay = document.getElementById(id);
        if (overlay) overlay.classList.toggle('active', active);
    }

    hideAllOverlays() {
        ['menu-overlay', 'game-over-overlay', 'win-overlay', 'editor-overlay'].forEach(id => {
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

    toggleHUD(visible = true) {
        const panel = document.getElementById('status-panel');
        if (panel) panel.style.display = visible ? 'block' : 'none';
    }

    initMenu(onStart, onEditor) {
        document.getElementById('start-game-btn').onclick = () => onStart(1);
        document.getElementById('editor-mode-btn').onclick = () => onEditor();
        this.showOverlay('menu-overlay');
    }

    showToast(msg, duration = 2500) {
        const toast = document.getElementById('notification-toast');
        const text  = document.getElementById('notification-msg');
        if (!toast || !text) return;

        if (this._toastTimeout) clearTimeout(this._toastTimeout);
        
        text.innerText = msg;
        toast.classList.add('active');
        
        this._toastTimeout = setTimeout(() => {
            toast.classList.remove('active');
        }, duration);
    }
}
