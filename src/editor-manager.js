import { EditorRenderer } from './editor-renderer.js';
import { EditorState }    from './editor-state.js';
import * as Tools         from './editor-tools.js';

export class EditorManager {
    constructor(canvas, gRenderer, ui) {
        this.canvas    = canvas;
        this.gRenderer = gRenderer;
        this.ui        = ui;
        this.renderer  = new EditorRenderer(canvas.getContext('2d'), canvas);
        this.state     = new EditorState(ui);
        
        this.active         = false;
        this.currentTool    = 'wall';
        this.selectedObject = null;
        this.isDragging     = false;
        this.dragStart      = { x: 0, y: 0 };

        this._setupEvents();
        this._updateUI();
    }

    get level() { return this.state.level; }

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
        window.addEventListener('mouseup', () => { this.isDragging = false; });

        document.getElementById('editor-exit-btn').onclick = () => location.reload();
        document.getElementById('editor-save-btn').onclick = () => this.state.save();
        document.getElementById('editor-play-btn').onclick = () => {
             this.level.time = parseInt(document.getElementById('editor-time-input').value) || 60;
             const event = new CustomEvent('editor-playtest', { detail: { level: this.level } });
             window.dispatchEvent(event);
        };

        const timeInput = document.getElementById('editor-time-input');
        timeInput.onchange = () => { this.level.time = parseInt(timeInput.value) || 60; };

        document.getElementById('editor-prev-level').onclick = () => { if (this.state.prevLevel()) this._updateUI(); };
        document.getElementById('editor-next-level').onclick = () => { if (this.state.nextLevel()) this._updateUI(); };
        document.getElementById('editor-add-level').onclick = () => { this.state.addLevel(); this._updateUI(); };
        document.getElementById('editor-del-level').onclick = () => { if (this.state.deleteCurrentLevel()) this._updateUI(); };

        window.addEventListener('keydown', (e) => {
            if (this.active && (e.key === 'Delete' || e.key === 'Backspace')) this._deleteSelected();
        });

        const handleTouch = (e, callback) => {
            if (e.touches && e.touches.length > 0) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                callback({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => e.preventDefault() });
                e.preventDefault();
            }
        };

        this.canvas.addEventListener('touchstart', (e) => handleTouch(e, (me) => this._onMouseDown(me)), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => handleTouch(e, (me) => this._onMouseMove(me)), { passive: false });
        this.canvas.addEventListener('touchend', (e) => { this.isDragging = false; e.preventDefault(); }, { passive: false });
        this.canvas.oncontextmenu = (e) => e.preventDefault();

        const nameInput = document.getElementById('editor-level-name');
        nameInput.oninput = () => { this.level.name = nameInput.value; };
        
        document.getElementById('header-toggle').onclick = () => document.getElementById('editor-header').classList.toggle('collapsed');
        document.getElementById('toolbox-toggle').onclick = () => toolbox.classList.toggle('collapsed');
    }

    _updateUI() {
        this.state.refreshIndices();
        document.getElementById('editor-level-name').value = this.level.name || `CUSTOM SECTOR ${this.state.currentIndex + 1}`;
        document.getElementById('editor-time-input').value = this.level.time || 60;
        this.selectedObject = null;
    }

    getCampaignLevel(index) { return this.state.campaign[index]; }

    _findTarget(fx, fy) {
        for (let o of this.level.obstacles) {
            if (o.shape === 'circle') {
                if (Math.hypot(fx - o.fx, fy - o.fy) < (o.fr || 0.05)) return { type: 'obstacle', data: o };
            } else if (fx >= o.fx && fx <= o.fx + (o.fw || 0.1) && fy >= o.fy && fy <= o.fy + (o.fh || 0.1)) {
                return { type: 'obstacle', data: o };
            }
        }
        const d = this.level.destination;
        if (fx >= d.fx && fx <= d.fx + d.fw && fy >= d.fy && fy <= d.fy + d.fh) return { type: 'goal', data: d };
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
        const fx = (e.clientX - rect.left) / rect.width, fy = (e.clientY - rect.top) / rect.height;
        const target = this._findTarget(fx, fy);

        if (target) {
            this.selectedObject = target;
            if (this.currentTool === 'delete') return this._deleteSelected();
            if (this.currentTool === 'shape' && target.type === 'obstacle') return Tools.toggleShape(target.data);
            if (this.currentTool === 'rotate' && target.type === 'obstacle') {
                this.isDragging = true;
                const o = target.data;
                this.dragStart = { fx, fy, startAngle: o.angle || 0, cx: o.fx + (o.fw || 0.1) / 2, cy: o.fy + (o.fh || 0.1) / 2 };
                return;
            }
            this.isDragging = true;
            this.dragStart = { fx, fy, ox: target.data.fx, oy: target.data.fy };
            return;
        }

        if (Tools.PROP_MAP[this.currentTool]) {
            const newItem = { fx: fx - 0.05, fy: fy - 0.05, fw: 0.1, fh: 0.1, type: this.currentTool, ...Tools.PROP_MAP[this.currentTool] };
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
        } else if (this.currentTool === 'spawn') this.level.packageStart = { fx, fy };
        else if (this.currentTool === 'goal') {
            this.level.destination.fx = fx - 0.05; this.level.destination.fy = fy - 0.05;
            this.selectedObject = { type: 'goal', data: this.level.destination };
            this.isDragging = true;
            this.dragStart = { fx, fy, ox: this.level.destination.fx, oy: this.level.destination.fy };
        }
    }

    _onMouseMove(e) {
        if (!this.active || !this.isDragging || !this.selectedObject) return;
        const rect = this.canvas.getBoundingClientRect();
        const fx = (e.clientX - rect.left) / rect.width, fy = (e.clientY - rect.top) / rect.height;
        const data = this.selectedObject.data;

        if (this.currentTool === 'scale' && (this.selectedObject.type === 'obstacle' || this.selectedObject.type === 'goal')) {
            Tools.applyScale(data, this.dragStart, fx, fy);
            this.dragStart.fx = fx; this.dragStart.fy = fy;
        } else if (this.currentTool === 'rotate' && this.selectedObject.type === 'obstacle') {
            Tools.applyRotation(data, this.dragStart, fx, fy);
        } else {
            data.fx = this.dragStart.ox + (fx - this.dragStart.fx);
            data.fy = this.dragStart.oy + (fy - this.dragStart.fy);
        }
    }

    draw() {
        if (!this.active) return;
        const W = this.canvas.width, H = this.canvas.height;
        this.renderer.drawGrid();
        const res = this._resolve(W, H);
        this.gRenderer.drawDestination(res.destination);
        this.gRenderer.drawCollectibles(res.collectibles);
        this.gRenderer.drawObstacles(res.obstacles);
        this.renderer.drawSpawnPoint(res.packageStart);

        if (this.selectedObject) {
            const data = this.selectedObject.data;
            if (this.selectedObject.type === 'collectible') this.renderer.drawSelection({ x: data.fx * W, y: data.fy * H, w: 0, h: 0 });
            else if (data.shape === 'circle') {
                const r = (data.fr || 0.05) * W;
                this.renderer.drawSelection({ x: data.fx * W - r, y: data.fy * H - r, w: r * 2, h: r * 2 });
            } else {
                this.renderer.drawSelection({ x: data.fx * W, y: data.fy * H, w: (data.fw || 0.1) * W, h: (data.fh || 0.1) * H, angle: data.angle });
            }
        }
    }

    _resolve(W, H) {
        return {
            packageStart: { x: this.level.packageStart.fx * W, y: this.level.packageStart.fy * H },
            destination: { x: this.level.destination.fx * W, y: this.level.destination.fy * H, w: this.level.destination.fw * W, h: this.level.destination.fh * H },
            obstacles: this.level.obstacles.map(o => ({ ...o, x: o.fx * W, y: o.fy * H, w: (o.fw || 0) * W, h: (o.fh || 0) * H, radius: (o.fr || 0) * W, angle: o.angle || 0 })),
            collectibles: this.level.collectibles.map(c => ({ x: c.fx * W, y: c.fy * H }))
        };
    }
}
