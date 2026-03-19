/**
 * Generates levels procedurally with increasing difficulty.
 */
export class LevelGenerator {
    /**
     * @param {number} levelId - Used as a seed for consistent generation.
     * @returns {object} A level definition compatible with Levels.js structure.
     */
    static generate(levelId) {
        const diff = levelId - 5; 
        const obstacleCount = Math.min(15, 6 + Math.floor(diff / 1.5));
        const random = (s) => {
            const x = Math.sin(s + levelId * 1.5) * 10000;
            return x - Math.floor(x);
        };

        const types = [
            { type: 'wall',   color: '#b4c8ff', bounce: 0.45, traction: 0.8 },
            { type: 'hazard', color: '#ff2d55', bounce: 0.3,  traction: 0.6 },
            { type: 'slick',  color: '#00ffff', bounce: 0.1,  traction: 0.999 },
            { type: 'bouncy', color: '#ff00ff', bounce: 0.95, traction: 0.95 },
            { type: 'sticky', color: '#32cd32', bounce: 0.05, traction: 0.2 },
        ];

        const packageStart = { fx: 0.1 + random(1) * 0.15, fy: 0.1 + random(2) * 0.75 };
        const destination  = { 
            fx: 0.75 + random(3) * 0.15, fy: 0.1 + random(4) * 0.75,
            fw: Math.max(0.06, 0.09 - (diff * 0.004)),
            fh: Math.max(0.06, 0.09 - (diff * 0.004))
        };

        const obstacles = [];
        const checkOverlap = (o1, o2) => {
            if (o1.shape === 'circle' && o2.shape === 'circle') {
                return Math.hypot(o1.fx - o2.fx, o1.fy - o2.fy) < (o1.fr + o2.fr);
            }
            const w1 = o1.shape === 'circle' ? o1.fr * 2 : o1.fw;
            const h1 = o1.shape === 'circle' ? o1.fr * 2 : o1.fh;
            const w2 = o2.shape === 'circle' ? o2.fr * 2 : o2.fw;
            const h2 = o2.shape === 'circle' ? o2.fr * 2 : o2.fh;
            const x1 = o1.shape === 'circle' ? o1.fx - o1.fr : o1.fx;
            const y1 = o1.shape === 'circle' ? o1.fy - o1.fr : o1.fy;
            const x2 = o2.shape === 'circle' ? o2.fx - o2.fr : o2.fx;
            const y2 = o2.shape === 'circle' ? o2.fy - o2.fr : o2.fy;
            return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
        };

        let attempts = 0;
        while (obstacles.length < obstacleCount && attempts < 50) {
            attempts++;
            const t = types[Math.floor(random(attempts * 5) * types.length)];
            const shape = random(attempts * 6) < 0.3 ? 'circle' : 'rect';
            let newObs;

            if (shape === 'circle') {
                const fr = 0.02 + random(attempts * 7) * 0.05;
                const fx = 0.2 + random(attempts * 8) * 0.6;
                const fy = 0.1 + random(attempts * 9) * 0.8;
                newObs = { fx, fy, fr, shape, ...t };
            } else {
                const fw = 0.04 + random(attempts * 7) * 0.1;
                const fh = 0.04 + random(attempts * 8) * 0.1;
                const fx = 0.15 + random(attempts * 9) * 0.7;
                const fy = 0.05 + random(attempts * 10) * 0.85;
                newObs = { fx, fy, fw, fh, shape, ...t };
            }

            const buffer = 0.12;
            const isNearStart = Math.hypot(newObs.fx - packageStart.fx, newObs.fy - packageStart.fy) < buffer;
            const isNearEnd   = Math.hypot(newObs.fx - destination.fx, newObs.fy - destination.fy) < buffer;
            if (isNearStart || isNearEnd || obstacles.some(o => checkOverlap(newObs, o))) continue;

            obstacles.push(newObs);
        }

        const prefixes = ['VANGUARD', 'CYBER', 'ION', 'NEON', 'OMEGA', 'VOID', 'CRYPTO', 'CORE', 'TITAN', 'NEXUS'];
        const suffixes = ['OUTPOST', 'CONDUIT', 'HUB', 'SPIRE', 'SECTOR', 'CHANNEL', 'LABS', 'REACTOR', 'NODE', 'VOID'];
        const namePrefix = prefixes[Math.floor(random(101) * prefixes.length)];
        const nameSuffix = suffixes[Math.floor(random(102) * suffixes.length)];

        return {
            id: levelId,
            name: `SECTOR ${levelId.toString().padStart(2, '0')} — ${namePrefix} ${nameSuffix}`,
            description: `Procedural challenge level ${diff}. Watch for the specialized terrain.`,
            packageStart, destination, obstacles
        };
    }
}
