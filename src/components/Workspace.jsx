import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { GridSvgViewer } from './GridSvgViewer';
import { SidebarForm } from './SidebarForm';
import { PART_NAME_MAP, ISSUE_CATEGORIES, PARTS_HIERARCHY, ADJACENT_MAP, ISSUE_CATEGORIES_COLORS, STANDARD_TOLERANCES } from '../utils/constants';
import { calculateDistance, getPointOnLine, calculateAngle, checkIntersection, getStatus } from '../utils/geometry';
import { db, ref, push, set, onValue, get, update, remove, query, orderByChild, limitToLast } from '../utils/firebase';

export function Workspace({ currentModel, updateModel, workOrders, createWorkOrder, editWorkOrder, deleteWorkOrder, hasMoreWOs, loadMoreWOs, logs, addLog, onBack, openPrompt, openConfirm, setViewingPhoto, setShowContactsModal, contacts, setAnnotatingPhoto, isMobile, mobileActiveTab, setMobileActiveTab, isBottomSheetOpen, setIsBottomSheetOpen, isMobileMenuOpen, setIsMobileMenuOpen, setGlobalLoading, isConnected }) {
            const [activeTab, setActiveTab] = useState('measure');
            const [selectedPart, setSelectedPart] = useState(null);
            const [previewRecordId, setPreviewRecordId] = useState(null);
            const [currentWOId, setCurrentWOId] = useState(`WO-${Date.now().toString(36).toUpperCase()}`);
            
            const [measurements, setMeasurements] = useState([]);
            const [isDirty, setIsDirty] = useState(false);
            const [formData, setFormData] = useState({ part2: '', gap: '', flush: '', exactPosition: null });
            const [tempPhotoUrl, setTempPhotoUrl] = useState(null);
            const [isUploading, setIsUploading] = useState(false);

            const [inputMode, setInputMode] = useState('measure');
            const [issues, setIssues] = useState([]);
            const [issueFormData, setIssueFormData] = useState({
                part2: '', foundDate: new Date().toISOString().split('T')[0],
                category: ISSUE_CATEGORIES[0], description: '', countermeasure: '',
                designPic: '', devPic: '', exactPosition: null
            });

            const [customStd, setCustomStd] = useState(currentModel.std);
            const fileInputRef = useRef(null);
            
            const [currentView, setCurrentView] = useState('left');
            const [isDevMode, setIsDevMode] = useState(false);
            const [devCoordinates, setDevCoordinates] = useState([]);
            const currentPaths = currentView === 'left' ? PART_PATHS_LEFT : currentView === 'right' ? PART_PATHS_RIGHT : PART_PATHS_2D;

            const [isDragging, setIsDragging] = useState(false);
            const dragFlag = useRef(false); 
            const lastClickTimeRef = useRef({});
            
            const [showLogsModal, setShowLogsModal] = useState(false);
            const [showHeatmap, setShowHeatmap] = useState(false);
            const [dotFilter, setDotFilter] = useState('all'); // 'all', 'ng_only', 'none'
            const [sheetState, setSheetState] = useState('half');
const [showSwipeHint, setShowSwipeHint] = useState(false);
const handleInputModeSwitch = (mode) => {
    if (mode === inputMode) return;
    if (mode === 'issue' && inputMode === 'measure') {
        setIssueFormData(prev => ({...prev, part2: formData.part2, exactPosition: formData.exactPosition, customPart1: formData.customPart1, customPart2: formData.customPart2}));
    } else if (mode === 'measure' && inputMode === 'issue') {
        setFormData(prev => ({...prev, part2: issueFormData.part2, exactPosition: issueFormData.exactPosition, customPart1: issueFormData.customPart1, customPart2: issueFormData.customPart2}));
    }
    setInputMode(mode);
};
const sheetTouchStartY = useRef(0);
            const gridSvgRef = useRef(null);
            const [toastMsg, setToastMsg] = useState(null);
            const [historyDate, setHistoryDate] = useState(new Date());
            const [expandedStatsGroups, setExpandedStatsGroups] = useState({});

            const toggleStatsGroup = (title) => {
                setExpandedStatsGroups(prev => ({ ...prev, [title]: !prev[title] }));
            };

            
            // Keyboard Shortcuts
            useEffect(() => {
                const handleKeyDown = (e) => {
                    if (e.key === 'Escape') {
                        if (document.activeElement && document.activeElement.blur) {
                            document.activeElement.blur();
                        }
                        // Force clearing selection directly instead of using handleBackgroundClick
                        // to avoid dragFlag block, just in case.
                        setPreviewRecordId(null);
                        setSelectedPart(null);
                        setFormData({ part2: '', gap: '', flush: '', exactPosition: null, customPart1: '', customPart2: '' });
                        setIssueFormData(prev => ({ ...prev, part2: '', exactPosition: null, customPart1: '', customPart2: '' }));
                        setSheetState('collapsed');
                        return;
                    }

                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

                    if (e.key === '1') setCurrentView('left');
                    if (e.key === '2') setCurrentView('right');
                    if (e.key === '3') setCurrentView('2d');
                    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                        e.preventDefault();
                        handleCreateWO();
                    }
                };
                window.addEventListener('keydown', handleKeyDown, true);
                return () => window.removeEventListener('keydown', handleKeyDown, true);
            }, [setCurrentView, handleCreateWO]);

            const handleResetView = () => {
                if (gridSvgRef.current) gridSvgRef.current.resetView();
            };

            // 監聽部位選擇，自動載入該部位專屬公差
            useEffect(() => {
                if (selectedPart && formData.part2) {
                    const key1 = `${selectedPart}-${formData.part2}`;
                    const key2 = `${formData.part2}-${selectedPart}`;
                    const specificStd = currentModel.partStd?.[key1] || currentModel.partStd?.[key2];
                    setCustomStd(specificStd || currentModel.std);
                }
            }, [selectedPart, formData.part2, currentModel]);

            const showToast = (msg, type = 'warning') => {
                setToastMsg({ text: msg, type });
                setTimeout(() => setToastMsg(null), 3500);
            };

            const handleBackgroundClick = () => {
                if (dragFlag.current || isDevMode) return; 
                setPreviewRecordId(null);
                setSelectedPart(null);
                setFormData({ part2: '', gap: '', flush: '', exactPosition: null, customPart1: '', customPart2: '' });
                setIssueFormData(prev => ({ ...prev, part2: '', exactPosition: null, customPart1: '', customPart2: '' }));
                setSheetState('collapsed');
            };

            const handlePartClick = (e, partId, customPosition = null) => {
                e.stopPropagation();
                if (dragFlag.current || isDevMode) return;
                
                if (partId === 'custom_point') {
                    setSelectedPart('custom_point');
                    if (inputMode === 'measure') {
                        setFormData({ id: '', part2: 'custom_point', gap: '', flush: '', exactPosition: customPosition, customPart1: '', customPart2: '' });
                    } else {
                        setIssueFormData(prev => ({ ...prev, id: '', part2: 'custom_point', exactPosition: customPosition, customPart1: '', customPart2: '' }));
                    }
                    setActiveTab('measure');
                    if (window.innerWidth < 1024) {
                        setSheetState('half');
                        setIsBottomSheetOpen(true);
                    }
                    return;
                }

                if (!selectedPart) {
                    setSelectedPart(partId);
                    setFormData({ part2: '', gap: '', flush: '', exactPosition: null, customPart1: '', customPart2: '' });
                    setIssueFormData(prev => ({ ...prev, part2: '', exactPosition: null, customPart1: '', customPart2: '' }));
                    setActiveTab('measure');
                    setSheetState('collapsed');
                    if (window.innerWidth < 1024) setIsBottomSheetOpen(true);
                } else if (selectedPart === partId) {
                    handleBackgroundClick();
                } else {
                    const adjacentParts = ADJACENT_MAP[selectedPart] || [];
                    if (adjacentParts.includes(partId)) {
                        const currentP2 = inputMode === 'measure' ? formData.part2 : issueFormData.part2;
                        if (currentP2 === partId) return;

                        if (window.innerWidth < 1024) {
                            setSheetState('half');
                            setShowSwipeHint(true);
                            setTimeout(() => setShowSwipeHint(false), 3000);
                        }

                        if (inputMode === 'measure') {
                            setFormData(prev => ({ ...prev, id: '', part2: partId, gap: '', flush: '' }));
                        } else {
                            setIssueFormData(prev => ({ ...prev, id: '', part2: partId, category: ISSUE_CATEGORIES[0], description: '', countermeasure: '', designPic: '', devPic: '' }));
                        }
                        setTempPhotoUrl(null);
                        
                        const segs = getSharedSegments(currentPaths[selectedPart], currentPaths[partId]);
                        if (segs.length > 0) {
                            // 預設放在第一段的最中間
                            const seg = segs[0];
                            const midX = (seg[0].x + seg[1].x) / 2;
                            const midY = (seg[0].y + seg[1].y) / 2;
                            if (inputMode === 'measure') setFormData(prev => ({...prev, exactPosition: {x: midX, y: midY}}));
                            else setIssueFormData(prev => ({...prev, exactPosition: {x: midX, y: midY}}));
                        }
                    } else {
                        showToast(`「${PART_NAME_MAP[partId]}」與「${PART_NAME_MAP[selectedPart]}」不相鄰！`);
                    }
                }
            };

            const handlePart2Change = (e, mode) => {
                const p2 = e.target.value;
                const currentP2 = mode === 'measure' ? formData.part2 : issueFormData.part2;
                if (p2 === currentP2) return;

                if (window.innerWidth < 1024) {
                    if (p2) {
                        setSheetState('half');
                        setShowSwipeHint(true);
                        setTimeout(() => setShowSwipeHint(false), 3000);
                    } else {
                        setSheetState('collapsed');
                    }
                }

                if (mode === 'measure') {
                    setFormData({...formData, id: '', part2: p2, gap: '', flush: ''});
                } else {
                    setIssueFormData({...issueFormData, id: '', part2: p2, category: ISSUE_CATEGORIES[0], description: '', countermeasure: '', designPic: '', devPic: ''});
                }
                setTempPhotoUrl(null);
                
                if (p2 && selectedPart) {
                    const segs = getSharedSegments(currentPaths[selectedPart], currentPaths[p2]);
                    if (segs.length > 0) {
                        const seg = segs[0];
                        const midX = (seg[0].x + seg[1].x) / 2;
                        const midY = (seg[0].y + seg[1].y) / 2;
                        if (mode === 'measure') setFormData(prev => ({...prev, exactPosition: {x: midX, y: midY}}));
                        else setIssueFormData(prev => ({...prev, exactPosition: {x: midX, y: midY}}));
                    }
                }
            };

            const handleDotMouseDown = (e) => {
                e.stopPropagation();
                setIsDragging(true);
                dragFlag.current = false;
            };

            const handleDotTouchStart = (e) => {
                e.stopPropagation();
                setIsDragging(true);
                dragFlag.current = false;
            };

            const handleStdChange = (field, val) => {
                const newStd = { ...customStd, [field]: val };
                setCustomStd(newStd);
                if (selectedPart && formData.part2) {
                    const key = `${selectedPart}-${formData.part2}`;
                    updateModel({
                        ...currentModel,
                        partStd: { ...(currentModel.partStd || {}), [key]: newStd }
                    });
                }
            };

            const handleListRecordClick = (record, mode) => {
                const now = Date.now();
                const lastClick = lastClickTimeRef.current[record.id] || 0;
                
                // 無論單擊或雙擊，都先確保資料被正確載入
                setInputMode(mode);
                setSelectedPart(record.part1);
                setCurrentView(record.viewMode || '2d');
                if (mode === 'measure') {
                    setFormData({ id: record.id, part2: record.part2, gap: record.gap !== '-' ? record.gap : '', flush: record.flush !== '-' ? record.flush : '', exactPosition: record.exactPosition });
                } else {
                    setIssueFormData({
                        id: record.id, part2: record.part2, foundDate: record.foundDate,
                        category: record.category, description: record.description,
                        countermeasure: record.countermeasure, designPic: record.designPic,
                        devPic: record.devPic, exactPosition: record.exactPosition
                    });
                }
                setTempPhotoUrl(record.photoUrl);

                if (now - lastClick < 400 || previewRecordId === record.id) {
                    if (window.innerWidth < 1024) {
                        setMobileActiveTab('grid');
                        setSheetState('collapsed');
                        setIsBottomSheetOpen(true);
                    } else {
                        setActiveTab('measure');
                    }
                    setPreviewRecordId(null);
                    lastClickTimeRef.current[record.id] = 0;
                } else {
                    lastClickTimeRef.current[record.id] = now;
                    setPreviewRecordId(record.id);
                }
            };

            const handleEditRecord = (record, mode) => {
                setActiveTab('measure');
                setInputMode(mode);
                setCurrentView(record.viewMode || '2d');
                if (record.isCustomPoint) {
                    setSelectedPart('custom_point');
                    if (mode === 'measure') {
                        setFormData({ id: record.id, part2: 'custom_point', customPart1: record.part1 === 'custom_point' ? '' : record.part1, customPart2: record.part2 === 'custom_point' ? '' : record.part2, gap: record.gap !== '-' ? record.gap : '', flush: record.flush !== '-' ? record.flush : '', exactPosition: record.exactPosition });
                    } else {
                        setIssueFormData({
                            id: record.id, part2: 'custom_point', customPart1: record.part1 === 'custom_point' ? '' : record.part1, customPart2: record.part2 === 'custom_point' ? '' : record.part2, foundDate: record.foundDate,
                            category: record.category, description: record.description,
                            countermeasure: record.countermeasure, designPic: record.designPic,
                            devPic: record.devPic, exactPosition: record.exactPosition
                        });
                    }
                } else {
                    setSelectedPart(record.part1);
                    if (mode === 'measure') {
                        setFormData({ id: record.id, part2: record.part2, gap: record.gap !== '-' ? record.gap : '', flush: record.flush !== '-' ? record.flush : '', exactPosition: record.exactPosition, customPart1: '', customPart2: '' });
                    } else {
                        setIssueFormData({
                            id: record.id, part2: record.part2, foundDate: record.foundDate,
                            category: record.category, description: record.description,
                            countermeasure: record.countermeasure, designPic: record.designPic,
                            devPic: record.devPic, exactPosition: record.exactPosition, customPart1: '', customPart2: ''
                        });
                    }
                }
                setTempPhotoUrl(record.photoUrl);
                if (window.innerWidth < 1024) {
                    setMobileActiveTab('grid');
                    setSheetState('collapsed');
                    setIsBottomSheetOpen(true);
                }
            };

            // 刪除紀錄功能
            const handleDeleteRecord = (e, id, type, title) => {
                e.stopPropagation();
                openConfirm("刪除紀錄", `確定要刪除此筆${title}嗎？`, () => {
                    if (type === 'measure') {
                        setMeasurements(measurements.filter(m => m.id !== id));
                        addLog('刪除量測', `刪除了一筆量測數據`);
                    } else {
                        setIssues(issues.filter(i => i.id !== id));
                        addLog('刪除問題點', `刪除了一筆問題點紀錄`);
                    }
                    setIsDirty(true);
                });
            };

            // 取得 ImgBB API Key (含 Prompt 邏輯)
            const getImgBBKeyAsync = () => {
                return new Promise(resolve => {
                    const key = localStorage.getItem('imgbb_api_key');
                    if (key) resolve(key);
                    else {
                        openPrompt(
                            "需要 ImgBB API Key", 
                            "為了免費儲存照片，請至 api.imgbb.com 免費註冊並取得 API Key：", 
                            "", 
                            (newKey) => {
                                if (newKey && newKey.trim()) {
                                    localStorage.setItem('imgbb_api_key', newKey.trim());
                                    resolve(newKey.trim());
                                } else {
                                    resolve(null);
                                }
                            }
                        );
                    }
                });
            };

            const handleFileChange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const apiKey = await getImgBBKeyAsync();
                    if (!apiKey) {
                        showToast("未設定 API Key，取消上傳");
                        return;
                    }
                    
                    setIsUploading(true);
                    setGlobalLoading(true);

                    // 在上傳前先進行前端壓縮 (最大 1280x1280, 品質 70%)
                    const compressedFile = await compressImage(file);

                    const result = await uploadImageToImgBB(compressedFile, apiKey);
                    if (result.success) {
                        setTempPhotoUrl(result.url);
                        showToast("照片上傳成功！", 'success');
                    } else {
                        showToast(`上傳失敗: ${result.error}`, 'error');
                        if (result.error && result.error.toLowerCase().includes('key')) {
                            localStorage.removeItem('imgbb_api_key'); // 清除無效的 Key
                        }
                    }
                    setIsUploading(false);
                    setGlobalLoading(false);
                }
            };

            const autoSaveWO = (updatedMeasurements, updatedIssues) => {
                const isExisting = workOrders.some(wo => wo.id === currentWOId);
                
                if (isExisting) {
                    const newWO = { 
                        id: currentWOId, 
                        date: new Date().toLocaleString(), 
                        model: currentModel.name, 
                        data: updatedMeasurements, 
                        issueData: updatedIssues 
                    };
                    createWorkOrder(newWO);
                    showToast(`工單已自動更新 (${currentWOId})`, 'success');
                    setIsDirty(false);
                } else {
                    setIsDirty(true);
                    openPrompt("自動建立工單", "偵測到新資料！請確認或變更工單名稱：", currentWOId, (newId) => {
                        const finalId = newId && newId.trim() ? newId.trim() : currentWOId;
                        const newWO = { 
                            id: finalId, 
                            date: new Date().toLocaleString(), 
                            model: currentModel.name, 
                            data: updatedMeasurements, 
                            issueData: updatedIssues 
                        };
                        createWorkOrder(newWO);
                        if (finalId !== currentWOId) {
                            setCurrentWOId(finalId);
                        }
                        showToast(`已建立並儲存工單 ${finalId}`, 'success');
                        setIsDirty(false);
                    });
                }
            };

            const handleSaveMeasurement = () => {
                const p1 = selectedPart === 'custom_point' ? (formData.customPart1 || 'custom_point') : selectedPart;
                const p2 = selectedPart === 'custom_point' ? (formData.customPart2 || 'custom_point') : formData.part2;
                if (!p1 || (!p2 && selectedPart !== 'custom_point')) return;
                const gapVal = parseFloat(formData.gap);
                const flushVal = parseFloat(formData.flush);
                const newRecord = {
                    id: formData.id || `M-${Date.now().toString().slice(-6)}`, type: 'measurement',
                    part1: p1, part2: p2, isCustomPoint: selectedPart === 'custom_point',
                    viewMode: currentView,
                    gap: isNaN(gapVal) ? '-' : gapVal, flush: isNaN(flushVal) ? '-' : flushVal,
                    gapStatus: getStatus(gapVal, customStd.gap, customStd.tolGap),
                    flushStatus: getStatus(flushVal, customStd.flush, customStd.tolFlush),
                    photoUrl: tempPhotoUrl, exactPosition: formData.exactPosition
                };
                
                let updated = [...measurements];
                const existingIndex = updated.findIndex(m => m.id === newRecord.id);
                if (existingIndex >= 0) {
                    updated[existingIndex] = newRecord;
                    setMeasurements(updated);
                    addLog('修改量測', `修改了 ${PART_NAME_MAP[selectedPart]} 與 ${PART_NAME_MAP[formData.part2]} 的量測數據`);
                } else {
                    updated = [...updated, newRecord];
                    setMeasurements(updated);
                    addLog('新增量測', `記錄了 ${PART_NAME_MAP[selectedPart]} 與 ${PART_NAME_MAP[formData.part2]} 的量測數據`);
                }
                
                updateModel({ ...currentModel, updatedAt: new Date().toLocaleString() });
                setSelectedPart(null);
                setSheetState('collapsed');
                setFormData({ part2: '', gap: '', flush: '', exactPosition: null, customPart1: '', customPart2: '' });
                setTempPhotoUrl(null);
                
                autoSaveWO(updated, issues);
            };

            const handleExportPDF = async () => {
                setGlobalLoading(true);
                const element = document.getElementById('pdf-report-template');
                
                try {
                    // 動態載入 html2canvas 與 jspdf
                    if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
                        await Promise.all([
                            new Promise((resolve, reject) => {
                                const script = document.createElement('script');
                                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                                script.onload = resolve;
                                script.onerror = () => reject(new Error('無法從 CDN 載入 html2canvas'));
                                document.head.appendChild(script);
                            }),
                            new Promise((resolve, reject) => {
                                const script = document.createElement('script');
                                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                                script.onload = resolve;
                                script.onerror = () => reject(new Error('無法從 CDN 載入 jspdf'));
                                document.head.appendChild(script);
                            })
                        ]);
                    }

                    if (element && window.html2canvas && window.jspdf) {
                        element.style.display = 'block';
                        element.style.top = '0px';
                        element.style.left = '0px';
                        element.style.zIndex = '-1';
                        
                        // 等待一下讓 DOM 確實繪製
                        await new Promise(r => setTimeout(r, 150));

                        // 分頁防裁切邏輯
                        const pdfWidth_mm = 297;
                        const margin_mm = 10;
                        const printWidth_mm = pdfWidth_mm - margin_mm * 2;
                        const printHeight_mm = 210 - margin_mm * 2;
                        const pxPerMm = 1120 / printWidth_mm;
                        const pageHeightPx = printHeight_mm * pxPerMm;

                        const rows = Array.from(element.querySelectorAll('tr'));
                        for (let row of rows) {
                            const rect = row.getBoundingClientRect();
                            const elementRect = element.getBoundingClientRect();
                            const top = rect.top - elementRect.top;
                            const bottom = top + rect.height;
                            
                            const pageTop = Math.floor(top / pageHeightPx);
                            const pageBottom = Math.floor((bottom - 1) / pageHeightPx);
                            
                            if (pageBottom > pageTop && rect.height < pageHeightPx) {
                                const nextPageTop = (pageTop + 1) * pageHeightPx;
                                const pushAmount = nextPageTop - top;
                                
                                const spacer = document.createElement('tr');
                                spacer.className = 'pdf-spacer';
                                spacer.style.height = `${pushAmount}px`;
                                const td = document.createElement('td');
                                td.colSpan = 10;
                                td.style.border = 'none';
                                spacer.appendChild(td);
                                row.parentNode.insertBefore(spacer, row);
                            }
                        }

                        // 再次等待 DOM 更新
                        await new Promise(r => setTimeout(r, 100));

                        const canvas = await window.html2canvas(element, {
                            scale: 2,
                            useCORS: true,
                            backgroundColor: '#ffffff'
                        });

                        // 清除防裁切空白列
                        const spacers = element.querySelectorAll('.pdf-spacer');
                        spacers.forEach(s => s.remove());

                        element.style.display = 'none';

                        const imgData = canvas.toDataURL('image/jpeg', 0.98);
                        const pdf = new window.jspdf.jsPDF('l', 'mm', 'a4');
                        const pdfWidth = 297;
                        const pdfHeight = 210;
                        const margin = 10;
                        const printWidth = pdfWidth - margin * 2;
                        const printHeight = (canvas.height * printWidth) / canvas.width;
                        const pageHeight = pdfHeight - margin * 2;

                        let heightLeft = printHeight;
                        let position = 0;

                        // 第一頁
                        pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, printHeight);
                        pdf.setFillColor(255, 255, 255);
                        pdf.rect(0, 0, pdfWidth, margin, 'F'); // 遮蓋上邊界
                        pdf.rect(0, pdfHeight - margin, pdfWidth, margin, 'F'); // 遮蓋下邊界
                        heightLeft -= pageHeight;

                        // 之後的頁面
                        while (heightLeft > 0) {
                            position -= pageHeight;
                            pdf.addPage();
                            pdf.addImage(imgData, 'JPEG', margin, margin + position, printWidth, printHeight);
                            pdf.setFillColor(255, 255, 255);
                            pdf.rect(0, 0, pdfWidth, margin, 'F');
                            pdf.rect(0, pdfHeight - margin, pdfWidth, margin, 'F');
                            heightLeft -= pageHeight;
                        }

                        pdf.save(`${currentModel.name}_建付分析報告_${new Date().toISOString().split('T')[0]}.pdf`);
                        
                        addLog('匯出報表', `匯出了 ${currentModel.name} 的 PDF 報告`);
                    } else {
                        throw new Error('找不到報表模板或模組載入異常');
                    }
                } catch (e) {
                    showToast('PDF 匯出失敗: ' + (e.message || '未知錯誤'), 'error');
                    console.error(e);
                    if (element) element.style.display = 'none';
                }
                
                setGlobalLoading(false);
            };

            const handleSaveIssue = () => {
                const p1 = selectedPart === 'custom_point' ? (issueFormData.customPart1 || 'custom_point') : selectedPart;
                const p2 = selectedPart === 'custom_point' ? (issueFormData.customPart2 || 'custom_point') : issueFormData.part2;
                if (!p1 || (!p2 && selectedPart !== 'custom_point') || !issueFormData.description) return;
                const newIssue = {
                    ...issueFormData,
                    id: issueFormData.id || `ISSUE-${Date.now().toString(36).toUpperCase()}`, type: 'issue',
                    part1: p1, part2: p2, isCustomPoint: selectedPart === 'custom_point',
                    viewMode: currentView,
                    photoUrl: tempPhotoUrl
                };
                
                let updated = [...issues];
                const existingIndex = updated.findIndex(i => i.id === newIssue.id);
                if (existingIndex >= 0) {
                    updated[existingIndex] = newIssue;
                    setIssues(updated);
                    addLog('修改問題點', `修改了 ${PART_NAME_MAP[selectedPart]} 的問題紀錄`);
                } else {
                    updated = [...updated, newIssue];
                    setIssues(updated);
                    addLog('新增問題點', `記錄了 ${PART_NAME_MAP[selectedPart]} 的問題：${issueFormData.category}`);
                }
                
                updateModel({ ...currentModel, updatedAt: new Date().toLocaleString() });
                setSelectedPart(null);
                setSheetState('collapsed');
                setIssueFormData({
                    part2: '', foundDate: new Date().toISOString().split('T')[0],
                    category: ISSUE_CATEGORIES[0], description: '', countermeasure: '',
                    designPic: '', devPic: '', exactPosition: null, customPart1: '', customPart2: ''
                });
                setTempPhotoUrl(null);
                
                autoSaveWO(measurements, updated);
            };

            const handleCreateWO = () => {
                let currentMeasurements = [...measurements];
                let currentIssues = [...issues];

                // 自動儲存正在編輯中尚未按「儲存紀錄」的資料
                if (selectedPart) {
                    if (inputMode === 'measure' && (formData.part2 || selectedPart === 'custom_point')) {
                        const gapVal = parseFloat(formData.gap);
                        const flushVal = parseFloat(formData.flush);
                        if (!isNaN(gapVal) || !isNaN(flushVal)) {
                            const p1 = selectedPart === 'custom_point' ? (formData.customPart1 || 'custom_point') : selectedPart;
                            const p2 = selectedPart === 'custom_point' ? (formData.customPart2 || 'custom_point') : formData.part2;
                            const newRecord = {
                                id: formData.id || `M-${Date.now().toString(36).toUpperCase()}`, type: 'measurement',
                                part1: p1, part2: p2, isCustomPoint: selectedPart === 'custom_point',
                                viewMode: currentView,
                                gap: isNaN(gapVal) ? '-' : gapVal, flush: isNaN(flushVal) ? '-' : flushVal,
                                gapStatus: getStatus(gapVal, customStd.gap, customStd.tolGap),
                                flushStatus: getStatus(flushVal, customStd.flush, customStd.tolFlush),
                                photoUrl: tempPhotoUrl, exactPosition: formData.exactPosition
                            };
                            const existingIndex = currentMeasurements.findIndex(m => m.id === newRecord.id);
                            if (existingIndex >= 0) currentMeasurements[existingIndex] = newRecord;
                            else currentMeasurements.push(newRecord);
                        }
                    } else if (inputMode === 'issue' && (issueFormData.part2 || selectedPart === 'custom_point') && issueFormData.description) {
                        const p1 = selectedPart === 'custom_point' ? (issueFormData.customPart1 || 'custom_point') : selectedPart;
                        const p2 = selectedPart === 'custom_point' ? (issueFormData.customPart2 || 'custom_point') : issueFormData.part2;
                        const newIssue = {
                            ...issueFormData,
                            id: issueFormData.id || `ISSUE-${Date.now().toString(36).toUpperCase()}`, type: 'issue',
                            part1: p1, part2: p2, isCustomPoint: selectedPart === 'custom_point',
                            viewMode: currentView,
                            photoUrl: tempPhotoUrl
                        };
                        const existingIndex = currentIssues.findIndex(i => i.id === newIssue.id);
                        if (existingIndex >= 0) currentIssues[existingIndex] = newIssue;
                        else currentIssues.push(newIssue);
                    }
                }

                if(currentMeasurements.length === 0 && currentIssues.length === 0) {
                    showToast("目前無任何紀錄，無法建立工單！");
                    return;
                }
                const newWO = { 
                    id: currentWOId, 
                    date: new Date().toLocaleString(), 
                    model: currentModel.name, 
                    data: currentMeasurements, 
                    issueData: currentIssues 
                };
                createWorkOrder(newWO);
                addLog('儲存工單', `儲存了工單 ${currentWOId} (${currentModel.name})`);
                setCurrentWOId(`WO-${Date.now().toString(36).toUpperCase()}`);
                setMeasurements([]); setIssues([]); setSelectedPart(null); setActiveTab('measure');
                setIsDirty(false);
            };

            const handleLoadWO = (wo) => {
                const load = () => {
                    setCurrentWOId(wo.id);
                    setMeasurements(wo.data || []);
                    setIssues(wo.issueData || []);
                    setIsDirty(false);
                    setActiveTab('measure');
                    if (window.innerWidth < 1024) {
                        setMobileActiveTab('grid');
                        setIsBottomSheetOpen(false);
                    }
                    addLog('載入工單', `載入了工單 ${wo.id}`);
                };

                if (isDirty) {
                    openConfirm("載入工單", "目前有未儲存的紀錄，載入工單將會覆蓋當前資料。確定要繼續嗎？", load);
                } else {
                    load();
                }
            };

            const handleEditWO = (e, id) => {
                e.stopPropagation();
                openPrompt("編輯工單", "請輸入新的工單名稱：", id, (newId) => {
                    if (newId && newId.trim() && newId.trim() !== id) {
                        editWorkOrder(id, newId.trim());
                        addLog('編輯工單', `將工單「${id}」更名為「${newId.trim()}」`);
                    }
                });
            };

            const handleDeleteWO = (id) => {
                openConfirm("刪除工單", `確定要刪除工單 ${id} 嗎？此動作無法復原。`, () => {
                    deleteWorkOrder(id);
                    addLog('刪除工單', `刪除了工單 ${id}`);
                });
            };

            const handleExportCSV = (wo) => {
                let csv = "\uFEFF工單編號,建立時間,車型,紀錄類型,部位1,部位2,間隙(Gap),段差(Flush),間隙判定,段差判定,問題類別,問題描述,設計承辦,開發承辦,照片網址\n";
                (wo.data || []).forEach(m => {
                    csv += `${wo.id},${wo.date},${wo.model},量測數據,${PART_NAME_MAP[m.part1]},${PART_NAME_MAP[m.part2]},${m.gap},${m.flush},${m.gapStatus},${m.flushStatus},,,,,${m.photoUrl || ''}\n`;
                });
                (wo.issueData || []).forEach(i => {
                    csv += `${wo.id},${wo.date},${wo.model},問題點,${PART_NAME_MAP[i.part1]},${PART_NAME_MAP[i.part2]},,,,,${i.category},${i.description},${i.designPic},${i.devPic},${i.photoUrl || ''}\n`;
                });
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${wo.id}_匯出.csv`;
                link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
                addLog('匯出報表', `匯出了工單 ${wo.id} 的 CSV 報表`);
            };

            const allMeasurements = [...measurements];
            const allIssues = [...issues];
            workOrders.forEach(wo => {
                if (wo.model === currentModel.name) {
                    if (wo.data) allMeasurements.push(...wo.data);
                    if (wo.issueData) allIssues.push(...wo.issueData);
                }
            });

            const calcYield = (partsArray) => {
                const relevant = allMeasurements.filter(m => partsArray.includes(m.part1) || partsArray.includes(m.part2));
                if (relevant.length === 0) return null;
                const okCount = relevant.filter(m => m.gapStatus === 'OK' && m.flushStatus === 'OK').length;
                return Math.round((okCount / relevant.length) * 100);
            };

            const getStatusColor = (status) => {
                if (status === 'OK') return 'text-[#34c759] bg-[#34c759]/10';
                if (status === 'WARN') return 'text-[#ff9500] bg-[#ff9500]/10';
                if (status === 'NG') return 'text-[#ff3b30] bg-[#ff3b30]/10';
                return 'text-[#86868b] bg-[#f5f5f7]';
            };
            
            const getDotColor = (status) => {
                if (status === 'NG') return 'fill-[#ff3b30]';
                if (status === 'WARN') return 'fill-[#ff9500]';
                if (status === 'OK') return 'fill-[#34c759]';
                if (status === 'ISSUE') return 'fill-[#af52de]';
                return 'fill-transparent';
            };

            const getPartOverallStatus = (partId) => {
                const hasIssue = issues.some(i => i.part1 === partId || i.part2 === partId);
                if (hasIssue) return 'ISSUE';
                const related = measurements.filter(m => m.part1 === partId || m.part2 === partId);
                if (related.length === 0) return 'NONE';
                const statuses = related.flatMap(m => [m.gapStatus, m.flushStatus]);
                if (statuses.includes('NG')) return 'NG';
                if (statuses.includes('WARN')) return 'WARN';
                if (statuses.includes('OK')) return 'OK';
                return 'NONE';
            };

            const getHeatmapColor = (partId) => {
                const relatedM = allMeasurements.filter(m => m.part1 === partId || m.part2 === partId);
                const relatedI = allIssues.filter(i => i.part1 === partId || i.part2 === partId);
                const total = relatedM.length + relatedI.length;
                if (total === 0) return '#ffffff';
                const ngCount = relatedM.filter(m => m.gapStatus === 'NG' || m.flushStatus === 'NG').length + relatedI.length;
                const ratio = ngCount / total;
                if (ratio === 0) return '#e5f9e7'; // 綠色 (安全)
                if (ratio < 0.3) return '#fff4ce'; // 黃色 (警告)
                return '#ffe5e5'; // 紅色 (危險)
            };

            const currentExactPos = inputMode === 'measure' ? formData.exactPosition : issueFormData.exactPosition;
            const currentPart2 = inputMode === 'measure' ? formData.part2 : issueFormData.part2;

            return (
                <div className="h-screen flex flex-col relative animate-fade-in overflow-hidden bg-[#f5f5f7]">
                    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3 md:gap-4 flex-1">
                            <button onClick={onBack} className="p-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] rounded-full transition-colors shrink-0">
                                <Icons.ChevronLeft size={20} />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-base md:text-lg font-semibold tracking-tight text-[#1d1d1f] truncate flex items-center gap-2">
                                    {currentModel.name}
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
                                <p className="text-[12px] md:text-[13px] text-[#86868b] font-medium truncate">工單: <span className="font-mono text-[#0071e3]">{currentWOId}</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 shrink-0">
                            {isMobile ? (
                                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full transition-colors">
                                    <Icons.Menu size={24} />
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => setShowContactsModal(true)} className="flex items-center justify-center bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] px-4 py-2.5 rounded-full text-[13px] font-semibold transition-colors">
                                        <Icons.Users size={16} /> <span className="ml-1.5">聯絡人</span>
                                    </button>
                                    <button onClick={() => setShowLogsModal(true)} className="flex items-center justify-center bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] px-4 py-2.5 rounded-full text-[13px] font-semibold transition-colors">
                                        <Icons.FileText size={16} /> <span className="ml-1.5">系統履歷</span>
                                    </button>
                                    <button onClick={handleCreateWO} className="flex items-center justify-center bg-[#0071e3] hover:bg-[#0077ed] text-white px-5 py-2.5 rounded-full text-[13px] font-semibold transition-transform active:scale-95 shadow-sm">
                                        <Icons.PlusCircle size={16} /> <span className="ml-1.5">儲存並建立工單</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </header>

                    <main className={`flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1400px] mx-auto w-full ${isMobile ? 'p-0 pb-[70px]' : 'p-4 lg:p-6 gap-4 lg:gap-6'}`}>
                        
                        {/* 左側：正面網格互動圖 */}
                        {(!isMobile || mobileActiveTab === 'grid') && (
                        <section className={`flex-1 flex flex-col bg-white ${isMobile ? 'rounded-none border-0' : 'rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100'} overflow-hidden relative`}>
                            <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white/50 backdrop-blur-md z-10">
                                <div className="flex items-center gap-4 shrink-0">
                                    <h2 className="text-[14px] md:text-[15px] font-semibold flex items-center gap-2 text-[#1d1d1f]" onDoubleClick={() => setIsDevMode(!isDevMode)} title="Double click to toggle Dev Mode">
                                        <Icons.Camera size={18} className="text-[#0071e3]"/> 網格佈局檢視
                                    </h2>
                                    <div className="flex bg-[#f5f5f7] p-1 rounded-full shrink-0">
                                        <button onClick={() => setCurrentView('left')} className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${currentView === 'left' ? 'bg-white shadow-sm text-[#1d1d1f]' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}>左前視角</button>
                                        <button onClick={() => setCurrentView('right')} className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${currentView === 'right' ? 'bg-white shadow-sm text-[#1d1d1f]' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}>右前視角</button>
                                        <button onClick={() => setCurrentView('2d')} className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${currentView === '2d' ? 'bg-white shadow-sm text-[#1d1d1f]' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}>2D</button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between w-full md:w-auto gap-2 md:gap-4">
                                    <button onClick={() => {
                                        if (dotFilter === 'all') setDotFilter('ng_only');
                                        else if (dotFilter === 'ng_only') setDotFilter('none');
                                        else setDotFilter('all');
                                    }} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${dotFilter === 'none' ? 'bg-[#ff3b30]/10 text-[#ff3b30]' : (dotFilter === 'ng_only' ? 'bg-[#ff9500]/10 text-[#ff9500]' : 'bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]')}`}>
                                        <Icons.Eye size={14} /> 
                                        <span className="hidden sm:inline">
                                            {dotFilter === 'all' ? '顯示全部圓點' : (dotFilter === 'ng_only' ? '僅顯示異常圓點' : '隱藏全部圓點')}
                                        </span>
                                        <span className="sm:hidden">
                                            {dotFilter === 'all' ? '全顯示' : (dotFilter === 'ng_only' ? '僅異常' : '全隱藏')}
                                        </span>
                                    </button>
                                    {currentView === '2d' && (
                                        <button onClick={handleResetView} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f] transition-colors">
                                            🔍 <span className="hidden sm:inline">預設視角</span>
                                        </button>
                                    )}
                                    {currentView === '2d' && (
                                        <button onClick={() => setShowHeatmap(!showHeatmap)} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${showHeatmap ? 'bg-[#ff3b30]/10 text-[#ff3b30]' : 'bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]'}`}>
                                            <Icons.Layers size={14} /> <span className="hidden sm:inline">{showHeatmap ? '關閉熱區圖' : '切換熱區圖'}</span><span className="sm:hidden">熱區圖</span>
                                        </button>
                                    )}
                                    {!showHeatmap && (
                                        <div className="flex gap-2.5 text-[11px] md:text-[12px] font-medium text-[#86868b] flex-nowrap shrink-0 overflow-x-auto no-scrollbar items-center ml-auto">
                                            <span className="flex items-center gap-1 whitespace-nowrap shrink-0"><span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-[#34c759]"></span>合格</span>
                                            <span className="flex items-center gap-1 whitespace-nowrap shrink-0"><span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-[#ff9500]"></span>注意</span>
                                            <span className="flex items-center gap-1 whitespace-nowrap shrink-0"><span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-[#ff3b30]"></span>超差</span>
                                            <span className="flex items-center gap-1 whitespace-nowrap shrink-0"><span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-[#af52de]"></span>問題</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`flex-1 relative flex items-center justify-center bg-[#fbfbfd] min-h-0 overflow-hidden ${!isMobile || !isBottomSheetOpen || !selectedPart ? 'p-8' : (sheetState === 'collapsed' ? 'p-2 pb-[160px]' : 'p-2 pb-[55dvh]')}`} onClick={handleBackgroundClick}>
                                    <GridSvgViewer 
                                        ref={gridSvgRef}
                                        selectedPart={selectedPart}
                                        currentPart2={currentPart2}
                                        showHeatmap={showHeatmap}
                                        dotFilter={dotFilter}
                                        measurements={measurements}
                                        issues={issues}
                                        inputMode={inputMode}
                                        currentExactPos={currentExactPos}
                                        isDragging={isDragging}
                                        setIsDragging={setIsDragging}
                                        dragFlag={dragFlag}
                                        formData={formData}
                                        setFormData={setFormData}
                                        issueFormData={issueFormData}
                                        setIssueFormData={setIssueFormData}
                                        handlePartClick={handlePartClick}
                                        handleBackgroundClick={handleBackgroundClick}
                                        handleEditRecord={handleEditRecord}
                                        handleDotMouseDown={handleDotMouseDown}
                                        handleDotTouchStart={handleDotTouchStart}
                                        getHeatmapColor={getHeatmapColor}
                                        getDotColor={getDotColor}
                                        currentPaths={currentPaths}
                                        currentView={currentView}
                                        isDevMode={isDevMode}
                                        setDevCoordinates={setDevCoordinates}
                                    />

                                    {isDevMode && (
                                        <div className="absolute bottom-4 left-4 z-50 bg-white/90 p-4 rounded-xl shadow-lg border border-gray-200">
                                            <h3 className="font-bold text-sm mb-2 text-purple-600">DevMode: SVG 座標產生器</h3>
                                            <div className="text-xs font-mono max-h-32 overflow-y-auto mb-2 bg-gray-100 p-2 rounded">
                                                {devCoordinates.length === 0 ? "在圖上點擊以產生座標..." : devCoordinates.map((c, i) => (
                                                    <div key={i}>{c.x},{c.y}</div>
                                                ))}
                                            </div>
                                            <div className="text-xs break-all text-blue-600 mb-2 font-mono bg-blue-50 p-2 rounded">
                                                M {devCoordinates.map(c => `${c.x},${c.y}`).join(' L ')}{devCoordinates.length > 0 ? ' Z' : ''}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setDevCoordinates([])} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200">清除重來</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-sm border border-gray-200 text-[12px] sm:text-[13px] font-medium text-[#1d1d1f] flex flex-col gap-1.5 pointer-events-none z-10 transition-all">
                                        <span className="flex items-center gap-1.5 text-[#0071e3] font-semibold text-[11px] sm:text-[12px] uppercase tracking-wider"><Icons.Info size={14}/> 操作提示</span>
                                        {!selectedPart ? (
                                            <span className="flex items-center gap-1.5"><span className="animate-bounce">👆</span> 請點擊網格部位開始作業</span>
                                        ) : (currentExactPos && !isDragging) ? (
                                            <span className="flex items-center gap-1.5"><Icons.MapPin size={15} className="shrink-0 text-[#af52de]" /> 按住部位上的圓點可拖曳定位</span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-[#86868b]"><Icons.CheckCircle size={15} className="shrink-0" /> 已選擇部位</span>
                                        )}
                                    </div>
                            </div>
                        </section>
                        )}

                        {/* 右側：操作面板 */}
                        {(!isMobile || mobileActiveTab !== 'grid') && (
                        <SidebarForm 
                            isMobile={isMobile}
                            mobileActiveTab={mobileActiveTab}
                            isBottomSheetOpen={isBottomSheetOpen}
                            selectedPart={selectedPart}
                            sheetState={sheetState}
                            setSheetState={setSheetState}
                            measurements={measurements}
                            issues={issues}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            inputMode={inputMode}
                            handleInputModeSwitch={handleInputModeSwitch}
                            fileInputRef={fileInputRef}
                            handleFileChange={handleFileChange}
                            formData={formData}
                            setFormData={setFormData}
                            issueFormData={issueFormData}
                            setIssueFormData={setIssueFormData}
                            handlePart2Change={handlePart2Change}
                            customStd={customStd}
                            handleStdChange={handleStdChange}
                            isUploading={isUploading}
                            tempPhotoUrl={tempPhotoUrl}
                            setTempPhotoUrl={setTempPhotoUrl}
                            setViewingPhoto={setViewingPhoto}
                            setAnnotatingPhoto={setAnnotatingPhoto}
                            handleSaveMeasurement={handleSaveMeasurement}
                            handleSaveIssue={handleSaveIssue}
                            historyDate={historyDate}
                            setHistoryDate={setHistoryDate}
                            currentModel={currentModel}
                            workOrders={workOrders}
                            calcYield={calcYield}
                            expandedStatsGroups={expandedStatsGroups}
                            toggleStatsGroup={toggleStatsGroup}
                            previewRecordId={previewRecordId}
                            handleListRecordClick={handleListRecordClick}
                            handleDeleteRecord={handleDeleteRecord}
                            handleExportPDF={handleExportPDF}
                            handleEditWO={handleEditWO}
                            handleLoadWO={handleLoadWO}
                            handleExportCSV={handleExportCSV}
                            handleDeleteWO={handleDeleteWO}
                            hasMoreWOs={hasMoreWOs}
                            loadMoreWOs={loadMoreWOs}
                            getStatusColor={getStatusColor}
                            sheetTouchStartY={sheetTouchStartY}
                            showSwipeHint={showSwipeHint}
                            setIsBottomSheetOpen={setIsBottomSheetOpen}
                            contacts={contacts}
                        />

                        )}
                    </main>

                    {/* Bottom Navigation (Mobile) */}
                    {isMobile && (
                        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 pb-safe z-[60] flex justify-around shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                            {[
                                { id: 'grid', icon: Icons.Grid, label: '網格' },
                                { id: 'list', icon: Icons.List, label: '清單' },
                                { id: 'stats', icon: Icons.BarChart3, label: '統計' },
                                { id: 'history', icon: Icons.History, label: '歷史' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setMobileActiveTab(tab.id)}
                                    className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${mobileActiveTab === tab.id ? 'text-[#0071e3]' : 'text-[#86868b]'}`}
                                >
                                    <tab.icon size={20} />
                                    <span className="text-[10px] font-semibold">{tab.label}</span>
                                </button>
                            ))}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${isMobileMenuOpen ? 'text-[#0071e3]' : 'text-[#86868b]'}`}
                            >
                                <Icons.Menu size={20} />
                                <span className="text-[10px] font-semibold">選單</span>
                            </button>
                        </nav>
                    )}

                    {/* Mobile Menu Modal */}
                    {isMobileMenuOpen && isMobile && (
                        <div className="fixed inset-0 z-[100] flex animate-fade-in">
                            <div className="absolute inset-0 bg-[#1d1d1f]/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
                            <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col animate-[slide-in-right_0.3s_ease-out]">
                                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#fbfbfd]">
                                    <h2 className="text-lg font-semibold text-[#1d1d1f]">系統選單</h2>
                                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-[#e8e8ed] text-[#1d1d1f] rounded-full">
                                        <Icons.X size={20} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    <button onClick={() => { setIsMobileMenuOpen(false); setShowContactsModal(true); }} className="w-full flex items-center gap-3 p-4 bg-[#f5f5f7] rounded-2xl text-left text-[15px] font-semibold text-[#1d1d1f] active:bg-[#e8e8ed]">
                                        <Icons.Users size={20} className="text-[#0071e3]" /> 聯絡人管理
                                    </button>
                                    <button onClick={() => { setIsMobileMenuOpen(false); setShowLogsModal(true); }} className="w-full flex items-center gap-3 p-4 bg-[#f5f5f7] rounded-2xl text-left text-[15px] font-semibold text-[#1d1d1f] active:bg-[#e8e8ed]">
                                        <Icons.FileText size={20} className="text-[#0071e3]" /> 系統履歷
                                    </button>
                                </div>
                                <div className="p-5 border-t border-gray-100 bg-[#fbfbfd]">
                                    <button onClick={() => { setIsMobileMenuOpen(false); handleCreateWO(); }} className="w-full flex items-center justify-center gap-2 bg-[#0071e3] text-white p-4 rounded-2xl text-[16px] font-semibold active:bg-[#0077ed]">
                                        <Icons.PlusCircle size={20} /> 儲存並建立工單
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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

                    {toastMsg && (
                        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-[#1d1d1f]/90 backdrop-blur-md text-white px-6 py-3.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.2)] z-50 animate-slide-up flex items-center gap-3 max-w-[90%] pointer-events-none">
                            {toastMsg.type === 'success' ? (
                                <Icons.CheckCircle size={20} className="text-[#34c759] flex-shrink-0" />
                            ) : toastMsg.type === 'error' ? (
                                <Icons.AlertTriangle size={20} className="text-[#ff3b30] flex-shrink-0" />
                            ) : toastMsg.type === 'info' ? (
                                <Icons.Info size={20} className="text-[#0a84ff] flex-shrink-0" />
                            ) : (
                                <Icons.AlertTriangle size={20} className="text-[#ff9500] flex-shrink-0" />
                            )}
                            <span className="text-[14px] font-medium leading-relaxed">{toastMsg.text}</span>
                        </div>
                    )}
                    {/* 隱藏的 PDF 報表模板 (供 html2pdf 使用) */}
                    {ReactDOM.createPortal(
                        <div id="pdf-report-template" style={{ display: 'none', position: 'absolute', backgroundColor: 'white', padding: '40px', width: '1120px', boxSizing: 'border-box', fontFamily: 'sans-serif' }}>
                            <div style={{ borderBottom: '2px solid #1d1d1f', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '32px', color: '#1d1d1f', fontWeight: 'bold' }}>{currentModel.name} - 建付分析報告</h1>
                                    <p style={{ margin: '10px 0 0 0', color: '#86868b', fontSize: '14px' }}>工單號碼：{currentWOId}</p>
                                </div>
                                <div style={{ textAlign: 'right', color: '#86868b', fontSize: '14px' }}>
                                    報告產出日期：{new Date().toLocaleDateString('zh-TW')}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                                <div style={{ flex: 1, backgroundColor: '#f5f5f7', padding: '20px', borderRadius: '12px' }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#86868b' }}>總量測數據</h3>
                                    <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1d1d1f' }}>{measurements.length}</p>
                                </div>
                                <div style={{ flex: 1, backgroundColor: '#f5f5f7', padding: '20px', borderRadius: '12px' }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#86868b' }}>總問題點</h3>
                                    <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1d1d1f' }}>{issues.length}</p>
                                </div>
                            </div>

                            {issues.length > 0 && (
                                <div style={{ marginBottom: '40px' }}>
                                    <h2 style={{ fontSize: '20px', color: '#1d1d1f', borderLeft: '4px solid #af52de', paddingLeft: '10px', marginBottom: '20px' }}>問題點清單</h2>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f5f5f7', textAlign: 'left' }}>
                                                <th style={{ padding: '10px', borderBottom: '1px solid #d2d2d7', width: '25%' }}>部位</th>
                                                <th style={{ padding: '10px', borderBottom: '1px solid #d2d2d7', width: '15%' }}>分類</th>
                                                <th style={{ padding: '10px', borderBottom: '1px solid #d2d2d7', width: '25%' }}>問題描述</th>
                                                <th style={{ padding: '10px', borderBottom: '1px solid #d2d2d7', width: '25%' }}>對策</th>
                                                <th style={{ padding: '10px', borderBottom: '1px solid #d2d2d7', width: '10%' }}>照片</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {issues.map(issue => (
                                                <tr key={issue.id}>
                                                    <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{PART_NAME_MAP[issue.part1]} - {PART_NAME_MAP[issue.part2]}</td>
                                                    <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{issue.category}</td>
                                                    <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{issue.description || '-'}</td>
                                                    <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{issue.countermeasure || '-'}</td>
                                                    <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
                                                        {issue.photoUrl ? <img src={issue.photoUrl} alt="photo" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} /> : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {measurements.length > 0 && (
                                <div>
                                    <h2 style={{ fontSize: '20px', color: '#1d1d1f', borderLeft: '4px solid #0071e3', paddingLeft: '10px', marginBottom: '20px' }}>量測數據清單</h2>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f5f5f7', textAlign: 'left' }}>
                                                <th style={{ padding: '10px', borderBottom: '1px solid #d2d2d7', width: '40%' }}>部位</th>
                                                <th style={{ padding: '10px', borderBottom: '1px solid #d2d2d7', width: '25%' }}>段差 (Gap)</th>
                                                <th style={{ padding: '10px', borderBottom: '1px solid #d2d2d7', width: '25%' }}>間隙 (Flush)</th>
                                                <th style={{ padding: '10px', borderBottom: '1px solid #d2d2d7', width: '10%' }}>照片</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {measurements.map(m => (
                                                <tr key={m.id}>
                                                    <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{PART_NAME_MAP[m.part1]} - {PART_NAME_MAP[m.part2]}</td>
                                                    <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0', color: m.gapStatus === 'NG' ? '#ff3b30' : m.gapStatus === 'WARN' ? '#ff9500' : '#1d1d1f' }}>
                                                        {m.gap} {m.gapStatus !== 'OK' ? `(${m.gapStatus})` : ''}
                                                    </td>
                                                    <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0', color: m.flushStatus === 'NG' ? '#ff3b30' : m.flushStatus === 'WARN' ? '#ff9500' : '#1d1d1f' }}>
                                                        {m.flush} {m.flushStatus !== 'OK' ? `(${m.flushStatus})` : ''}
                                                    </td>
                                                    <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
                                                        {m.photoUrl ? <img src={m.photoUrl} alt="photo" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} /> : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>,
                        document.body
                    )}
                </div>
            );
        }

        // ==========================================
        // 5. 子組件：照片標註 Modal
        // ==========================================
        