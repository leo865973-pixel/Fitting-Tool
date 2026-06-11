import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { uploadImageToImgBB } from '../utils/firebase';

        export function AnnotationModal({ annotatingPhoto, setAnnotatingPhoto }) {
            const canvasRef = useRef(null);
            const [isDrawing, setIsDrawing] = useState(false);
            const [isUploading, setIsUploading] = useState(false);
            const ctxRef = useRef(null);

            useEffect(() => {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.crossOrigin = "Anonymous"; // 避免跨域污染畫布
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    ctx.strokeStyle = '#ff3b30';
                    ctx.lineWidth = 5;
                    ctx.lineCap = 'round';
                    ctxRef.current = ctx;
                };
                img.src = annotatingPhoto.url;
            }, [annotatingPhoto.url]);

            const startDraw = (e) => {
                const rect = canvasRef.current.getBoundingClientRect();
                const scaleX = canvasRef.current.width / rect.width;
                const scaleY = canvasRef.current.height / rect.height;
                ctxRef.current.beginPath();
                ctxRef.current.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                setIsDrawing(true);
            };

            const draw = (e) => {
                if (!isDrawing) return;
                const rect = canvasRef.current.getBoundingClientRect();
                const scaleX = canvasRef.current.width / rect.width;
                const scaleY = canvasRef.current.height / rect.height;
                ctxRef.current.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                ctxRef.current.stroke();
            };

            const stopDraw = () => {
                if(isDrawing) {
                    ctxRef.current.closePath();
                    setIsDrawing(false);
                }
            };

            const handleSave = async () => {
                const apiKey = await annotatingPhoto.getImgBBKeyAsync();
                if (!apiKey) return;

                setIsUploading(true);
                const base64 = canvasRef.current.toDataURL('image/jpeg', 0.8);
                const result = await uploadImageToImgBB(base64, apiKey);
                
                if (result.success) {
                    annotatingPhoto.onSave(result.url);
                    setAnnotatingPhoto(null);
                } else {
                    alert(`標註儲存失敗: ${result.error}`);
                    if (result.error && result.error.toLowerCase().includes('key')) {
                        localStorage.removeItem('imgbb_api_key');
                    }
                }
                setIsUploading(false);
            };

            return (
                <div className="fixed inset-0 bg-[#000000]/90 backdrop-blur-xl z-[110] flex flex-col items-center justify-center p-4 animate-fade-in">
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
                        <div className="text-white font-semibold flex items-center gap-2"><Icons.Brush size={20}/> 標註照片</div>
                        <div className="flex gap-3">
                            <button onClick={() => setAnnotatingPhoto(null)} disabled={isUploading} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors text-[14px] font-semibold backdrop-blur-md disabled:opacity-50">取消</button>
                            <button onClick={handleSave} disabled={isUploading} className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full transition-colors text-[14px] font-semibold shadow-lg disabled:opacity-50">
                                {isUploading ? '上傳雲端中...' : '儲存標註'}
                            </button>
                        </div>
                    </div>
                    <div className="relative max-w-full max-h-[80vh] overflow-hidden rounded-lg shadow-2xl bg-black">
                        <canvas 
                            ref={canvasRef}
                            onMouseDown={startDraw}
                            onMouseMove={draw}
                            onMouseUp={stopDraw}
                            onMouseLeave={stopDraw}
                            className="max-w-full max-h-[80vh] object-contain cursor-crosshair touch-none"
                        />
                    </div>
                    <p className="text-white/60 text-[13px] mt-4">請使用滑鼠在照片上畫出瑕疵位置</p>
                </div>
            );
        }

        // ==========================================
        // 6. 根組件 (App) - 包含全域 Dialog 與 Firebase 同步
        // ==========================================
