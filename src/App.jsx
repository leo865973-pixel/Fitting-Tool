import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './components/Icons';
import { HomePage } from './components/HomePage';
import { Workspace } from './components/Workspace';
import { AnnotationModal } from './components/AnnotationModal';
import { db, ref, push, set, onValue, get, update, remove, query, orderByChild, limitToLast } from './utils/firebase';

        export default function App() {
            const [isDBLoaded, setIsDBLoaded] = useState(false);
            const [globalLoading, setGlobalLoading] = useState(false);
            const [view, setView] = useState('home');
            const [isConnected, setIsConnected] = useState(true);
            
            // 狀態改為由 Firebase 驅動
            const [models, setModelsState] = useState([]);
            const [workOrders, setWorkOrdersState] = useState([]);
            const [logs, setLogsState] = useState([]);
            const [contacts, setContactsState] = useState([]);
            
            // 分頁控制 State
            const [woLimit, setWoLimit] = useState(20);
            const [hasMoreWOs, setHasMoreWOs] = useState(false);

            const [activeModelId, setActiveModelId] = useState(null);
            const activeModel = models.find(m => m.id === activeModelId);

            // 全域 Modal 狀態
            const [dialog, setDialog] = useState({ isOpen: false, type: '', title: '', message: '', defaultValue: '', onConfirm: null });
            const [viewingPhoto, setViewingPhoto] = useState(null);
            const [annotatingPhoto, setAnnotatingPhoto] = useState(null);
            const [showContactsModal, setShowContactsModal] = useState(false);
            const [newContact, setNewContact] = useState({ name: '', dept: '', title: '', ext: '', phone: '', notes: '' });
            const [editingContactId, setEditingContactId] = useState(null);

            // 手機版專屬狀態
            const [isMobile, setIsMobile] = useState(false);
            const [mobileActiveTab, setMobileActiveTab] = useState('grid'); // 'grid', 'list', 'stats'
            const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
            const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

            // 視窗大小監聽 (判斷是否為手機)
            useEffect(() => {
                const checkMobile = () => setIsMobile(window.innerWidth < 1024);
                checkMobile();
                window.addEventListener('resize', checkMobile);
                return () => window.removeEventListener('resize', checkMobile);
            }, []);

            // 啟動時監聽 Firebase 資料 (不包含工單)
            useEffect(() => {
                db.ref('.info/connected').on('value', snap => setIsConnected(snap.val() === true));
                
                db.ref('models').on('value', snap => {
                    if(snap.exists()) setModelsState(snap.val());
                    else {
                        const def = [
                            { id: 'm1', name: 'DH 前圍綜合檢具', updatedAt: new Date().toLocaleString(), std: { gap: 3.0, flush: 0.0, tolGap: 1.0, tolFlush: 1.0 }, partStd: {} },
                            { id: 'm2', name: 'Isuzu Giga', updatedAt: new Date().toLocaleString(), std: { gap: 5.0, flush: 0.0, tolGap: 1.5, tolFlush: 1.0 }, partStd: {} }
                        ];
                        db.ref('models').set(def).catch(e => { console.error('Firebase Set Error:', e); if(typeof setToastMsg === 'function') setToastMsg({type: 'error', text: '資料庫寫入異常，請檢查網路連線'}); });
                    }
                    setIsDBLoaded(true);
                });

                db.ref('logs').on('value', snap => setLogsState(snap.exists() ? snap.val() : []));
                
                db.ref('contacts').on('value', snap => {
                    if(snap.exists()) setContactsState(snap.val());
                    else {
                        const def = [
                            { id: 'c1', name: '王大明', dept: '車體設計課', title: '高級工程師', ext: '3101', phone: '0912-345-678' },
                            { id: 'c2', name: '李小華', dept: '外裝開發課', title: '專案經理', ext: '3205', phone: '0922-111-222' }
                        ];
                        db.ref('contacts').set(def).catch(e => { console.error('Firebase Set Error:', e); if(typeof setToastMsg === 'function') setToastMsg({type: 'error', text: '資料庫寫入異常，請檢查網路連線'}); });
                    }
                });
            }, []);

            // 獨立監聽工單資料 (支援分頁)
            useEffect(() => {
                const woRef = db.ref('workOrders').limitToFirst(woLimit);
                const listener = woRef.on('value', snap => {
                    if (snap.exists()) {
                        const data = snap.val();
                        let parsedData = Array.isArray(data) ? data : Object.values(data);
                        parsedData = parsedData.filter(item => item !== null);
                        setWorkOrdersState(parsedData);
                        setHasMoreWOs(parsedData.length >= woLimit);
                    } else {
                        setWorkOrdersState([]);
                        setHasMoreWOs(false);
                    }
                });
                return () => woRef.off('value', listener);
            }, [woLimit]);

            const loadMoreWOs = () => setWoLimit(prev => prev + 20);

            // 寫入 Firebase 的包裝函數
            const setModels = (newModels) => db.ref('models').set(newModels).catch(e => { console.error('Firebase Set Error:', e); if(typeof setToastMsg === 'function') setToastMsg({type: 'error', text: '資料庫寫入異常，請檢查網路連線'}); });
            
            const addLog = (action, details) => {
                const newLog = { id: Date.now().toString(), time: new Date().toLocaleString(), action, details };
                db.ref('logs').once('value').then(snap => {
                    const currentLogs = snap.exists() ? snap.val() : [];
                    db.ref('logs').set([newLog, ...currentLogs]).catch(e => { console.error('Firebase Set Error:', e); if(typeof setToastMsg === 'function') setToastMsg({type: 'error', text: '資料庫寫入異常，請檢查網路連線'}); });
                });
            };

            const updateModel = (updatedModel) => {
                db.ref('models').once('value').then(snap => {
                    const currentModels = snap.exists() ? snap.val() : [];
                    const newModels = currentModels.map(m => m.id === updatedModel.id ? updatedModel : m);
                    db.ref('models').set(newModels).catch(e => { console.error('Firebase Set Error:', e); if(typeof setToastMsg === 'function') setToastMsg({type: 'error', text: '資料庫寫入異常，請檢查網路連線'}); });
                });
            };

            // 安全的工單寫入邏輯 (避免分頁導致資料覆蓋)
            const createWorkOrder = (newWO) => {
                setWorkOrdersState(prev => {
                    const existingIndex = prev.findIndex(wo => wo.id === newWO.id);
                    if (existingIndex >= 0) {
                        const updated = [...prev];
                        updated[existingIndex] = newWO;
                        return updated;
                    } else {
                        return [newWO, ...prev].slice(0, woLimit);
                    }
                });

                db.ref('workOrders').once('value').then(snap => {
                    const currentWOs = snap.exists() ? snap.val() : [];
                    let parsed = Array.isArray(currentWOs) ? currentWOs : Object.values(currentWOs);
                    parsed = parsed.filter(wo => wo !== null);
                    const existingIndex = parsed.findIndex(wo => wo.id === newWO.id);
                    if (existingIndex >= 0) {
                        parsed[existingIndex] = newWO;
                        db.ref('workOrders').set(parsed).catch(e => { console.error('Firebase Set Error:', e); if(typeof setToastMsg === 'function') setToastMsg({type: 'error', text: '資料庫寫入異常，請檢查網路連線'}); });
                    } else {
                        db.ref('workOrders').set([newWO, ...parsed]).catch(e => { console.error('Firebase Set Error:', e); if(typeof setToastMsg === 'function') setToastMsg({type: 'error', text: '資料庫寫入異常，請檢查網路連線'}); });
                    }
                });
            };

            const editWorkOrder = (id, newId) => {
                setWorkOrdersState(prev => prev.map(wo => wo.id === id ? { ...wo, id: newId.trim() } : wo));
                
                db.ref('workOrders').once('value').then(snap => {
                    if(snap.exists()) {
                        let currentWOs = snap.val();
                        let parsed = Array.isArray(currentWOs) ? currentWOs : Object.values(currentWOs);
                        parsed = parsed.filter(wo => wo !== null);
                        const updatedWOs = parsed.map(wo => wo.id === id ? { ...wo, id: newId.trim() } : wo);
                        db.ref('workOrders').set(updatedWOs).catch(e => { console.error('Firebase Set Error:', e); if(typeof setToastMsg === 'function') setToastMsg({type: 'error', text: '資料庫寫入異常，請檢查網路連線'}); });
                    }
                });
            };

            const deleteWorkOrder = (id) => {
                setWorkOrdersState(prev => prev.filter(wo => wo.id !== id));

                db.ref('workOrders').once('value').then(snap => {
                    if(snap.exists()) {
                        let currentWOs = snap.val();
                        let parsed = Array.isArray(currentWOs) ? currentWOs : Object.values(currentWOs);
                        parsed = parsed.filter(wo => wo !== null);
                        const updatedWOs = parsed.filter(wo => wo.id !== id);
                        db.ref('workOrders').set(updatedWOs).catch(e => { console.error('Firebase Set Error:', e); if(typeof setToastMsg === 'function') setToastMsg({type: 'error', text: '資料庫寫入異常，請檢查網路連線'}); });
                    }
                });
            };

            const handleAddContact = () => {
                if (!newContact.name || !newContact.dept) return;
                
                db.ref('contacts').once('value').then(snap => {
                    const curr = snap.exists() ? snap.val() : [];
                    if (editingContactId) {
                        const updated = curr.map(c => c.id === editingContactId ? { ...newContact, id: editingContactId } : c);
                        db.ref('contacts').set(updated).catch(e => { console.error('Firebase Set Error:', e); if(typeof setToastMsg === 'function') setToastMsg({type: 'error', text: '資料庫寫入異常，請檢查網路連線'}); });
                        addLog('更新聯絡人', `更新了聯絡人：${newContact.name}`);
                    } else {
                        const newC = { id: `c-${Date.now()}`, ...newContact };
                        db.ref('contacts').set([...curr, newC]).catch(e => { console.error('Firebase Set Error:', e); if(typeof setToastMsg === 'function') setToastMsg({type: 'error', text: '資料庫寫入異常，請檢查網路連線'}); });
                        addLog('新增聯絡人', `新增了聯絡人：${newContact.name}`);
                    }
                });
                
                setNewContact({ name: '', dept: '', title: '', ext: '', phone: '', notes: '' });
                setEditingContactId(null);
            };

            const handleEditContact = (contact) => {
                setEditingContactId(contact.id);
                setNewContact(contact);
            };

            const handleCancelEdit = () => {
                setEditingContactId(null);
                setNewContact({ name: '', dept: '', title: '', ext: '', phone: '', notes: '' });
            };

            const handleDeleteContact = (id, name) => {
                openConfirm("刪除聯絡人", `確定要刪除 ${name} 嗎？`, () => {
                    db.ref('contacts').once('value').then(snap => {
                        const curr = snap.exists() ? snap.val() : [];
                        db.ref('contacts').set(curr.filter(c => c.id !== id)).catch(e => { console.error('Firebase Set Error:', e); if(typeof setToastMsg === 'function') setToastMsg({type: 'error', text: '資料庫寫入異常，請檢查網路連線'}); });
                    });
                    addLog('刪除聯絡人', `刪除了聯絡人：${name}`);
                });
            };

            const openConfirm = (title, message, onConfirm) => setDialog({ isOpen: true, type: 'confirm', title, message, defaultValue: '', onConfirm });
            const openPrompt = (title, message, defaultValue, onConfirm) => setDialog({ isOpen: true, type: 'prompt', title, message, defaultValue, onConfirm });
            const closeDialog = () => setDialog({ ...dialog, isOpen: false });

            const handleSelectModel = (model) => {
                setActiveModelId(model.id);
                setView('workspace');
            };

            // 載入畫面
            if (!isDBLoaded) {
                return (
                    <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0071e3] border-t-transparent mb-4"></div>
                        <p className="text-[#86868b] font-medium animate-pulse">連線至 Firebase 雲端資料庫...</p>
                    </div>
                );
            }

            return (
                <div className="min-h-screen bg-[#f5f5f7]">
                    {view === 'home' ? (
                        <HomePage models={models} setModels={setModels} onSelectModel={handleSelectModel} logs={logs} addLog={addLog} openPrompt={openPrompt} openConfirm={openConfirm} setShowContactsModal={setShowContactsModal} isConnected={isConnected} />
                    ) : (
                        <Workspace 
                            currentModel={activeModel} 
                            updateModel={updateModel} 
                            workOrders={workOrders} 
                            createWorkOrder={createWorkOrder}
                            editWorkOrder={editWorkOrder}
                            deleteWorkOrder={deleteWorkOrder}
                            hasMoreWOs={hasMoreWOs}
                            loadMoreWOs={loadMoreWOs}
                            logs={logs} 
                            addLog={addLog} 
                            onBack={() => setView('home')} 
                            openPrompt={openPrompt} 
                            openConfirm={openConfirm} 
                            setViewingPhoto={setViewingPhoto} 
                            setShowContactsModal={setShowContactsModal} 
                            contacts={contacts} 
                            setAnnotatingPhoto={setAnnotatingPhoto} 
                            isMobile={isMobile}
                            mobileActiveTab={mobileActiveTab}
                            setMobileActiveTab={setMobileActiveTab}
                            isBottomSheetOpen={isBottomSheetOpen}
                            setIsBottomSheetOpen={setIsBottomSheetOpen}
                            isMobileMenuOpen={isMobileMenuOpen}
                            setIsMobileMenuOpen={setIsMobileMenuOpen}
                            setGlobalLoading={setGlobalLoading}
                            isConnected={isConnected}
                        />
                    )}

                    {/* 全域 Loading 遮罩層 */}
                    {globalLoading && (
                        <div className="fixed inset-0 bg-[#1d1d1f]/40 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-fade-in">
                            <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-scale-up">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0071e3] border-t-transparent"></div>
                                <p className="text-[#1d1d1f] font-semibold text-[15px]">處理中，請稍候...</p>
                            </div>
                        </div>
                    )}

                        {/* Modal 與 Dialog 區塊 */}
                        {dialog.isOpen && (
                        <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                            <div className="bg-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] w-full max-w-sm overflow-hidden flex flex-col animate-zoom-in text-center p-6">
                                <h3 className="font-bold text-[18px] text-[#1d1d1f] mb-2">{dialog.title}</h3>
                                <p className="text-[14px] text-[#86868b] mb-6">{dialog.message}</p>
                                
                                {dialog.type === 'prompt' && (
                                    <input 
                                        type="text" 
                                        autoFocus
                                        className="w-full bg-[#f5f5f7] border border-gray-200 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/20 rounded-xl p-3 text-[15px] outline-none transition-all mb-6 text-center"
                                        defaultValue={dialog.defaultValue}
                                        onKeyDown={(e) => { if(e.key === 'Enter') { dialog.onConfirm(e.target.value); closeDialog(); } }}
                                        id="promptInput"
                                    />
                                )}

                                <div className="flex gap-3">
                                    <button onClick={closeDialog} className="flex-1 py-3 text-[15px] font-semibold text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-xl transition-colors">取消</button>
                                    <button 
                                        onClick={() => {
                                            if (dialog.type === 'prompt') dialog.onConfirm(document.getElementById('promptInput').value);
                                            else dialog.onConfirm();
                                            closeDialog();
                                        }} 
                                        className={`flex-1 py-3 text-[15px] font-semibold text-white rounded-xl transition-colors ${dialog.type === 'confirm' && dialog.title.includes('刪除') ? 'bg-[#ff3b30] hover:bg-[#d70015]' : 'bg-[#0071e3] hover:bg-[#0077ed]'}`}
                                    >
                                        確定
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 全域 聯絡人清單 Modal (可編輯) */}
                    {showContactsModal && (
                        <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-fade-in">
                            <div className="bg-white rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] w-full max-w-3xl overflow-hidden flex flex-col animate-zoom-in">
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md">
                                    <h3 className="font-semibold text-[16px] text-[#1d1d1f] flex items-center gap-2"><Icons.Users size={18} className="text-[#0071e3]"/> 聯絡人管理</h3>
                                    <button onClick={() => setShowContactsModal(false)} className="p-1.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#86868b] rounded-full transition-colors"><Icons.X size={18}/></button>
                                </div>
                                
                                <div className="p-5 bg-white border-b border-gray-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-[13px] font-bold text-[#86868b]">{editingContactId ? '編輯聯絡人' : '新增聯絡人'}</h4>
                                        {editingContactId && (
                                            <button onClick={handleCancelEdit} className="text-[12px] font-semibold text-[#86868b] hover:text-[#1d1d1f] transition-colors">取消編輯</button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                        <input type="text" placeholder="姓名*" className="bg-[#f5f5f7] rounded-xl p-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#0071e3]/20" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
                                        <input type="text" placeholder="單位*" className="bg-[#f5f5f7] rounded-xl p-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#0071e3]/20" value={newContact.dept} onChange={e => setNewContact({...newContact, dept: e.target.value})} />
                                        <input type="text" placeholder="職稱" className="bg-[#f5f5f7] rounded-xl p-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#0071e3]/20" value={newContact.title} onChange={e => setNewContact({...newContact, title: e.target.value})} />
                                        <input type="text" placeholder="分機" className="bg-[#f5f5f7] rounded-xl p-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#0071e3]/20" value={newContact.ext} onChange={e => setNewContact({...newContact, ext: e.target.value})} />
                                        <input type="text" placeholder="備註" className="bg-[#f5f5f7] rounded-xl p-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#0071e3]/20" value={newContact.notes || ''} onChange={e => setNewContact({...newContact, notes: e.target.value})} />
                                        <button onClick={handleAddContact} disabled={!newContact.name || !newContact.dept} className={`rounded-xl text-[13px] font-semibold transition-colors text-white disabled:bg-[#d2d2d7] ${editingContactId ? 'bg-[#34c759] hover:bg-[#2fb350]' : 'bg-[#0071e3] hover:bg-[#0077ed]'}`}>
                                            {editingContactId ? '更新' : '新增'}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 bg-[#fbfbfd] max-h-[50vh] overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {contacts.map(contact => (
                                            <div key={contact.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:border-[#0071e3] transition-colors group relative">
                                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => handleEditContact(contact)} className="p-1.5 text-[#86868b] hover:text-[#0071e3] hover:bg-[#0071e3]/10 rounded-lg transition-colors">
                                                        <Icons.Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteContact(contact.id, contact.name)} className="p-1.5 text-[#86868b] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-lg transition-colors">
                                                        <Icons.Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-[#1d1d1f] text-[15px]">{contact.name}</h4>
                                                        <span className="text-[12px] font-medium text-[#86868b]">{contact.dept} · {contact.title}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-gray-50 flex flex-col gap-1 text-[13px] text-[#1d1d1f]">
                                                    <div className="flex justify-between">
                                                        <span className="text-[#86868b]">分機</span>
                                                        <span className="font-mono font-medium">{contact.ext || '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-[#86868b]">手機</span>
                                                        <span className="font-mono font-medium">{contact.phone || '-'}</span>
                                                    </div>
                                                    {contact.notes && (
                                                        <div className="flex justify-between mt-1 pt-1 border-t border-gray-50/50">
                                                            <span className="text-[#86868b]">備註</span>
                                                            <span className="font-medium text-right max-w-[60%] truncate" title={contact.notes}>{contact.notes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 全域 照片放大檢視器 */}
                    {viewingPhoto && (
                        <div className="fixed inset-0 bg-[#000000]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewingPhoto(null)}>
                            <button onClick={() => setViewingPhoto(null)} className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-md">
                                <Icons.X size={24}/>
                            </button>
                            <img src={viewingPhoto} alt="Enlarged" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-zoom-in" onClick={(e) => e.stopPropagation()} />
                        </div>
                    )}

                    {/* 全域 照片標註器 */}
                    {annotatingPhoto && (
                        <AnnotationModal annotatingPhoto={annotatingPhoto} setAnnotatingPhoto={setAnnotatingPhoto} />
                    )}
                </div>
            );
        }
