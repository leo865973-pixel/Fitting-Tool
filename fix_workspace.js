const fs = require('fs');

let content = fs.readFileSync('src/components/Workspace.jsx', 'utf-8');

// 1. Add missing state variables
const stateTarget = "const dragFlag = useRef(false);";
if (content.indexOf(stateTarget) !== -1 && content.indexOf('const [showHeatmap') === -1) {
    const states = `
            const [showHeatmap, setShowHeatmap] = useState(false);
            const [dotFilter, setDotFilter] = useState('all');
            const [showSwipeHint, setShowSwipeHint] = useState(false);
`;
    content = content.replace(stateTarget, stateTarget + states);
}

// 2. Add missing functions
const funcTarget = "const handleBackgroundClick = () => {";
if (content.indexOf(funcTarget) !== -1 && content.indexOf('const getHeatmapColor') === -1) {
    const funcs = `
            const getHeatmapColor = (partId) => {
                const partIssues = issues.filter(i => i.part1 === partId || i.part2 === partId);
                const partMeasurements = measurements.filter(m => m.part1 === partId || m.part2 === partId);
                if (partIssues.length === 0 && partMeasurements.length === 0) return '#ffffff';
                const hasNG = partMeasurements.some(m => m.gapStatus === 'NG' || m.flushStatus === 'NG');
                if (hasNG) return 'rgba(255, 59, 48, 0.6)';
                const hasWarn = partMeasurements.some(m => m.gapStatus === 'WARN' || m.flushStatus === 'WARN');
                if (hasWarn) return 'rgba(255, 149, 0, 0.6)';
                return 'rgba(52, 199, 89, 0.4)';
            };

            const getDotColor = (status) => {
                if (status === 'NG') return 'fill-[#ff3b30]';
                if (status === 'WARN') return 'fill-[#ff9500]';
                return 'fill-[#34c759]';
            };

            const handleDotMouseDown = (e) => {
                e.stopPropagation();
                setIsDragging(true);
            };

            const handleDotTouchStart = (e) => {
                e.stopPropagation();
                if (e.touches.length === 1) {
                    setIsDragging(true);
                }
            };
`;
    content = content.replace(funcTarget, funcs + funcTarget);
}

// 3. Add Keyboard Shortcuts
const kbTarget = "const handleBackgroundClick = () => {";
if (content.indexOf(kbTarget) !== -1 && content.indexOf('// Keyboard Shortcuts') === -1) {
    const kb = `
            // Keyboard Shortcuts
            useEffect(() => {
                const handleKeyDown = (e) => {
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

                    if (e.key === '1') setCurrentView('left');
                    if (e.key === '2') setCurrentView('right');
                    if (e.key === '3') setCurrentView('2d');
                    if (e.key === 'Escape') handleBackgroundClick();
                };
                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
            }, [setCurrentView]);
`;
    content = content.replace(kbTarget, kb + kbTarget);
}

fs.writeFileSync('src/components/Workspace.jsx', content, 'utf-8');
console.log('Workspace fixed successfully!');
