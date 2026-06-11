import React, { useState } from 'react';
import { Icons } from './Icons';

        export function HomePage({ models, setModels, onSelectModel, logs, addLog, openPrompt, openConfirm, setShowContactsModal, isConnected }) {
            const [showLogsModal, setShowLogsModal] = useState(false);

            const handleAddModel = () => {
                openPrompt("新增車型", "請輸入新車型名稱：", "", (name) => {
                    if (name && name.trim()) {
                        const newModel = {
                            id: `MOD-${Date.now()}`,
                            name: name.trim(),
                            updatedAt: new Date().toLocaleString(),
                            std: { gap: 4.0, flush: 0.0, tolGap: 1.0, tolFlush: 1.0 },
                            partStd: {} // 儲存各部位獨立公差
                        };
                        setModels([...models, newModel]);
                        addLog('新增車型', `新增了車型：${name.trim()}`);
                    }
                });
            };

            const handleEditModel = (e, id, currentName) => {
                e.stopPropagation();
                openPrompt("編輯車型", "請輸入新的車型名稱：", currentName, (newName) => {
                    if (newName && newName.trim() && newName.trim() !== currentName) {
                        setModels(models.map(m => m.id === id ? { ...m, name: newName.trim(), updatedAt: new Date().toLocaleString() } : m));
                        addLog('編輯車型', `將車型「${currentName}」更名為「${newName.trim()}」`);
                    }
                });
            };

            const handleDeleteModel = (e, id, name) => {
                e.stopPropagation();
                openConfirm("刪除車型", `確定要刪除車型「${name}」嗎？此動作無法復原。`, () => {
                    setModels(models.filter(m => m.id !== id));
                    addLog('刪除車型', `刪除了車型：${name}`);
                });
            };

            return (
                <div className="min-h-screen flex flex-col relative animate-fade-in">
                    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#0071e3] text-white rounded-xl shadow-sm shrink-0"><Icons.Settings2 size={20} /></div>
                            <div>
                                <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] flex items-center gap-2">
                                    車頭前圍建付分析系統
                                    {isConnected ? (
                                        <div className="flex items-center gap-1.5 text-[#34c759] text-[12px] font-medium shrink-0 ml-1">
                                            <span className="w-2 h-2 rounded-full bg-[#34c759] shadow-[0_0_8px_rgba(52,199,89,0.6)] animate-pulse"></span> 已連線
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-[#ff3b30] text-[12px] font-medium shrink-0 ml-1">
                                            <span className="w-2 h-2 rounded-full bg-[#ff3b30] shadow-[0_0_8px_rgba(255,59,48,0.6)]"></span> 離線模式
                                        </div>
                                    )}
                                </h1>
                                <p className="text-[12px] sm:text-[13px] text-[#86868b] font-medium">Digital Fitting Tool v5.0 (Cloud Sync)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0" style={{ scrollbarWidth: 'none' }}>
                            <button onClick={() => setShowContactsModal(true)} className="flex items-center gap-1.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] px-4 py-2 sm:py-2.5 rounded-full text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0">
                                <Icons.Users size={16} /> 聯絡人
                            </button>
                            <button onClick={() => setShowLogsModal(true)} className="flex items-center gap-1.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] px-4 py-2 sm:py-2.5 rounded-full text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0">
                                <Icons.FileText size={16} /> 系統履歷
                            </button>
                            <button onClick={handleAddModel} className="flex items-center gap-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white px-5 py-2 sm:py-2.5 rounded-full text-[13px] font-semibold transition-transform active:scale-95 shadow-sm whitespace-nowrap shrink-0">
                                <Icons.PlusCircle size={16} /> 新增車型
                            </button>
                        </div>
                    </header>

                    <div className="max-w-[1200px] mx-auto w-full p-8">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-[#1d1d1f] tracking-tight mb-2">選擇車型</h2>
                            <p className="text-[#86868b] font-medium">請選擇要進行建付分析的車型，或建立新車型。</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {models.map(model => (
                                <div key={model.id} onClick={() => onSelectModel(model)} className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all cursor-pointer border border-gray-100 group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-[#f5f5f7] p-3 rounded-2xl text-[#0071e3] group-hover:bg-[#0071e3] group-hover:text-white transition-colors">
                                            <Icons.Car size={28} />
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => handleEditModel(e, model.id, model.name)} className="text-[#86868b] hover:text-[#0071e3] hover:bg-[#0071e3]/10 p-2 rounded-full transition-colors">
                                                <Icons.Edit2 size={18} />
                                            </button>
                                            <button onClick={(e) => handleDeleteModel(e, model.id, model.name)} className="text-[#86868b] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 p-2 rounded-full transition-colors">
                                                <Icons.Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#1d1d1f] mb-1">{model.name}</h3>
                                    <p className="text-[13px] text-[#86868b] font-medium flex items-center gap-1">
                                        <Icons.History size={14} /> 最後編輯: {model.updatedAt}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 系統履歷 Modal */}
                    {showLogsModal && (
                        <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                            <div className="bg-white rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] w-full max-w-2xl overflow-hidden flex flex-col animate-zoom-in">
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md">
                                    <h3 className="font-semibold text-[16px] text-[#1d1d1f] flex items-center gap-2"><Icons.FileText size={18} className="text-[#af52de]"/> 系統操作履歷</h3>
                                    <button onClick={() => setShowLogsModal(false)} className="p-1.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#86868b] rounded-full transition-colors"><Icons.X size={18}/></button>
                                </div>
                                <div className="p-6 max-h-[500px] overflow-y-auto space-y-4 bg-[#fbfbfd]">
                                    {logs.length === 0 ? (
                                        <p className="text-center text-[#86868b] py-8">目前無操作紀錄</p>
                                    ) : (
                                        logs.map(log => (
                                            <div key={log.id} className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                                <div className="bg-[#f5f5f7] text-[#86868b] text-[12px] font-mono px-3 py-1 rounded-lg whitespace-nowrap mt-0.5">
                                                    {log.time}
                                                </div>
                                                <div>
                                                    <h4 className="text-[14px] font-bold text-[#1d1d1f]">{log.action}</h4>
                                                    <p className="text-[13px] text-[#86868b] mt-0.5">{log.details}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        const GridSvgViewer = React.memo(React.forwardRef(({
            selectedPart, currentPart2, showHeatmap, dotFilter, measurements, issues, 
            inputMode, currentExactPos, isDragging, setIsDragging, dragFlag,
            formData, setFormData, issueFormData, setIssueFormData,
            handlePartClick, handleBackgroundClick, handleEditRecord, handleDotMouseDown, handleDotTouchStart,
            getHeatmapColor, getDotColor,
            currentPaths, currentView, isDevMode, setDevCoordinates
        }, ref) => {
            const svgRef = React.useRef(null);
            const [viewBox, setViewBox] = React.useState({ x: 0, y: 0, w: 800, h: 620 });
            const panZoomState = React.useRef({ isPanning: false, startX: 0, startY: 0, startViewBox: null, initialPinchDistance: null });

            React.useImperativeHandle(ref, () => ({
                resetView: () => setViewBox({ x: 0, y: 0, w: 800, h: 620 })
            }));

            React.useEffect(() => {
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

                const segs = getSharedSegments(currentPaths[selectedPart], currentPaths[p2]);
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
                const svg = svgRef.current;
                if (!svg) return;
                
                // 更精準的座標轉換，處理 preserveAspectRatio 的縮放與留白
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
                    className={`w-full h-full max-w-[800px] drop-shadow-sm select-none ${currentView === '2d' ? 'cursor-grab active:cursor-grabbing' : ''}`} 
                    style={{ 
                        touchAction: 'none',
                        cursor: currentView !== '2d' ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M12 2v20M2 12h20' stroke='%23ff3b30' stroke-width='2'/><circle cx='12' cy='12' r='8' fill='none' stroke='%23ffffff' stroke-width='1.5'/></svg>") 12 12, crosshair` : undefined
                    }}
                    onMouseDown={currentView === '2d' ? handleSvgMouseDown : undefined}
                    onMouseMove={currentView === '2d' ? handleSvgMouseMove : undefined}
                    onMouseUp={currentView === '2d' ? handleSvgMouseUp : undefined}
                    onMouseLeave={currentView === '2d' ? handleSvgMouseUp : undefined}
                    onTouchStart={currentView === '2d' ? handleSvgTouchStart : undefined}
                    onTouchMove={currentView === '2d' ? handleSvgTouchMove : undefined}
                    onTouchEnd={currentView === '2d' ? handleSvgMouseUp : undefined}
                    onTouchCancel={currentView === '2d' ? handleSvgMouseUp : undefined}
                    onClick={handleSvgClick}
                >
                    {currentView !== '2d' && (
                        <image 
                            href={currentView === 'left' ? 'left_view.png' : 'right_view.png'} 
                            x="0" y="0" width="800" height="620" 
                            preserveAspectRatio="xMidYMid meet"
                            opacity="0.8"
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

                    {/* 繪製可拖曳範圍的提示線 */}
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

        // ==========================================
        // 4. 子組件：工作區 (SVG + 面板)
        // ==========================================
