/**
 * Contains specialized logic for manipulating level objects within the editor.
 */

export const PROP_MAP = {
    wall:    { color: '#b4c8ff', bounce: 0.45, traction: 0.8 },
    hazard:  { color: '#ff2d55', bounce: 0.3,  traction: 0.6 },
    slick:   { color: '#00ffff', bounce: 0.1,  traction: 0.999 },
    bouncy:  { color: '#ff00ff', bounce: 0.95, traction: 0.95 },
    sticky:  { color: '#32cd32', bounce: 0.05, traction: 0.2 },
    repair:  { color: '#00ff99', bounce: 0.3,  traction: 0.7 },
    shatter: { color: '#ffffff', bounce: 0.2,  traction: 0.5 },
    accel:   { color: '#ffaa00', bounce: 1.15, traction: 1.0 },
};

export function toggleShape(o) {
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
}

export function applyScale(data, dragStart, fx, fy) {
    const dx = fx - dragStart.fx;
    const dy = fy - dragStart.fy;

    if (data.shape === 'circle') {
        data.fr = Math.max(0.01, (data.fr || 0.05) + dx);
    } else {
        const centerX = data.fx + (data.fw || 0.1) / 2;
        const centerY = data.fy + (data.fh || 0.1) / 2;

        if (dragStart.fx < centerX) { // Left side handle
            data.fx = Math.min(centerX - 0.01, data.fx + dx);
            data.fw = Math.max(0.02, (data.fw || 0.1) - dx);
        } else { // Right side handle
            data.fw = Math.max(0.02, (data.fw || 0.1) + dx);
        }

        if (dragStart.fy < centerY) { // Top handle
            data.fy = Math.min(centerY - 0.01, data.fy + dy);
            data.fh = Math.max(0.02, (data.fh || 0.1) - dy);
        } else { // Bottom handle
            data.fh = Math.max(0.02, (data.fh || 0.1) + dy);
        }
    }
}

export function applyRotation(data, dragStart, fx, fy) {
    const currentAngle = Math.atan2(fy - dragStart.cy, fx - dragStart.cx);
    const initialAngle = Math.atan2(dragStart.fy - dragStart.cy, dragStart.fx - dragStart.cx);
    data.angle = dragStart.startAngle + (currentAngle - initialAngle);
}
