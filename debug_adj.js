const parsePath = (path) => {
    const coords = path.match(/[\d.]+/g).map(Number);
    const pts = [];
    for(let i=0; i<coords.length; i+=2) pts.push({x: coords[i], y: coords[i+1]});
    return pts;
};

const getSegments = (pts) => {
    const segs = [];
    for(let i=0; i<pts.length; i++) segs.push([pts[i], pts[(i+1)%pts.length]]);
    return segs;
};

const getSharedSegment = (path1, path2) => {
    if (!path1 || !path2) return null;
    const segs1 = getSegments(parsePath(path1));
    const segs2 = getSegments(parsePath(path2));
    const TOL = 1.0; 

    for(let i=0; i<segs1.length; i++) {
        let s1 = segs1[i];
        for(let j=0; j<segs2.length; j++) {
            let s2 = segs2[j];
            const v1 = { x: s1[1].x - s1[0].x, y: s1[1].y - s1[0].y };
            const v2 = { x: s2[1].x - s2[0].x, y: s2[1].y - s2[0].y };

            const cross1 = v1.x * v2.y - v1.y * v2.x;
            if (Math.abs(cross1) > TOL) continue;

            const v3 = { x: s2[0].x - s1[0].x, y: s2[0].y - s1[0].y };
            const cross2 = v1.x * v3.y - v1.y * v3.x;
            if (Math.abs(cross2) > TOL) continue;

            const len2 = v1.x * v1.x + v1.y * v1.y;
            if (len2 === 0) continue;

            const t1 = 0;
            const t2 = 1;
            const t3 = (v3.x * v1.x + v3.y * v1.y) / len2;
            const t4 = ((s2[1].x - s1[0].x) * v1.x + (s2[1].y - s1[0].y) * v1.y) / len2;

            const tStart = Math.max(Math.min(t1, t2), Math.min(t3, t4));
            const tEnd = Math.min(Math.max(t1, t2), Math.max(t3, t4));

            console.log(`Checking s1[${i}] vs s2[${j}]`);
            console.log(`t1=${t1}, t2=${t2}, t3=${t3}, t4=${t4}`);
            console.log(`tStart=${tStart}, tEnd=${tEnd}, diff=${tEnd - tStart}`);

            if (tEnd - tStart > 0.01) { 
                console.log("MATCH FOUND!");
                return [
                    { x: s1[0].x + tStart * v1.x, y: s1[0].y + tStart * v1.y },
                    { x: s1[0].x + tEnd * v1.x, y: s1[0].y + tEnd * v1.y }
                ];
            }
        }
    }
    return null;
};

const front_center_trim = "M 192,320 L 608,320 L 590,342 L 590,480 L 210,480 L 210,342 Z";
const l_headlight = "M 115,361 L 210,361 L 210,480 L 115,480 Z";

console.log("--- front vs headlight ---");
getSharedSegment(front_center_trim, l_headlight);
