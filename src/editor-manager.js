import { EditorRenderer } from './editor-renderer.js';

/**
 * Manages the Level Editor mode.
 */
export class EditorManager {
    constructor(canvas, gRenderer, ui) {
        this.canvas = canvas;
        this.gRenderer = gRenderer; // Original game renderer for base objects
        this.ui = ui;
        this.renderer = new EditorRenderer(canvas.getContext('2d'), canvas);
        this.active = false;
        
        this.campaign = [this._createEmptyLevel(1)];
        this.currentIndex = 0;
        
        this.currentTool = 'wall';
        this.selectedObject = null;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };

        this.PROP_MAP = {
            wall:    { color: '#b4c8ff', bounce: 0.45, traction: 0.8 },
            hazard:  { color: '#ff2d55', bounce: 0.3,  traction: 0.6 },
            slick:   { color: '#00ffff', bounce: 0.1,  traction: 0.999 },
            bouncy:  { color: '#ff00ff', bounce: 0.95, traction: 0.95 },
            sticky:  { color: '#32cd32', bounce: 0.05, traction: 0.2 },
            repair:  { color: '#00ff99', bounce: 0.3,  traction: 0.7 },
            shatter: { color: '#ffffff', bounce: 0.2,  traction: 0.5 },
            accel:   { color: '#ffaa00', bounce: 1.15, traction: 1.0 },
        };

        this._loadCampaign();
        this._setupEvents();
        this._updateUI();
    }

    get level() { return this.campaign[this.currentIndex]; }
    set level(val) { this.campaign[this.currentIndex] = val; }

    _createEmptyLevel(num) {
        return {
            id: `custom-${num-1}`,
            name: `CUSTOM SECTOR ${num}`,
            packageStart: { fx: 0.1, fy: 0.5 },
            destination: { fx: 0.8, fy: 0.5, fw: 0.1, fh: 0.1 },
            time: 60,
            obstacles: [],
            collectibles: []
        };
    }

    _saveCampaign() {
        localStorage.setItem('gravity-courier-custom-campaign', JSON.stringify(this.campaign));
        if (this.ui) this.ui.showToast('CAMPAIGN ENCRYPTED AND SAVED.');
    }

    _loadCampaign() {
        const saved = localStorage.getItem('gravity-courier-custom-campaign');
        if (saved) {
            try {
                this.campaign = JSON.parse(saved);
                this.currentIndex = 0;
            } catch (e) { console.error('Failed to load campaign:', e); }
        }
    }

    start() {
        this.active = true;
        document.getElementById('editor-overlay').classList.add('active');
        this.gRenderer.clear();
    }

    stop() {
        this.active = false;
        document.getElementById('editor-overlay').classList.remove('active');
    }

    _setupEvents() {
        const toolbox = document.querySelector('.editor-toolbox');
        toolbox.addEventListener('click', (e) => {
            const btn = e.target.closest('.tool-btn');
            if (btn) {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
            }
        });

        this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        window.addEventListener('mouseup', (e) => this._onMouseUp(e));

        document.getElementById('editor-exit-btn').onclick = () => location.reload();
        document.getElementById('editor-save-btn').onclick = () => this._saveCampaign();
        document.getElementById('editor-play-btn').onclick = () => {
             const time = parseInt(document.getElementById('editor-time-input').value) || 60;
             this.level.time = time; // Ensure time is synced before playtest
             const event = new CustomEvent('editor-playtest', { detail: { level: this.level } });
             window.dispatchEvent(event);
        };

        const timeInput = document.getElementById('editor-time-input');
        timeInput.onchange = () => { this.level.time = parseInt(timeInput.value) || 60; };

        document.getElementById('editor-prev-level').onclick = () => {
            if (this.currentIndex > 0) { this.currentIndex--; this._updateUI(); }
        };
        document.getElementById('editor-next-level').onclick = () => {
            if (this.currentIndex < this.campaign.length - 1) { this.currentIndex++; this._updateUI(); }
        };
        document.getElementById('editor-add-level').onclick = () => {
            this.campaign.push(this._createEmptyLevel(this.campaign.length + 1));
            this.currentIndex = this.campaign.length - 1;
            this._updateUI();
        };
        document.getElementById('editor-del-level').onclick = () => {
            if (this.campaign.length > 1) {
                this.campaign.splice(this.currentIndex, 1);
                this.currentIndex = Math.max(0, this.currentIndex - 1);
                this._updateUI();
            }
        };

        window.addEventListener('keydown', (e) => {
            if (!this.active) return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                this._deleteSelected();
            }
        });

        const nameInput = document.getElementById('editor-level-name');
        nameInput.oninput = () => { this.level.name = nameInput.value; };

        const headerBtn = document.getElementById('header-toggle');
        const toolboxBtn = document.getElementById('toolbox-toggle');
        const header = document.getElementById('editor-header');

        headerBtn.onclick = () => header.classList.toggle('collapsed');
        toolboxBtn.onclick = () => toolbox.classList.toggle('collapsed');
    }

    _updateUI() {
        // Re-index campaign IDs 
        this.campaign.forEach((lvl, i) => {
            lvl.id = `custom-${i}`;
        });

        document.getElementById('editor-level-name').value = this.level.name || `CUSTOM SECTOR ${this.currentIndex + 1}`;
        document.getElementById('editor-time-input').value = this.level.time || 60;
        this.selectedObject = null;
    }

    getCampaignLevel(index) {
        return this.campaign[index];
    }

    _findTarget(fx, fy) {
        // Search obstacles
        for (let o of this.level.obstacles) {
            if (o.shape === 'circle') {
                if (Math.hypot(fx - o.fx, fy - o.fy) < (o.fr || 0.05)) return { type: 'obstacle', data: o };
            } else {
                if (fx >= o.fx && fx <= o.fx + (o.fw || 0.1) && fy >= o.fy && fy <= o.fy + (o.fh || 0.1)) return { type: 'obstacle', data: o };
            }
        }
        // Search goal
        const d = this.level.destination;
        if (fx >= d.fx && fx <= d.fx + d.fw && fy >= d.fy && fy <= d.fy + d.fh) return { type: 'goal', data: d };
        // Search collectibles
        for (let c of this.level.collectibles) {
            if (Math.hypot(fx - c.fx, fy - c.fy) < 0.03) return { type: 'collectible', data: c };
        }
        return null;
    }

    _deleteSelected() {
        if (!this.selectedObject) return;
        if (this.selectedObject.type === 'obstacle') {
            this.level.obstacles = this.level.obstacles.filter(o => o !== this.selectedObject.data);
        } else if (this.selectedObject.type === 'collectible') {
            this.level.collectibles = this.level.collectibles.filter(c => c !== this.selectedObject.data);
        }
        this.selectedObject = null;
    }

    _onMouseDown(e) {
        if (!this.active) return;
        const rect = this.canvas.getBoundingClientRect();
        const fx = (e.clientX - rect.left) / rect.width;
        const fy = (e.clientY - rect.top) / rect.height;

        const target = this._findTarget(fx, fy);
        if (target) {
            this.selectedObject = target;
            if (this.currentTool === 'delete') {
                this._deleteSelected();
                return;
            }
            if (this.currentTool === 'shape' && target.type === 'obstacle') {
                const o = target.data;
                if (o.shape === 'circle') {
                    o.shape = 'rect';
                    o.fw = (o.fr || 0.05) * 2;
                    o.fh = (o.fr || 0.05) * 2;
                    o.fx -= o.fr || 0.05;
                    o.fy -= o.fr || 0.05;
                } else {
                    o.shape = 'circle';
                    o.fr = (o.fw || 0.1) / 2;
                    o.fx += (o.fw || 0.1) / 2;
                    o.fy += (o.fh || 0.1) / 2;
                }
                return;
            }
            if (this.currentTool === 'rotate' && target.type === 'obstacle') {
                const o = target.data;
                this.isDragging = true;
                const cx = o.fx + (o.fw || 0.1) / 2;
                const cy = o.fy + (o.fh || 0.1) / 2;
                this.dragStart = { fx, fy, ox: o.fx, oy: o.fy, startAngle: o.angle || 0, cx, cy };
                return;
            }
            this.isDragging = true;
            this.dragStart = { fx, fy, ox: target.data.fx, oy: target.data.fy };
            return;
        }

        if (this.currentTool === 'delete' || this.currentTool === 'scale' || this.currentTool === 'shape' || this.currentTool === 'rotate') {
            this.selectedObject = null;
            return;
        }

        if (this.PROP_MAP[this.currentTool]) {
            const newItem = { 
                fx: fx - 0.05, fy: fy - 0.05, fw: 0.1, fh: 0.1, 
                type: this.currentTool,
                ...this.PROP_MAP[this.currentTool]
            };
            this.level.obstacles.push(newItem);
            this.selectedObject = { type: 'obstacle', data: newItem };
            this.isDragging = true;
            this.dragStart = { fx, fy, ox: newItem.fx, oy: newItem.fy };
        } else if (this.currentTool === 'collectible') {
            const newItem = { fx, fy, type: 'credit' };
            this.level.collectibles.push(newItem);
            this.selectedObject = { type: 'collectible', data: newItem };
            this.isDragging = true;
            this.dragStart = { fx, fy, ox: fx, oy: fy };
        } else if (this.currentTool === 'spawn') {
            this.level.packageStart = { fx, fy };
        } else if (this.currentTool === 'goal') {
            this.level.destination.fx = fx - 0.05;
            this.level.destination.fy = fy - 0.05;
            this.selectedObject = { type: 'goal', data: this.level.destination };
            this.isDragging = true;
            this.dragStart = { fx, fy, ox: this.level.destination.fx, oy: this.level.destination.fy };
        }
    }

    _onMouseMove(e) {
        if (!this.active || !this.isDragging || !this.selectedObject) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const fx = (e.clientX - rect.left) / rect.width;
        const fy = (e.clientY - rect.top) / rect.height;

        const dx = fx - this.dragStart.fx;
        const dy = fy - this.dragStart.fy;

        if (this.currentTool === 'scale' && (this.selectedObject.type === 'obstacle' || this.selectedObject.type === 'goal')) {
            const data = this.selectedObject.data;
            
            if (data.shape === 'circle') {
                data.fr = Math.max(0.01, (data.fr || 0.05) + dx);
            } else {
                const centerX = data.fx + (data.fw || 0.1) / 2;
                const centerY = data.fy + (data.fh || 0.1) / 2;

                if (this.dragStart.fx < centerX) { // Left side handle
                    data.fx = Math.min(centerX - 0.01, data.fx + dx);
                    data.fw = Math.max(0.02, (data.fw || 0.1) - dx);
                } else { // Right side handle
                    data.fw = Math.max(0.02, (data.fw || 0.1) + dx);
                }

                if (this.dragStart.fy < centerY) { // Top handle
                    data.fy = Math.min(centerY - 0.01, data.fy + dy);
                    data.fh = Math.max(0.02, (data.fh || 0.1) - dy);
                } else { // Bottom handle
                    data.fh = Math.max(0.02, (data.fh || 0.1) + dy);
                }
            }

            this.dragStart.fx = fx;
            this.dragStart.fy = fy;
        } else if (this.currentTool === 'rotate' && this.selectedObject.type === 'obstacle') {
            const data = this.selectedObject.data;
            const currentAngle = Math.atan2(fy - this.dragStart.cy, fx - this.dragStart.cx);
            const initialAngle = Math.atan2(this.dragStart.fy - this.dragStart.cy, this.dragStart.fx - this.dragStart.cx);
            data.angle = this.dragStart.startAngle + (currentAngle - initialAngle);
        } else {
            this.selectedObject.data.fx = this.dragStart.ox + dx;
            this.selectedObject.data.fy = this.dragStart.oy + dy;
        }
    }

    _onMouseUp(e) {
        if (!this.active) return;
        this.isDragging = false;
    }

    draw() {
        if (!this.active) return;
        const W = this.canvas.width;
        const H = this.canvas.height;

        this.renderer.drawGrid();

        const resolved = this._resolve(W, H);
        this.gRenderer.drawDestination(resolved.destination);
        this.gRenderer.drawCollectibles(resolved.collectibles);
        this.gRenderer.drawObstacles(resolved.obstacles);
        this.renderer.drawSpawnPoint(resolved.packageStart);

        if (this.selectedObject) {
            let data = this.selectedObject.data;
            if (this.selectedObject.type === 'collectible') {
                this.renderer.drawSelection({ x: data.fx * W, y: data.fy * H, w: 0, h: 0 }); // Collectibles are points
            } else {
                if (data.shape === 'circle') {
                    const r = (data.fr || 0.05) * W;
                    this.renderer.drawSelection({ x: data.fx * W - r, y: data.fy * H - r, w: r * 2, h: r * 2 });
                } else {
                    this.renderer.drawSelection({ 
                        x: data.fx * W, y: data.fy * H, 
                        w: (data.fw || 0.1) * W, h: (data.fh || 0.1) * H,
                        angle: data.angle 
                    });
                }
            }
        }
    }

    _resolve(W, H) {
        return {
            packageStart: { x: this.level.packageStart.fx * W, y: this.level.packageStart.fy * H },
            destination: {
                x: this.level.destination.fx * W, y: this.level.destination.fy * H,
                w: this.level.destination.fw * W, h: this.level.destination.fh * H
            },
            obstacles: this.level.obstacles.map(o => ({
                ...o,
                x: o.fx * W, y: o.fy * H,
                w: (o.fw || 0) * W, h: (o.fh || 0) * H,
                radius: (o.fr || 0) * W,
                angle: o.angle || 0
            })),
            collectibles: this.level.collectibles.map(c => ({
                x: c.fx * W, y: c.fy * H
            }))
        };
    }
}
