const fs = require('fs');
const file = 'c:/vibe coding/車頭前圍玉成分析系統/index.html';
let t = fs.readFileSync(file, 'utf8');

const targetUpload = `        setIsUploading(true);
        setGlobalLoading(true);

        // 在上傳前先進行前端壓縮 (最大 1280x1280, 品質 70%)
        const compressedFile = await compressImage(file);

        const result = await uploadImageToImgBB(compressedFile, apiKey);
        if (result.success) {
            setTempPhotoUrl(result.url);
            showToast("照片上傳成功！", 'success');
        } else {
            showToast(\`上傳失敗: \${result.error}\`, 'error');
            if (result.error && result.error.toLowerCase().includes('key')) {
                localStorage.removeItem('imgbb_api_key'); // 清除無效的 Key
            }
        }
        setIsUploading(false);
        setGlobalLoading(false);`;

const replacementUpload = `        setIsUploading(true);
        setGlobalLoading(true);

        try {
            // 在上傳前先進行前端壓縮 (最大 1280x1280, 品質 70%)
            const compressedFile = await compressImage(file);

            const result = await uploadImageToImgBB(compressedFile, apiKey);
            if (result.success) {
                setTempPhotoUrl(result.url);
                showToast("照片上傳成功！", 'success');
            } else {
                showToast(\`上傳失敗: \${result.error}\`, 'error');
                if (result.error && result.error.toLowerCase().includes('key')) {
                    localStorage.removeItem('imgbb_api_key'); // 清除無效的 Key
                }
            }
        } catch (err) {
            showToast(\`上傳發生異常: \${err.message}\`, 'error');
            console.error(err);
        } finally {
            setIsUploading(false);
            setGlobalLoading(false);
        }`;

t = t.replace(targetUpload, replacementUpload);
fs.writeFileSync(file, t);
console.log('Done replacing handleFileChange');
