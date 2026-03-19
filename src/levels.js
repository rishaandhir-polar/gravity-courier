/**
 * Level definitions for Gravity Courier.
 *
 * Coordinates are expressed as fractions of canvas size (0.0 - 1.0)
 * so levels scale to any screen. Resolved to pixels at load time.
 *
 * Each level:
 *   - packageStart: {fx, fy}  — fractional spawn position of the package
 *   - destination:  {fx, fy, fw, fh} — fractional position/size of the goal zone
 *   - obstacles:    [{fx, fy, fw, fh, type}] — 'wall' or 'hazard'
 */
export const LEVELS = [
    {
        id: 1,
        name: "SECTOR 01 — INTAKE",
        description: "Learn the basics. Rotate the world to guide the package.",
        packageStart: { fx: 0.15, fy: 0.5 },
        destination: { fx: 0.78, fy: 0.72, fw: 0.08, fh: 0.12 },
        obstacles: [
            { fx: 0.35, fy: 0.3, fw: 0.04, fh: 0.45, type: 'wall' },
            { fx: 0.6,  fy: 0.1, fw: 0.04, fh: 0.45, type: 'wall' },
        ]
    },
    {
        id: 2,
        name: "SECTOR 02 — SHAFT",
        description: "Tight corridors. Mind the hazards.",
        packageStart: { fx: 0.1, fy: 0.15 },
        destination: { fx: 0.82, fy: 0.78, fw: 0.08, fh: 0.1 },
        obstacles: [
            { fx: 0.25, fy: 0.0,  fw: 0.04, fh: 0.55, type: 'wall' },
            { fx: 0.5,  fy: 0.45, fw: 0.04, fh: 0.55, type: 'wall' },
            { fx: 0.72, fy: 0.0,  fw: 0.04, fh: 0.55, type: 'wall' },
            { fx: 0.38, fy: 0.3,  fw: 0.1,  fh: 0.08, type: 'hazard' },
        ]
    },
    {
        id: 3,
        name: "SECTOR 03 — GAUNTLET",
        description: "Hazard field. Every rotation counts.",
        packageStart: { fx: 0.08, fy: 0.08 },
        destination: { fx: 0.84, fy: 0.84, fw: 0.08, fh: 0.08 },
        obstacles: [
            { fx: 0.2,  fy: 0.0,  fw: 0.04, fh: 0.6,  type: 'wall' },
            { fx: 0.4,  fy: 0.4,  fw: 0.04, fh: 0.6,  type: 'wall' },
            { fx: 0.62, fy: 0.0,  fw: 0.04, fh: 0.6,  type: 'wall' },
            { fx: 0.3,  fy: 0.25, fw: 0.08, fh: 0.08, type: 'hazard' },
            { fx: 0.52, fy: 0.55, fw: 0.08, fh: 0.08, type: 'hazard' },
            { fx: 0.72, fy: 0.25, fw: 0.08, fh: 0.08, type: 'hazard' },
        ]
    },
    {
        id: 4,
        name: "SECTOR 04 — LABYRINTH",
        description: "The maze shifts with every rotation.",
        packageStart: { fx: 0.05, fy: 0.5 },
        destination: { fx: 0.88, fy: 0.5, fw: 0.07, fh: 0.1 },
        obstacles: [
            { fx: 0.15, fy: 0.1,  fw: 0.04, fh: 0.5,  type: 'wall' },
            { fx: 0.15, fy: 0.7,  fw: 0.35, fh: 0.04, type: 'wall' },
            { fx: 0.3,  fy: 0.1,  fw: 0.35, fh: 0.04, type: 'wall' },
            { fx: 0.5,  fy: 0.14, fw: 0.04, fh: 0.5,  type: 'wall' },
            { fx: 0.65, fy: 0.3,  fw: 0.2,  fh: 0.04, type: 'wall' },
            { fx: 0.65, fy: 0.6,  fw: 0.2,  fh: 0.04, type: 'wall' },
            { fx: 0.35, fy: 0.35, fw: 0.08, fh: 0.08, type: 'hazard' },
            { fx: 0.6,  fy: 0.45, fw: 0.08, fh: 0.08, type: 'hazard' },
        ]
    },
    {
        id: 5,
        name: "SECTOR 05 — CORE",
        description: "Final delivery. No margin for error.",
        packageStart: { fx: 0.5, fy: 0.05 },
        destination: { fx: 0.46, fy: 0.88, fw: 0.08, fh: 0.08 },
        obstacles: [
            { fx: 0.1,  fy: 0.2,  fw: 0.35, fh: 0.04, type: 'wall' },
            { fx: 0.55, fy: 0.2,  fw: 0.35, fh: 0.04, type: 'wall' },
            { fx: 0.1,  fy: 0.5,  fw: 0.35, fh: 0.04, type: 'wall' },
            { fx: 0.55, fy: 0.5,  fw: 0.35, fh: 0.04, type: 'wall' },
            { fx: 0.45, fy: 0.2,  fw: 0.04, fh: 0.34, type: 'wall' },
            { fx: 0.2,  fy: 0.35, fw: 0.08, fh: 0.08, type: 'hazard' },
            { fx: 0.72, fy: 0.35, fw: 0.08, fh: 0.08, type: 'hazard' },
            { fx: 0.2,  fy: 0.62, fw: 0.08, fh: 0.08, type: 'hazard' },
            { fx: 0.72, fy: 0.62, fw: 0.08, fh: 0.08, type: 'hazard' },
        ]
    }
];

/**
 * Resolves fractional level coordinates to pixel values.
 * @param {object} level
 * @param {number} W - canvas width
 * @param {number} H - canvas height
 * @returns {object} resolved level with pixel coordinates
 */
export function resolveLevel(level, W, H) {
    return {
        ...level,
        packageStart: { x: level.packageStart.fx * W, y: level.packageStart.fy * H },
        destination: {
            x: level.destination.fx * W, y: level.destination.fy * H,
            w: level.destination.fw * W, h: level.destination.fh * H
        },
        obstacles: level.obstacles.map(o => ({
            ...o,
            x: o.fx * W,
            y: o.fy * H,
            w: (o.fw || 0) * W,
            h: (o.fh || 0) * H,
            radius: (o.fr || 0) * W
        }))
    };
}
