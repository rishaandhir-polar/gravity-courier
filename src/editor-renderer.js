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
        this.ctx.save();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        if (obj.angle) {
            this.ctx.translate(obj.x + obj.w / 2, obj.y + obj.h / 2);
            this.ctx.rotate(obj.angle);
            this.ctx.strokeRect(-obj.w / 2 - 2, -obj.h / 2 - 2, obj.w + 4, obj.h + 4);
        } else {
            this.ctx.strokeRect(obj.x - 2, obj.y - 2, obj.w + 4, obj.h + 4);
        }
        
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }
}
