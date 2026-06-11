export const getStatus = (actual, standard, tol) => {
    if (actual === null || actual === '' || isNaN(actual)) return 'NONE';
    const diff = Math.abs(actual - standard);
    if (diff <= tol) return 'OK';
    if (diff <= tol * 1.5) return 'WARN';
    return 'NG';
};

export const compressImage = (file, maxWidth = 1280, maxHeight = 1280, quality = 0.7) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                        resolve(newFile);
                    } else {
                        resolve(file);
                    }
                }, 'image/jpeg', quality);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};

export const getPathCenter = (pathString) => {
    const coords = pathString.match(/[\d.]+/g).map(Number);
    let sumX = 0, sumY = 0;
    const count = coords.length / 2;
    for(let i=0; i<coords.length; i+=2) {
        sumX += coords[i];
        sumY += coords[i+1];
    }
    return { x: sumX / count, y: sumY / count };
};

export const parsePath = (path) => {
    const coords = path.match(/[\d.]+/g).map(Number);
    const pts = [];
    for(let i=0; i<coords.length; i+=2) pts.push({x: coords[i], y: coords[i+1]});
    return pts;
};

export const getSegments = (pts) => {
    const segs = [];
    for(let i=0; i<pts.length; i++) segs.push([pts[i], pts[(i+1)%pts.length]]);
    return segs;
};

export const getSharedSegments = (path1, path2) => {
    if (!path1 || !path2) return [];
    const segs1 = getSegments(parsePath(path1));
    const segs2 = getSegments(parsePath(path2));
    const TOL = 1.0; 

    const results = [];

    for(let s1 of segs1) {
        for(let s2 of segs2) {
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

            if (tEnd - tStart > 0.05) { 
                results.push([
                    { x: s1[0].x + tStart * v1.x, y: s1[0].y + tStart * v1.y },
                    { x: s1[0].x + tEnd * v1.x, y: s1[0].y + tEnd * v1.y }
                ]);
            }
        }
    }
    return results;
};

export const projectPointOnSegment = (p, A, B) => {
    const v = { x: B.x - A.x, y: B.y - A.y };
    const w = { x: p.x - A.x, y: p.y - A.y };
    const c1 = w.x * v.x + w.y * v.y;
    if (c1 <= 0) return A;
    const c2 = v.x * v.x + v.y * v.y;
    if (c2 <= c1) return B;
    const b = c1 / c2;
    return { x: A.x + b * v.x, y: A.y + b * v.y };
};
