import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, onValue, get, update, remove, query, orderByChild, limitToLast } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyB_-Mi4XgDXQhFCPIdwSvy_gVD4FUjPNY0",
    authDomain: "fitting-tool-d9a54.firebaseapp.com",
    databaseURL: "https://fitting-tool-d9a54-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fitting-tool-d9a54",
    storageBucket: "fitting-tool-d9a54.firebasestorage.app",
    messagingSenderId: "18568841469",
    appId: "1:18568841469:web:f1ba1e232ae485cd3b5694"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export const uploadImageToImgBB = async (fileOrBase64, apiKey) => {
    const formData = new FormData();
    if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:image')) {
        formData.append('image', fileOrBase64.split(',')[1]);
    } else {
        formData.append('image', fileOrBase64);
    }

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            return { success: true, url: data.data.url };
        } else {
            return { success: false, error: data.error.message };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export { ref, push, set, onValue, get, update, remove, query, orderByChild, limitToLast };
