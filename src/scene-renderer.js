/**
 * Handles drawing of the game environment and static-ish objects.
 */
export function drawBackground(ctx, W, H) {
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth   = 1;
    const step = 60;
    for (let x = 0; x < W; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
}

export function drawDestination(ctx, destination) {
    const { x, y, w, h } = destination;
    const pulse = 0.3 + 0.15 * Math.sin(Date.now() / 1000 * 3);

    ctx.save();
    ctx.shadowBlur  = 20;
    ctx.shadowColor = '#00f2ff';
    ctx.fillStyle   = `rgba(0, 242, 255, ${pulse})`;
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth   = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.fillRect(x, y, w, h);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0,242,255,0.9)';
    ctx.font      = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DROP ZONE', x + w / 2, y - 6);
    ctx.restore();
}

export function drawObstacles(ctx, obstacles) {
    obstacles.forEach(obs => {
        const color = obs.color || (obs.type === 'hazard' ? '#ff2d55' : '#b4c8ff');
        ctx.save();
        ctx.fillStyle   = `${color}${obs.type === 'wall' ? '14' : '40'}`; 
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1.5;
        
        if (obs.type !== 'wall') {
            ctx.shadowBlur  = 10;
            ctx.shadowColor = color;
        }

        ctx.beginPath();
        if (obs.shape === 'circle') {
            ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        } else {
            if (obs.angle) {
                ctx.translate(obs.x + obs.w / 2, obs.y + obs.h / 2);
                ctx.rotate(obs.angle);
                if (ctx.roundRect) ctx.roundRect(-obs.w / 2, -obs.h / 2, obs.w, obs.h, 4);
                else ctx.rect(-obs.w / 2, -obs.h / 2, obs.w, obs.h);
            } else {
                if (ctx.roundRect) ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 4);
                else ctx.rect(obs.x, obs.y, obs.w, obs.h);
            }
        }
        ctx.fill();
        ctx.stroke();
        if (obs.type !== 'wall') {
            ctx.fillStyle = color;
            const label   = obs.type.toUpperCase();
            const maxW    = (obs.shape === 'circle' ? obs.radius * 1.6 : obs.w * 0.85);
            ctx.font      = `bold ${Math.min(8, 8 * (maxW / Math.max(1, ctx.measureText(label).width)))}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            const lx = obs.shape === 'circle' ? obs.x : (obs.angle ? 0 : obs.x + obs.w / 2);
            const ly = obs.shape === 'circle' ? obs.y + 3 : (obs.angle ? 3 : obs.y + obs.h / 2 + 3);
            ctx.fillText(label, lx, ly);
        }
        ctx.restore();
    });
}
