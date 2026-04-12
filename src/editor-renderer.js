/**
 * Specialized rendering methods for the Level Editor.
 */
export class EditorRenderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
    }

    drawGrid() {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const size = W / 10; // 10x10 fractional grid

        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.25)';
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        for (let x = 0; x <= W; x += size) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, H);
        }
        for (let y = 0; y <= H; y += size) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(W, y);
        }
        this.ctx.stroke();
    }

    drawSpawnPoint(pos) {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '8px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SPAWN', pos.x, pos.y - 20);
        this.ctx.restore();
    }

    drawSelection(obj) {
        if (!obj) return;
        const ctx = this.ctx;
        const time = Date.now() / 1000;
        const pulse = 0.6 + 0.4 * Math.sin(time * 4);
        const color = `rgba(0, 242, 255, ${pulse})`;

        ctx.save();
        
        // Setup transform for rotated objects
        if (obj.angle) {
            ctx.translate(obj.x + obj.w / 2, obj.y + obj.h / 2);
            ctx.rotate(obj.angle);
            ctx.translate(-obj.w / 2, -obj.h / 2);
        } else {
            ctx.translate(obj.x, obj.y);
        }

        const W = obj.w || 0;
        const H = obj.h || 0;
        const pad = 4;

        // 1. Draw "Holographic" fill (Scanlines)
        if (W > 0 && H > 0) {
            ctx.fillStyle = 'rgba(0, 242, 255, 0.05)';
            ctx.fillRect(-pad, -pad, W + pad * 2, H + pad * 2);
            
            ctx.strokeStyle = 'rgba(0, 242, 255, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i < H + pad * 2; i += 4) {
                ctx.beginPath();
                ctx.moveTo(-pad, i - pad);
                ctx.lineTo(W + pad, i - pad);
                ctx.stroke();
            }
        }

        // 2. Draw Glow Outer Border
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 5]);
        ctx.strokeRect(-pad, -pad, W + pad * 2, H + pad * 2);
        ctx.setLineDash([]);

        // 3. Draw Corner Brackets
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 2;
        const bl = 8; // bracket length
        
        // Top Left
        ctx.beginPath(); ctx.moveTo(-pad, -pad + bl); ctx.lineTo(-pad, -pad); ctx.lineTo(-pad + bl, -pad); ctx.stroke();
        // Top Right
        ctx.beginPath(); ctx.moveTo(W + pad - bl, -pad); ctx.lineTo(W + pad, -pad); ctx.lineTo(W + pad, -pad + bl); ctx.stroke();
        // Bottom Right
        ctx.beginPath(); ctx.moveTo(W + pad, H + pad - bl); ctx.lineTo(W + pad, H + pad); ctx.lineTo(W + pad - bl, H + pad); ctx.stroke();
        // Bottom Left
        ctx.beginPath(); ctx.moveTo(-pad + bl, H + pad); ctx.lineTo(-pad, H + pad); ctx.lineTo(-pad, H + pad - bl); ctx.stroke();

        ctx.restore();
    }
}
