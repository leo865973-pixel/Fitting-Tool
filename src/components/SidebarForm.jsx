import React from 'react';
import { Icons } from './Icons';
import { PART_NAME_MAP, ISSUE_CATEGORIES, PARTS_HIERARCHY, ADJACENT_MAP } from '../utils/constants';
import { getStatus } from '../utils/geometry';

export const SidebarForm = ({ 
    isMobile, mobileActiveTab, isBottomSheetOpen, selectedPart, sheetState, setSheetState,
    measurements, issues, activeTab, setActiveTab, inputMode, handleInputModeSwitch,
    fileInputRef, handleFileChange, formData, setFormData, issueFormData, setIssueFormData,
    handlePart2Change, customStd, handleStdChange, isUploading, tempPhotoUrl, setTempPhotoUrl, setViewingPhoto,
    setAnnotatingPhoto, handleSaveMeasurement, handleSaveIssue,
    historyDate, setHistoryDate, currentModel, workOrders, calcYield, expandedStatsGroups, toggleStatsGroup,
    previewRecordId, handleListRecordClick, handleDeleteRecord, handleExportPDF, handleEditWO, handleLoadWO,
    handleExportCSV, handleDeleteWO, hasMoreWOs, loadMoreWOs, getStatusColor, sheetTouchStartY, showSwipeHint, setIsBottomSheetOpen, contacts
}) => {
    return (
                        <aside 
                            className={`w-full lg:w-[420px] shrink-0 bg-white border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${isMobile ? (mobileActiveTab === 'grid' ? `fixed inset-x-0 z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] ${sheetState === 'expanded' ? 'h-[85dvh]' : (sheetState === 'collapsed' ? 'h-[76px]' : 'h-[55dvh]')} animate-[slide-up_0.3s_ease-out]` : 'flex-1 rounded-none border-0 bg-[#fbfbfd]') : 'rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)]'}`} 
                            style={isMobile && mobileActiveTab === 'grid' ? { bottom: 'calc(63px + env(safe-area-inset-bottom))' } : {}}
                            onClick={(e) => e.stopPropagation()}
                        >
                            
                            {!isMobile && (
                            <div className="p-3 md:p-4 border-b border-gray-100 bg-[#fbfbfd]">
                                <div className="bg-[#e8e8ed] p-1 rounded-xl flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                                    {[
                                        { id: 'measure', icon: Icons.PenTool, label: '輸入' },
                                        { id: 'list', icon: Icons.List, label: `清單 (${measurements.length + issues.length})` },
                                        { id: 'history', icon: Icons.History, label: '歷史' },
                                        { id: 'stats', icon: Icons.BarChart3, label: '統計' }
                                    ].map(tab => (
                                        <button 
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)} 
                                            className={`flex-1 min-w-[70px] flex justify-center items-center py-1.5 px-2 text-[12px] md:text-[13px] font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
                                        >
                                            <tab.icon size={14} className="mr-1 md:mr-1.5 shrink-0" /> {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            )}
                            {isMobile && mobileActiveTab === 'grid' && selectedPart && (
                                <div 
                                    className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-10 cursor-ns-resize relative transition-all"
                                    style={{ touchAction: 'none' }}
                                    onTouchStart={(e) => sheetTouchStartY.current = e.touches[0].clientY}
                                    onTouchEnd={(e) => {
                                        const touchY = e.changedTouches[0].clientY;
                                        const diff = sheetTouchStartY.current - touchY;
                                        if (diff > 40) {
                                            if (sheetState === 'collapsed') setSheetState('half');
                                            else if (sheetState === 'half') setSheetState('expanded');
                                        } else if (diff < -40) {
                                            if (sheetState === 'expanded') setSheetState('half');
                                            else if (sheetState === 'half') setSheetState('collapsed');
                                        }
                                    }}
                                >
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full"></div>
                                    {showSwipeHint && sheetState === 'half' && (
                                        <div className="absolute top-[-36px] left-1/2 -translate-x-1/2 bg-[#0071e3] text-white text-[12px] px-3 py-1.5 rounded-full animate-bounce shadow-md whitespace-nowrap z-20 flex items-center gap-1">
                                            <Icons.ChevronUp size={14} /> 往上滑動展開表單
                                        </div>
                                    )}
                                    <h3 className="font-semibold text-[17px] text-[#1d1d1f] mt-2">{PART_NAME_MAP[selectedPart]}</h3>
                                    <button onClick={() => { setIsBottomSheetOpen(false); setSheetState('half'); }} className="p-2 bg-[#f5f5f7] rounded-full mt-2"><Icons.X size={18}/></button>
                                </div>
                            )}

                            <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-4 pb-10' : 'p-6'} scroll-smooth`}>
                                {(isMobile ? mobileActiveTab === 'grid' : activeTab === 'measure') && (
                                    <div className="space-y-6">
                                        {!selectedPart ? (
                                            <div className="h-full flex flex-col items-center justify-center text-[#86868b] py-20">
                                                <Icons.CheckCircle size={48} className="mb-4 opacity-30" />
                                                <p className="text-[14px] font-medium">尚未選擇部位</p>
                                            </div>
                                        ) : (
                                            <div className="animate-fade-in">
                                                {!isMobile && (
                                                <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-5 tracking-tight">
                                                    {PART_NAME_MAP[selectedPart]}
                                                </h3>
                                                )}
                                                
                                                <div className="flex bg-[#e8e8ed] p-1 rounded-xl mb-6">
                                                    <button onClick={() => handleInputModeSwitch('measure')} className={`flex-1 py-1.5 text-[13px] font-semibold rounded-lg transition-all ${inputMode === 'measure' ? 'bg-white text-[#0071e3] shadow-sm' : 'text-[#86868b]'}`}>量測數據</button>
                                                    <button onClick={() => handleInputModeSwitch('issue')} className={`flex-1 py-1.5 text-[13px] font-semibold rounded-lg transition-all ${inputMode === 'issue' ? 'bg-white text-[#af52de] shadow-sm' : 'text-[#86868b]'}`}>問題點記錄</button>
                                                </div>

                                                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

                                                {inputMode === 'measure' && (
                                                    <div className="space-y-5 animate-fade-in">
                                                        {selectedPart === 'custom_point' ? (
                                                            <div className="flex gap-3">
                                                                <div className="flex-1">
                                                                    <label className="block text-[13px] font-medium text-[#86868b] mb-2">部位一 (選填)</label>
                                                                    <select className="w-full bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/20 rounded-xl p-3 text-[14px] font-medium transition-all outline-none" value={formData.customPart1} onChange={(e) => setFormData({...formData, customPart1: e.target.value})}>
                                                                        <option value="">-- 自訂 --</option>
                                                                        {PARTS_HIERARCHY.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <label className="block text-[13px] font-medium text-[#86868b] mb-2">部位二 (選填)</label>
                                                                    <select className="w-full bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/20 rounded-xl p-3 text-[14px] font-medium transition-all outline-none" value={formData.customPart2} onChange={(e) => setFormData({...formData, customPart2: e.target.value})}>
                                                                        <option value="">-- 自訂 --</option>
                                                                        {PARTS_HIERARCHY.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <label className="block text-[13px] font-medium text-[#86868b] mb-2">選擇鄰接件 (可直接點擊圖面)</label>
                                                                <select className="w-full bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/20 rounded-xl p-3 text-[14px] font-medium transition-all outline-none" value={formData.part2} onChange={(e) => handlePart2Change(e, 'measure')}>
                                                                    <option value="">-- 請選擇 --</option>
                                                                    {ADJACENT_MAP[selectedPart]?.map(adjId => <option key={adjId} value={adjId}>{PART_NAME_MAP[adjId]}</option>)}
                                                                </select>
                                                            </div>
                                                        )}

                                                        {(formData.part2 || selectedPart === 'custom_point') && (
                                                            <>
                                                                <div className="bg-[#f5f5f7] p-4 rounded-2xl border border-gray-100">
                                                                    <div className="flex justify-between items-center mb-3">
                                                                        <span className="text-[14px] font-semibold text-[#1d1d1f]">間隙 (Gap)</span>
                                                                        <div className="flex items-center gap-1 text-[12px] text-[#86868b]">
                                                                            標準: 
                                                                            <input type="number" step="0.1" className="w-10 bg-white border border-gray-200 rounded px-1 text-center outline-none focus:border-[#0071e3]" value={customStd.gap} onChange={e => handleStdChange('gap', parseFloat(e.target.value) || 0)} />
                                                                            ± 
                                                                            <input type="number" step="0.1" className="w-10 bg-white border border-gray-200 rounded px-1 text-center outline-none focus:border-[#0071e3]" value={customStd.tolGap} onChange={e => handleStdChange('tolGap', parseFloat(e.target.value) || 0)} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <input type="number" step="0.1" min="0" className="flex-1 bg-white border border-gray-200 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/20 rounded-xl p-2.5 text-[16px] text-center font-mono outline-none transition-all" placeholder="實測 mm" value={formData.gap} onChange={(e) => setFormData({...formData, gap: e.target.value})} />
                                                                        {formData.gap && <span className={`px-3 py-1.5 rounded-lg text-[13px] font-bold ${getStatusColor(getStatus(parseFloat(formData.gap), customStd.gap, customStd.tolGap))}`}>{getStatus(parseFloat(formData.gap), customStd.gap, customStd.tolGap)}</span>}
                                                                    </div>
                                                                </div>

                                                                <div className="bg-[#f5f5f7] p-4 rounded-2xl border border-gray-100">
                                                                    <div className="flex justify-between items-center mb-3">
                                                                        <span className="text-[14px] font-semibold text-[#1d1d1f]">段差 (Flush)</span>
                                                                        <div className="flex items-center gap-1 text-[12px] text-[#86868b]">
                                                                            標準: 
                                                                            <input type="number" step="0.1" className="w-10 bg-white border border-gray-200 rounded px-1 text-center outline-none focus:border-[#0071e3]" value={customStd.flush} onChange={e => handleStdChange('flush', parseFloat(e.target.value) || 0)} />
                                                                            ± 
                                                                            <input type="number" step="0.1" className="w-10 bg-white border border-gray-200 rounded px-1 text-center outline-none focus:border-[#0071e3]" value={customStd.tolFlush} onChange={e => handleStdChange('tolFlush', parseFloat(e.target.value) || 0)} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <input type="number" step="0.1" className="flex-1 bg-white border border-gray-200 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/20 rounded-xl p-2.5 text-[16px] text-center font-mono outline-none transition-all" placeholder="實測 mm" value={formData.flush} onChange={(e) => setFormData({...formData, flush: e.target.value})} />
                                                                        {formData.flush && <span className={`px-3 py-1.5 rounded-lg text-[13px] font-bold ${getStatusColor(getStatus(parseFloat(formData.flush), customStd.flush, customStd.tolFlush))}`}>{getStatus(parseFloat(formData.flush), customStd.flush, customStd.tolFlush)}</span>}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <button onClick={() => fileInputRef.current.click()} disabled={isUploading} className="w-full flex items-center justify-center gap-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#0071e3] rounded-xl p-3 text-[14px] font-semibold transition-colors disabled:opacity-50">
                                                                        <Icons.Camera size={18} /> {isUploading ? '照片上傳中...' : (tempPhotoUrl ? '重新拍攝/選擇照片' : '拍攝/上傳現場照片')}
                                                                    </button>
                                                                    {tempPhotoUrl && (
                                                                        <div className="relative mt-3 group">
                                                                            <img src={tempPhotoUrl} alt="Preview" onClick={() => setViewingPhoto(tempPhotoUrl)} className="h-32 w-full object-cover rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity" />
                                                                            <button onClick={(e) => { e.stopPropagation(); setTempPhotoUrl(null); }} className="absolute top-2 right-2 bg-[#ff3b30]/90 backdrop-blur-md text-white p-1.5 rounded-full hover:bg-[#ff3b30] transition-colors shadow-sm opacity-0 group-hover:opacity-100">
                                                                                <Icons.X size={16} />
                                                                            </button>
                                                                            <button onClick={() => setAnnotatingPhoto({ url: tempPhotoUrl, onSave: setTempPhotoUrl, getImgBBKeyAsync })} className="absolute bottom-2 right-2 bg-[#1d1d1f]/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#1d1d1f] transition-colors shadow-sm">
                                                                                <Icons.Brush size={14} /> 標註照片
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <button onClick={handleSaveMeasurement} className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold py-3.5 rounded-full shadow-sm transition-transform active:scale-95 text-[15px]">
                                                                    儲存紀錄
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {inputMode === 'issue' && (
                                                    <div className="space-y-5 animate-fade-in">
                                                        {selectedPart === 'custom_point' ? (
                                                            <div className="flex gap-3">
                                                                <div className="flex-1">
                                                                    <label className="block text-[13px] font-medium text-[#86868b] mb-2">部位一 (選填)</label>
                                                                    <select className="w-full bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#af52de] focus:ring-4 focus:ring-[#af52de]/20 rounded-xl p-3 text-[14px] font-medium transition-all outline-none" value={issueFormData.customPart1} onChange={(e) => setIssueFormData({...issueFormData, customPart1: e.target.value})}>
                                                                        <option value="">-- 自訂 --</option>
                                                                        {PARTS_HIERARCHY.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <label className="block text-[13px] font-medium text-[#86868b] mb-2">部位二 (選填)</label>
                                                                    <select className="w-full bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#af52de] focus:ring-4 focus:ring-[#af52de]/20 rounded-xl p-3 text-[14px] font-medium transition-all outline-none" value={issueFormData.customPart2} onChange={(e) => setIssueFormData({...issueFormData, customPart2: e.target.value})}>
                                                                        <option value="">-- 自訂 --</option>
                                                                        {PARTS_HIERARCHY.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <label className="block text-[13px] font-medium text-[#86868b] mb-2">相對應部位 (可直接點擊圖面)</label>
                                                                <select className="w-full bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#af52de] focus:ring-4 focus:ring-[#af52de]/20 rounded-xl p-3 text-[14px] font-medium transition-all outline-none" value={issueFormData.part2} onChange={(e) => handlePart2Change(e, 'issue')}>
                                                                    <option value="">-- 請選擇 --</option>
                                                                    {ADJACENT_MAP[selectedPart]?.map(adjId => <option key={adjId} value={adjId}>{PART_NAME_MAP[adjId]}</option>)}
                                                                </select>
                                                            </div>
                                                        )}

                                                        {(issueFormData.part2 || selectedPart === 'custom_point') && (
                                                            <>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-[13px] font-medium text-[#86868b] mb-2">發現日期</label>
                                                                        <input type="date" className="w-full h-[44px] bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#af52de] focus:ring-4 focus:ring-[#af52de]/20 rounded-xl px-3 text-[14px] outline-none transition-all" value={issueFormData.foundDate} onChange={(e) => setIssueFormData({...issueFormData, foundDate: e.target.value})} />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[13px] font-medium text-[#86868b] mb-2">問題類別</label>
                                                                        <select className="w-full h-[44px] bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#af52de] focus:ring-4 focus:ring-[#af52de]/20 rounded-xl px-3 text-[14px] outline-none transition-all" value={issueFormData.category} onChange={(e) => setIssueFormData({...issueFormData, category: e.target.value})}>
                                                                            {ISSUE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-[13px] font-medium text-[#86868b] mb-2">問題描述 <span className="text-[#ff3b30]">*</span></label>
                                                                    <textarea className="w-full bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#af52de] focus:ring-4 focus:ring-[#af52de]/20 rounded-xl p-3 text-[14px] outline-none transition-all resize-none" rows="2" placeholder="詳細描述..." value={issueFormData.description} onChange={(e) => setIssueFormData({...issueFormData, description: e.target.value})}></textarea>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-[13px] font-medium text-[#86868b] mb-2">對策說明</label>
                                                                    <textarea className="w-full bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#af52de] focus:ring-4 focus:ring-[#af52de]/20 rounded-xl p-3 text-[14px] outline-none transition-all resize-none" rows="2" placeholder="暫定或永久對策..." value={issueFormData.countermeasure} onChange={(e) => setIssueFormData({...issueFormData, countermeasure: e.target.value})}></textarea>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-[13px] font-medium text-[#86868b] mb-2">設計承辦</label>
                                                                        <select className="w-full h-[44px] bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#af52de] focus:ring-4 focus:ring-[#af52de]/20 rounded-xl px-3 text-[14px] outline-none transition-all" value={issueFormData.designPic} onChange={(e) => setIssueFormData({...issueFormData, designPic: e.target.value})}>
                                                                            <option value="">-- 選擇承辦人 --</option>
                                                                            {contacts.map(c => <option key={c.id} value={c.name}>{c.name} ({c.dept})</option>)}
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[13px] font-medium text-[#86868b] mb-2">開發承辦</label>
                                                                        <select className="w-full h-[44px] bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#af52de] focus:ring-4 focus:ring-[#af52de]/20 rounded-xl px-3 text-[14px] outline-none transition-all" value={issueFormData.devPic} onChange={(e) => setIssueFormData({...issueFormData, devPic: e.target.value})}>
                                                                            <option value="">-- 選擇承辦人 --</option>
                                                                            {contacts.map(c => <option key={c.id} value={c.name}>{c.name} ({c.dept})</option>)}
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <button onClick={() => fileInputRef.current.click()} disabled={isUploading} className="w-full flex items-center justify-center gap-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#af52de] rounded-xl p-3 text-[14px] font-semibold transition-colors disabled:opacity-50">
                                                                        <Icons.Camera size={18} /> {isUploading ? '照片上傳中...' : (tempPhotoUrl ? '重新拍攝/選擇照片' : '拍攝/上傳現場照片')}
                                                                    </button>
                                                                    {tempPhotoUrl && (
                                                                        <div className="relative mt-3 group">
                                                                            <img src={tempPhotoUrl} alt="Preview" onClick={() => setViewingPhoto(tempPhotoUrl)} className="h-32 w-full object-cover rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity" />
                                                                            <button onClick={(e) => { e.stopPropagation(); setTempPhotoUrl(null); }} className="absolute top-2 right-2 bg-[#ff3b30]/90 backdrop-blur-md text-white p-1.5 rounded-full hover:bg-[#ff3b30] transition-colors shadow-sm opacity-0 group-hover:opacity-100">
                                                                                <Icons.X size={16} />
                                                                            </button>
                                                                            <button onClick={() => setAnnotatingPhoto({ url: tempPhotoUrl, onSave: setTempPhotoUrl, getImgBBKeyAsync })} className="absolute bottom-2 right-2 bg-[#1d1d1f]/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#1d1d1f] transition-colors shadow-sm">
                                                                                <Icons.Brush size={14} /> 標註照片
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <button onClick={handleSaveIssue} disabled={!issueFormData.description} className="w-full bg-[#af52de] hover:bg-[#9d44c9] disabled:bg-[#d2d2d7] text-white font-semibold py-3.5 rounded-full shadow-sm transition-transform active:scale-95 text-[15px]">
                                                                    儲存問題點
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(isMobile ? mobileActiveTab === 'history' : activeTab === 'history') && (() => {
                                    const historyIssues = issues.filter(i => {
                                        if (i.status !== '已解決') return false;
                                        if (!i.foundDate) return false;
                                        const d = new Date(i.foundDate);
                                        return d.getFullYear() === historyDate.getFullYear() && d.getMonth() === historyDate.getMonth();
                                    });
                                    return (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="flex justify-between items-center bg-[#f5f5f7] p-3 rounded-2xl">
                                            <button onClick={() => setHistoryDate(new Date(historyDate.getFullYear(), historyDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-[#e8e8ed] rounded-lg transition-colors"><Icons.ChevronLeft size={16} /></button>
                                            <span className="text-[14px] font-semibold">{historyDate.getFullYear()} 年 {historyDate.getMonth() + 1} 月</span>
                                            <button onClick={() => setHistoryDate(new Date(historyDate.getFullYear(), historyDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-[#e8e8ed] rounded-lg transition-colors"><Icons.ChevronRight size={16} /></button>
                                        </div>
                                        <div className="space-y-4">
                                            {historyIssues.length === 0 ? (
                                                <p className="text-center text-[#86868b] py-10 text-[14px]">無已解決紀錄</p>
                                            ) : (
                                                historyIssues.map(issue => (
                                                    <div key={issue.id} className="relative pl-6 pb-6 border-l-2 border-[#e8e8ed] last:border-0 last:pb-0">
                                                        <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-[#34c759] border-2 border-white ring-2 ring-[#34c759]/20"></div>
                                                        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="font-semibold text-[14px]">{PART_NAME_MAP[issue.part1]}</h4>
                                                                <span className="text-[11px] font-semibold bg-[#34c759]/10 text-[#34c759] px-2 py-1 rounded-md">已解決</span>
                                                            </div>
                                                            <p className="text-[13px] text-[#86868b] line-clamp-2">{issue.description}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    );
                                })()}

                                {(isMobile ? mobileActiveTab === 'stats' : activeTab === 'stats') && (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-5">
                                            <h3 className="font-semibold text-[#1d1d1f] text-[15px] mb-5 flex items-center gap-2">
                                                <Icons.BarChart3 size={18} className="text-[#0071e3]"/> {currentModel.name} 個部位良率統計
                                                <span className="text-[11px] text-[#86868b] font-normal ml-auto">(基於 {workOrders.length} 筆工單)</span>
                                            </h3>
                                            <div className="space-y-4">
                                                {[
                                                    { title: '前檔區域', parts: ['windshield_frame', 'l_ws_frame', 'windshield', 'r_ws_frame'] },
                                                    { title: '雨刷飾蓋', parts: ['l_cover', 'wiper_cover', 'r_cover'] },
                                                    { title: '引擎蓋區', parts: ['l_upper_corner', 'hood', 'r_upper_corner'] },
                                                    { title: '日行燈與標誌', parts: ['l_drl', 'logo_trim', 'r_drl'] },
                                                    { title: '中央飾板與下角', parts: ['l_lower_corner', 'front_center_trim', 'r_lower_corner'] },
                                                    { title: '大燈與霧燈', parts: ['l_headlight', 'r_headlight', 'l_fog_light', 'r_fog_light'] },
                                                    { title: '保桿與側邊', parts: ['l_door', 'r_door', 'l_fender', 'r_fender', 'lower_bumper'] }
                                                ].map(group => {
                                                    const groupParts = group.parts;
                                                    const groupYield = calcYield(groupParts);
                                                    const isExpanded = expandedStatsGroups[group.title];
                                                    return (
                                                        <div key={group.title} className="bg-[#fbfbfd] p-4 rounded-xl border border-gray-100 transition-all">
                                                            <div 
                                                                className="flex justify-between items-center cursor-pointer select-none"
                                                                onClick={() => toggleStatsGroup(group.title)}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-[14px] text-[#1d1d1f]">{group.title}</span>
                                                                    {isExpanded ? <Icons.ChevronUp size={16} className="text-[#86868b]"/> : <Icons.ChevronDown size={16} className="text-[#86868b]"/>}
                                                                </div>
                                                                <span className={`text-[12px] font-semibold px-2 py-1 rounded-lg ${groupYield !== null ? (groupYield >= 90 ? 'bg-[#34c759]/10 text-[#34c759]' : groupYield >= 70 ? 'bg-[#ff9500]/10 text-[#ff9500]' : 'bg-[#ff3b30]/10 text-[#ff3b30]') : 'bg-gray-100 text-[#86868b]'}`}>
                                                                    {groupYield !== null ? `總良率 ${groupYield}%` : '無資料'}
                                                                </span>
                                                            </div>
                                                            {isExpanded && (
                                                                <div className="space-y-2.5 mt-3 pt-3 border-t border-gray-100 animate-fade-in">
                                                                    {groupParts.map(p => {
                                                                        const py = calcYield([p]);
                                                                        return (
                                                                            <div key={p}>
                                                                                <div className="flex justify-between text-[12px] mb-1 font-medium">
                                                                                    <span className="text-[#86868b]">{PART_NAME_MAP[p]}</span> 
                                                                                    <span className={py !== null ? (py >= 90 ? 'text-[#34c759]' : py >= 70 ? 'text-[#ff9500]' : 'text-[#ff3b30]') : 'text-[#d2d2d7]'}>
                                                                                        {py !== null ? `${py}%` : '-'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="w-full bg-[#e8e8ed] rounded-full h-1.5">
                                                                                    <div className={`h-1.5 rounded-full transition-all duration-500 ${py !== null ? (py >= 90 ? 'bg-[#34c759]' : py >= 70 ? 'bg-[#ff9500]' : 'bg-[#ff3b30]') : 'bg-transparent'}`} style={{width: `${py || 0}%`}}></div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(isMobile ? mobileActiveTab === 'list' : activeTab === 'list') && (
                                    <div className="space-y-6 animate-fade-in">
                                        {measurements.length === 0 && issues.length === 0 ? (
                                            <p className="text-center text-[#86868b] py-10 text-[14px]">無紀錄</p>
                                        ) : (
                                            <>
                                                {issues.length > 0 && (
                                                    <div>
                                                        <h3 className="text-[13px] font-bold text-[#86868b] uppercase tracking-wider mb-3 pl-1">問題點 ({issues.length})</h3>
                                                        <div className="space-y-3">
                                                            {issues.map(issue => (
                                                                <div key={issue.id} onClick={() => handleListRecordClick(issue, 'issue')} className={`bg-white border ${previewRecordId === issue.id ? 'border-[#af52de] ring-1 ring-[#af52de]/30' : 'border-gray-100 hover:border-[#af52de]'} rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-4 relative overflow-hidden cursor-pointer transition-all group`}>
                                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#af52de]"></div>
                                                                    <button onClick={(e) => handleDeleteRecord(e, issue.id, 'issue', '問題點')} className="absolute top-3 right-3 p-1.5 text-[#86868b] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10">
                                                                        <Icons.Trash2 size={16} />
                                                                    </button>
                                                                    <div className="flex justify-between items-start mb-2 pl-1 pr-6">
                                                                        <h4 className="font-semibold text-[#1d1d1f] text-[14px]">{PART_NAME_MAP[issue.part1]} ⟷ {PART_NAME_MAP[issue.part2]}</h4>
                                                                        <span className="text-[11px] font-semibold bg-[#af52de]/10 text-[#af52de] px-2 py-1 rounded-md">{issue.category || ISSUE_CATEGORIES[0]}</span>
                                                                    </div>
                                                                    <p className="text-[13px] text-[#1d1d1f] mb-2 pl-1 line-clamp-2">{issue.description}</p>
                                                                    <div className="flex justify-between text-[11px] text-[#86868b] mt-3 border-t border-gray-100 pt-3 pl-1">
                                                                        <span>設計: {issue.designPic || '-'} / 開發: {issue.devPic || '-'}</span>
                                                                        <span>{issue.foundDate}</span>
                                                                    </div>
                                                                    <div className="mt-2 text-[11px] flex items-center justify-between gap-1 pl-1">
                                                                        <div className="flex items-center gap-1.5 text-[#1d1d1f] font-medium bg-[#f5f5f7] px-2 py-0.5 rounded">
                                                                            <Icons.Monitor size={12}/> {(issue.viewMode === 'left' ? '左前視角' : issue.viewMode === 'right' ? '右前視角' : '2D 視角')}
                                                                        </div>
                                                                        {issue.photoUrl && <span className="text-[#af52de] flex items-center gap-1"><Icons.Camera size={14}/> 附有照片</span>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {measurements.length > 0 && (
                                                    <div>
                                                        <h3 className="text-[13px] font-bold text-[#86868b] uppercase tracking-wider mb-3 pl-1 mt-6">量測數據 ({measurements.length})</h3>
                                                        <div className="space-y-3">
                                                            {measurements.map(m => (
                                                                <div key={m.id} onClick={() => handleListRecordClick(m, 'measure')} className={`bg-white border ${previewRecordId === m.id ? 'border-[#0071e3] ring-1 ring-[#0071e3]/30' : 'border-gray-100 hover:border-[#0071e3]'} rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-4 relative overflow-hidden cursor-pointer transition-all group`}>
                                                                    {(m.gapStatus === 'NG' || m.flushStatus === 'NG') && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff3b30]"></div>}
                                                                    <button onClick={(e) => handleDeleteRecord(e, m.id, 'measure', '量測數據')} className="absolute top-3 right-3 p-1.5 text-[#86868b] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10">
                                                                        <Icons.Trash2 size={16} />
                                                                    </button>
                                                                    <h4 className="font-semibold text-[#1d1d1f] text-[14px] mb-3 pl-1 pr-6">{PART_NAME_MAP[m.part1]} ⟷ {PART_NAME_MAP[m.part2]}</h4>
                                                                    <div className="grid grid-cols-2 gap-3 pl-1">
                                                                        <div className="bg-[#f5f5f7] p-2.5 rounded-xl">
                                                                            <span className="text-[#86868b] block text-[11px] font-medium mb-1">間隙 Gap</span>
                                                                            <span className="font-mono font-semibold text-[14px]">{m.gap}</span> 
                                                                            <span className={`ml-2 text-[11px] font-bold ${getStatusColor(m.gapStatus).split(' ')[0]}`}>{m.gapStatus}</span>
                                                                        </div>
                                                                        <div className="bg-[#f5f5f7] p-2.5 rounded-xl">
                                                                            <span className="text-[#86868b] block text-[11px] font-medium mb-1">段差 Flush</span>
                                                                            <span className="font-mono font-semibold text-[14px]">{m.flush}</span>
                                                                            <span className={`ml-2 text-[11px] font-bold ${getStatusColor(m.flushStatus).split(' ')[0]}`}>{m.flushStatus}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-3 text-[11px] flex items-center justify-between gap-1 pl-1">
                                                                        <div className="flex items-center gap-1.5 text-[#1d1d1f] font-medium bg-[#f5f5f7] px-2 py-0.5 rounded">
                                                                            <Icons.Monitor size={12}/> {(m.viewMode === 'left' ? '左前視角' : m.viewMode === 'right' ? '右前視角' : '2D 視角')}
                                                                        </div>
                                                                        {m.photoUrl && <span className="text-[#0071e3] flex items-center gap-1"><Icons.Camera size={14}/> 附有照片</span>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="mt-8 pt-6 border-t border-gray-100 pb-8 flex justify-center">
                                                    <button onClick={handleExportPDF} className="flex items-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white px-6 py-3 rounded-full font-semibold shadow-sm transition-all active:scale-95">
                                                        <Icons.Download size={18} /> 匯出 PDF 報告
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {(isMobile ? mobileActiveTab === 'history' : activeTab === 'history') && (() => {
                                    const filteredWOs = workOrders.filter(wo => {
                                        let d = new Date(wo.date);
                                        if (isNaN(d)) {
                                            const match = wo.date.match(/(\d{4})[^\d](\d{1,2})/);
                                            if (match) {
                                                const [, y, m] = match;
                                                return parseInt(y) === historyDate.getFullYear() && parseInt(m) === (historyDate.getMonth() + 1);
                                            }
                                            return true;
                                        }
                                        return d.getFullYear() === historyDate.getFullYear() && d.getMonth() === historyDate.getMonth();
                                    });
                                    return (
                                    <div className="space-y-4 animate-fade-in">
                                        {filteredWOs.length === 0 ? (
                                            <p className="text-center text-[#86868b] py-10 text-[14px]">無歷史紀錄</p>
                                        ) : (
                                            <>
                                                {filteredWOs.map((wo, i) => (
                                                    <div key={i} className="bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="font-bold text-[#1d1d1f] text-[16px]">{wo.id}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[12px] text-[#86868b] font-medium">{wo.date}</span>
                                                                <button onClick={(e) => handleEditWO(e, wo.id)} className="text-[#86868b] hover:text-[#0071e3] hover:bg-[#0071e3]/10 p-1.5 rounded-lg transition-colors">
                                                                    <Icons.Edit2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 text-[12px] font-semibold mb-4">
                                                            <span className="bg-[#f5f5f7] text-[#1d1d1f] px-3 py-1.5 rounded-lg">量測: {wo.data?.length || 0}</span>
                                                            <span className="bg-[#af52de]/10 text-[#af52de] px-3 py-1.5 rounded-lg">問題: {wo.issueData?.length || 0}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={(e) => { e.stopPropagation(); handleLoadWO(wo); }} className="flex-1 flex justify-center items-center gap-1.5 bg-[#0071e3]/10 hover:bg-[#0071e3] text-[#0071e3] hover:text-white py-2.5 rounded-xl transition-colors font-semibold text-[13px]">
                                                                <Icons.Edit2 size={16} /> 載入編輯
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleExportCSV(wo); }} className="flex-1 flex justify-center items-center gap-1.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] py-2.5 rounded-xl transition-colors font-semibold text-[13px]">
                                                                <Icons.Download size={16} /> 匯出 CSV
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteWO(wo.id); }} className="flex-1 flex justify-center items-center gap-1.5 bg-[#ff3b30]/10 hover:bg-[#ff3b30] text-[#ff3b30] hover:text-white py-2.5 rounded-xl transition-colors font-semibold text-[13px]">
                                                                <Icons.Trash2 size={16} /> 刪除
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {hasMoreWOs && (
                                                    <button onClick={loadMoreWOs} className="w-full py-3.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#0071e3] rounded-xl font-semibold text-[13px] transition-colors shadow-sm">
                                                        載入更多歷史工單...
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    );
                                })()}

                            </div>
                        </aside>
                        )}
    );
};
