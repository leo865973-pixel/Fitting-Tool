import React, { useRef, useState, useEffect, useImperativeHandle } from 'react';
import { Icons } from './Icons';
import { getPathCenter, getSharedSegments, projectPointOnSegment } from '../utils/geometry';
import { PART_NAME_MAP, TEXT_CONFIG } from '../utils/constants';

export const GridSvgViewer = React.memo(React.forwardRef(({
    selectedPart, currentPart2, showHeatmap, dotFilter, measurements, issues, 
    inputMode, currentExactPos, isDragging, setIsDragging, dragFlag,
    formData, setFormData, issueFormData, setIssueFormData,
    handlePartClick, handleBackgroundClick, handleEditRecord, handleDotMouseDown, handleDotTouchStart,
    getHeatmapColor, getDotColor,
    currentPaths, currentView, isDevMode, setDevCoordinates
}, ref) => {
    const svgRef = useRef(null);
    const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 620 });
    const panZoomState = useRef({ isPanning: false, startX: 0, startY: 0, startViewBox: null, initialPinchDistance: null });

    useImperativeHandle(ref, () => ({
        resetView: () => setViewBox({ x: 0, y: 0, w: 800, h: 620 })
    }));

    // Wheel zoom for ALL views
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const handleWheel = (e) => {
            e.preventDefault();
            setViewBox(prev => {
                const zoomFactor = 0.05;
                const delta = e.deltaY < 0 ? -1 : 1;
                const svgRect = svg.getBoundingClientRect();
                const mouseX = e.clientX - svgRect.left;
                const mouseY = e.clientY - svgRect.top;
                
                const svgX = prev.x + (mouseX / svgRect.width) * prev.w;
                const svgY = prev.y + (mouseY / svgRect.height) * prev.h;
                
                let newW = prev.w * (1 + delta * zoomFactor);
                let newH = prev.h * (1 + delta * zoomFactor);
                
                if (newW < 200) { newW = 200; newH = 200 * (620/800); }
                if (newW > 1600) { newW = 1600; newH = 1600 * (620/800); }
                
                let newX = svgX - (mouseX / svgRect.width) * newW;
                let newY = svgY - (mouseY / svgRect.height) * newH;
                
                return { x: newX, y: newY, w: newW, h: newH };
            });
        };
        svg.addEventListener('wheel', handleWheel, { passive: false });
        return () => svg.removeEventListener('wheel', handleWheel);
    }, []);

    const handleSvgMouseDown = (e) => {
        if (e.button === 1) {
            e.preventDefault(); // Prevent default middle-click auto-scroll
        }
        if (!isDragging) {
            panZoomState.current.isPanning = true;
            panZoomState.current.startX = e.clientX;
            panZoomState.current.startY = e.clientY;
            panZoomState.current.startViewBox = viewBox;
        }
    };

    const handleSvgTouchStart = (e) => {
        if (e.touches.length === 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            panZoomState.current.initialPinchDistance = dist;
            panZoomState.current.startViewBox = viewBox;
            panZoomState.current.isPanning = false;
        } else if (e.touches.length === 1 && !isDragging) {
            panZoomState.current.isPanning = true;
            panZoomState.current.startX = e.touches[0].clientX;
            panZoomState.current.startY = e.touches[0].clientY;
            panZoomState.current.startViewBox = viewBox;
        }
    };

    const handleSvgMouseMove = (e) => {
        if (panZoomState.current.isPanning) {
            const svg = svgRef.current;
            const rect = svg.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            const dx = clientX - panZoomState.current.startX;
            const dy = clientY - panZoomState.current.startY;
            const scaleX = viewBox.w / rect.width;
            const scaleY = viewBox.h / rect.height;
            setViewBox({
                ...viewBox,
                x: panZoomState.current.startViewBox.x - dx * scaleX,
                y: panZoomState.current.startViewBox.y - dy * scaleY
            });
            dragFlag.current = true;
            return;
        }

        if (!isDragging || !svgRef.current || !selectedPart) return;
        dragFlag.current = true; 
        
        const p2 = inputMode === 'measure' ? formData.part2 : issueFormData.part2;
        if (!p2) return;

        const segs = getSharedSegments(currentPaths[selectedPart] || "", currentPaths[p2] || "");
        if (segs.length === 0) return;

        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();
        const scaleX = viewBox.w / rect.width; 
        const scaleY = viewBox.h / rect.height;

        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const mouseP = {
            x: viewBox.x + (clientX - rect.left) * scaleX,
            y: viewBox.y + (clientY - rect.top) * scaleY
        };
        
        let closestP = null;
        let minDist = Infinity;
        
        for (let seg of segs) {
            const p = projectPointOnSegment(mouseP, seg[0], seg[1]);
            const d = (p.x - mouseP.x)**2 + (p.y - mouseP.y)**2;
            if (d < minDist) {
                minDist = d;
                closestP = p;
            }
        }

        if (closestP) {
            if (inputMode === 'measure') setFormData(prev => ({...prev, exactPosition: closestP}));
            else setIssueFormData(prev => ({...prev, exactPosition: closestP}));
        }
    };

    const handleSvgTouchMove = (e) => {
        if (e.touches.length === 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            
            if (panZoomState.current.initialPinchDistance) {
                const scale = panZoomState.current.initialPinchDistance / dist;
                const initialVB = panZoomState.current.startViewBox;
                
                let newW = initialVB.w * scale;
                let newH = initialVB.h * scale;
                
                if (newW < 200) { newW = 200; newH = 200 * (620/800); }
                if (newW > 1600) { newW = 1600; newH = 1600 * (620/800); }
                
                const clientX = (t1.clientX + t2.clientX) / 2;
                const clientY = (t1.clientY + t2.clientY) / 2;
                const svg = svgRef.current;
                const rect = svg.getBoundingClientRect();
                
                const mouseX = clientX - rect.left;
                const mouseY = clientY - rect.top;
                
                const svgX = initialVB.x + (mouseX / rect.width) * initialVB.w;
                const svgY = initialVB.y + (mouseY / rect.height) * initialVB.h;
                
                let newX = svgX - (mouseX / rect.width) * newW;
                let newY = svgY - (mouseY / rect.height) * newH;
                
                setViewBox({ x: newX, y: newY, w: newW, h: newH });
            } else {
                panZoomState.current.initialPinchDistance = dist;
                panZoomState.current.startViewBox = viewBox;
            }
            return;
        } else {
            panZoomState.current.initialPinchDistance = null;
        }
        handleSvgMouseMove(e);
    };

    const handleSvgMouseUp = () => {
        setIsDragging(false);
        panZoomState.current.isPanning = false;
        panZoomState.current.initialPinchDistance = null;
        setTimeout(() => { dragFlag.current = false; }, 500);
    };

    const handleSvgClick = (e) => {
        if (e.button === 1 || e.button === 2) return; // Ignore middle and right clicks
        
        const svg = svgRef.current;
        if (!svg) return;
        
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        const mouseP = { x: Math.round(svgP.x), y: Math.round(svgP.y) };

        if (currentView !== '2d') {
            if (isDevMode) {
                setDevCoordinates(prev => [...prev, mouseP]);
            } else {
                handlePartClick(e, 'custom_point', mouseP);
            }
        } else if (isDevMode) {
            setDevCoordinates(prev => [...prev, mouseP]);
        }
    };

    return (
        <svg 
            ref={svgRef}
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`} 
            className={`w-full h-full max-w-[800px] drop-shadow-sm select-none cursor-grab active:cursor-grabbing`} 
            style={{ 
                touchAction: 'none',
                cursor: currentView !== '2d' ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M12 2v20M2 12h20' stroke='%23ff3b30' stroke-width='2'/><circle cx='12' cy='12' r='8' fill='none' stroke='%23ffffff' stroke-width='1.5'/></svg>") 12 12, crosshair` : undefined
            }}
            onMouseDown={handleSvgMouseDown}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onMouseLeave={handleSvgMouseUp}
            onTouchStart={handleSvgTouchStart}
            onTouchMove={handleSvgTouchMove}
            onTouchEnd={handleSvgMouseUp}
            onTouchCancel={handleSvgMouseUp}
            onClick={handleSvgClick}
        >
            {currentView !== '2d' && (
                <image 
                    href={currentView === 'left' ? '/left_view.png' : '/right_view.png'} 
                    x="0" y="0" width="800" height="620" 
                    preserveAspectRatio="xMidYMid meet"
                    opacity="0.8"
                    style={{ pointerEvents: 'none' }}
                    draggable="false"
                />
            )}
            <rect x="0" y="0" width="800" height="620" fill={currentView === '2d' ? "transparent" : "rgba(255,255,255,0.2)"} onClick={handleBackgroundClick} />

            {Object.entries(currentPaths).map(([id, d]) => {
                const partName = PART_NAME_MAP[id];
                const isSelected = selectedPart === id;
                const isAdjacentSelected = currentPart2 === id;
                const center = getPathCenter(d);
                
                let fillColor = '#ffffff';
                let strokeColor = '#d2d2d7';
                let strokeWidth = "2";
                let textColor = '#1d1d1f';

                if (isSelected) {
                    fillColor = '#0071e3';
                    strokeColor = '#0071e3';
                    strokeWidth = "3";
                    textColor = '#ffffff';
                } else if (isAdjacentSelected) {
                    fillColor = '#5ac8fa';
                    strokeColor = '#5ac8fa';
                    strokeWidth = "3";
                    textColor = '#ffffff';
                } else if (showHeatmap) {
                    fillColor = getHeatmapColor(id);
                }

                return (
                    <g key={id} onClick={(e) => handlePartClick(e, id)} className="cursor-pointer group">
                        <path 
                            d={d} 
                            fill={fillColor} 
                            stroke={strokeColor} 
                            strokeWidth={strokeWidth}
                            strokeLinejoin="round"
                            className="transition-all duration-300 group-hover:brightness-95"
                        />
                        <text 
                            x={center.x + (TEXT_CONFIG[id]?.xOffset || 0)} 
                            y={center.y + (TEXT_CONFIG[id]?.yOffset || 0)} 
                            textAnchor="middle" 
                            dominantBaseline="central"
                            fill={textColor} 
                            fontSize={TEXT_CONFIG[id]?.fontSize || "12"} 
                            fontWeight="600" 
                            className="pointer-events-none transition-colors duration-300"
                            transform={TEXT_CONFIG[id]?.rotation ? `rotate(${TEXT_CONFIG[id].rotation}, ${center.x + (TEXT_CONFIG[id].xOffset || 0)}, ${center.y + (TEXT_CONFIG[id].yOffset || 0)})` : undefined}
                            style={TEXT_CONFIG[id]?.writingMode ? { writingMode: TEXT_CONFIG[id].writingMode, textOrientation: 'upright' } : {}}
                        >
                            {partName}
                        </text>
                    </g>
                );
            })}

            {!showHeatmap && dotFilter !== 'none' && measurements.map(m => {
                if (!m.exactPosition) return null;
                if ((m.viewMode || '2d') !== currentView) return null;
                const isNgOrWarn = m.gapStatus === 'NG' || m.flushStatus === 'NG' || m.gapStatus === 'WARN' || m.flushStatus === 'WARN';
                if (dotFilter === 'ng_only' && !isNgOrWarn) return null;
                return (
                    <circle key={`m-${m.id}`} cx={m.exactPosition.x} cy={m.exactPosition.y} r="6" onClick={(e) => { e.stopPropagation(); handleEditRecord(m, 'measure'); }} className={`${getDotColor(m.gapStatus === 'NG' || m.flushStatus === 'NG' ? 'NG' : (m.gapStatus === 'WARN' || m.flushStatus === 'WARN' ? 'WARN' : 'OK'))} stroke-white stroke-[1.5px] cursor-pointer hover:stroke-[#0071e3] hover:stroke-[2px] transition-all`} />
                );
            })}
            {!showHeatmap && dotFilter !== 'none' && issues.map(i => i.exactPosition && (i.viewMode || '2d') === currentView && (
                <circle key={`i-${i.id}`} cx={i.exactPosition.x} cy={i.exactPosition.y} r="6" onClick={(e) => { e.stopPropagation(); handleEditRecord(i, 'issue'); }} className="fill-[#af52de] stroke-white stroke-[1.5px] cursor-pointer hover:stroke-[#af52de] hover:stroke-[2px] transition-all" />
            ))}

            {selectedPart && currentPart2 && currentPaths[selectedPart] && currentPaths[currentPart2] && getSharedSegments(currentPaths[selectedPart], currentPaths[currentPart2]).map((seg, idx) => (
                <line 
                    key={`hl-${idx}`} 
                    x1={seg[0].x} y1={seg[0].y} 
                    x2={seg[1].x} y2={seg[1].y} 
                    stroke={inputMode === 'measure' ? '#0071e3' : '#af52de'} 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    opacity="0.3" 
                    className="pointer-events-none animate-pulse"
                />
            ))}

            {selectedPart && currentExactPos && (
                <g 
                    onMouseDown={handleDotMouseDown} 
                    onTouchStart={handleDotTouchStart}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    <circle cx={currentExactPos.x} cy={currentExactPos.y} r="20" fill="transparent" />
                    <circle cx={currentExactPos.x} cy={currentExactPos.y} r="10" fill="none" stroke={inputMode === 'measure' ? '#0071e3' : '#af52de'} strokeWidth="2" className={isDragging ? '' : 'animate-ping'} style={{ transformOrigin: `${currentExactPos.x}px ${currentExactPos.y}px` }} />
                    <circle cx={currentExactPos.x} cy={currentExactPos.y} r="6" fill={inputMode === 'measure' ? '#0071e3' : '#af52de'} stroke="white" strokeWidth="2" />
                </g>
            )}
        </svg>
    );
}));
