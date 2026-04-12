/**
 * Handles drawing of helper elements like the compass, gravity arrow, and collectibles.
 */
export function drawCompass(ctx, pkg, destination) {
    if (!pkg || !destination) return;
    const dx = destination.x + destination.w / 2 - pkg.x;
    const dy = destination.y + destination.h / 2 - pkg.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 120) return; // Hide when close

    const angle = Math.atan2(dy, dx);
    const orbit = 35;

    ctx.save();
    ctx.translate(pkg.x + Math.cos(angle) * orbit, pkg.y + Math.sin(angle) * orbit);
    ctx.rotate(angle);
    ctx.fillStyle   = 'rgba(0, 242, 255, 0.7)';
    ctx.shadowBlur  = 8;
    ctx.shadowColor = '#00f2ff';
    ctx.beginPath();
    ctx.moveTo(8, 0); ctx.lineTo(-6, -5); ctx.lineTo(-6, 5); ctx.closePath();
    ctx.fill();
    ctx.restore();
}

export function drawCollectibles(ctx, collectibles) {
    const time = Date.now() / 1000;
    collectibles.forEach(c => {
        const timeOffset = (c.x + c.y) * 0.1;
        const bounce = Math.sin(time * 4 + timeOffset) * 5;
        const s = 9;
        ctx.save();
        ctx.translate(c.x, c.y + bounce);
        ctx.rotate(time * 2 + timeOffset);
        ctx.shadowBlur  = 20;
        ctx.shadowColor = '#ffd700';
        ctx.fillStyle   = `rgba(255, 215, 0, ${0.8 + Math.sin(time * 5) * 0.2})`;
        ctx.beginPath();
        ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0); ctx.closePath();
        ctx.fill();
        ctx.restore();
    });
}

export function drawGravityArrow(ctx, W, H, gravityManager) {
    const grav  = gravityManager.getVector(1);
    const cx    = W - 40;
    const cy    = H - 40;
    const len   = 22;
    const ex    = cx + grav.x * len;
    const ey    = cy + grav.y * len;
    const angle = Math.atan2(ey - cy, ex - cx);

    ctx.save();
    ctx.strokeStyle = 'rgba(0,242,255,0.6)';
    ctx.fillStyle   = 'rgba(0,242,255,0.6)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 7 * Math.cos(angle - 0.4), ey - 7 * Math.sin(angle - 0.4));
    ctx.lineTo(ex - 7 * Math.cos(angle + 0.4), ey - 7 * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}
