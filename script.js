// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCEU_hkazFaQ47eBcWglU0QZr5N4i_XPFk",
    authDomain: "eng-vocab-website.firebaseapp.com",
    projectId: "eng-vocab-website",
    storageBucket: "eng-vocab-website.firebasestorage.app",
    messagingSenderId: "669746577120",
    appId: "1:669746577120:web:494b943ef1319ce4d69a85",
    measurementId: "G-DHBPC5RL89"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Cloudinary config
const cloudName = 'dglxrlydv';
const uploadPreset = 'vocab_images';

document.querySelector('header').style.display = 'none';

Promise.all([
    new Promise(resolve => setTimeout(resolve, 2000)),
    document.fonts.ready,
    db.collection('vocabularies').get()
]).then(([timeout, fonts, querySnapshot]) => {
    document.getElementById('image').style.display = 'none';
    document.getElementById('video').style.display = 'block';
    document.querySelector('header').style.display = 'block';

    // Display vocabularies
    const list = document.getElementById('vocab-list');
    list.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const item = document.createElement('div');
        item.setAttribute('data-doc-id', doc.id);
        item.innerHTML = `<div style="text-align: center; font-size: 1.2em;"><span class="edit-icon" style="font-size: 0.8em;">✏️</span> ${data.chinese} <span class="speaker-icon" style="font-size: 0.8em;">🔊</span></div><div>含义: <span class="vietnam-style">${data.meaning}</span><br>拼音: <span class="vietnam-style">${data.pinyin}</span>${data.hanviet ? '<br>汉越音: <span class="vietnam-style">' + data.hanviet + '</span>' : ''}</div>`;
        item.querySelector('.speaker-icon').addEventListener('click', () => {
            if (data.audioUrl) {
                const audio = new Audio(data.audioUrl);
                audio.play();
            } else {
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(data.chinese);
                    utterance.lang = 'zh-CN';
                    speechSynthesis.speak(utterance);
                } else {
                    alert('Web Speech API 在此浏览器中不受支持。');
                }
            }
        });
        item.querySelector('.edit-icon').addEventListener('click', () => {
            const docId = item.getAttribute('data-doc-id');
            // Populate edit form with data
            document.getElementById('edit-chinese').value = data.chinese;
            document.getElementById('edit-meaning').value = data.meaning;
            document.getElementById('edit-pinyin').value = data.pinyin;
            document.getElementById('edit-hanviet').value = data.hanviet || '';
            // Show edit modal
            document.getElementById('edit-vocab-form').style.display = 'block';
            // Store docId for submit
            document.getElementById('edit-vocab-form-element').setAttribute('data-doc-id', docId);
        });
        list.appendChild(item);
    });
}).catch((error) => {
    console.error('添加词汇时出错:', error);
});

// Menu toggle
document.getElementById('menu-button').addEventListener('click', function() {
    const dropdown = document.getElementById('menu-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
});

// Show vocab form
document.getElementById('add-vocab-link').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('vocab-form').style.display = 'block';
    document.getElementById('menu-dropdown').style.display = 'none';
});

// Close vocab form
document.getElementById('close-form').addEventListener('click', function() {
    document.getElementById('vocab-form').style.display = 'none';
});

// Close edit vocab form
document.getElementById('close-edit-form').addEventListener('click', function() {
    document.getElementById('edit-vocab-form').style.display = 'none';
    document.getElementById('edit-vocab-form-element').reset();
});

// Submit edit vocab form
document.getElementById('edit-vocab-form-element').addEventListener('submit', async function(e) {
    e.preventDefault();
    const docId = this.getAttribute('data-doc-id');
    const chinese = document.getElementById('edit-chinese').value;
    const meaning = document.getElementById('edit-meaning').value;
    const pinyin = document.getElementById('edit-pinyin').value;
    const hanviet = document.getElementById('edit-hanviet').value;
    const audioFile = document.getElementById('edit-audio').files[0];

    document.getElementById('spinner').style.display = 'block';

    try {
        let audioUrl = null;
        if (audioFile) {
            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('upload_preset', uploadPreset);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            audioUrl = result.secure_url;
        }

        const updateData = {
            chinese: chinese,
            meaning: meaning,
            pinyin: pinyin,
            hanviet: hanviet
        };
        if (audioUrl) {
            updateData.audioUrl = audioUrl;
        }

        await db.collection('vocabularies').doc(docId).update(updateData);

        document.getElementById('spinner').style.display = 'none';

        // Close modal
        document.getElementById('edit-vocab-form').style.display = 'none';
        document.getElementById('edit-vocab-form-element').reset();

        // Refresh list
        location.reload(); // Simple way to refresh

    } catch (error) {
        document.getElementById('spinner').style.display = 'none';
      console.error('更新词汇失败：', error);
      alert('更新词汇失败。');
    }
});

// Submit vocab form
document.getElementById('vocab-form-element').addEventListener('submit', async function(e) {
    e.preventDefault();
    const chinese = document.getElementById('chinese').value;
    const meaning = document.getElementById('meaning').value;
    const pinyin = document.getElementById('pinyin').value;
    const hanviet = document.getElementById('hanviet').value;
    const audioFile = document.getElementById('audio').files[0];

    try {
        let audioUrl = null;
        if (audioFile) {
            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('upload_preset', uploadPreset);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            audioUrl = result.secure_url;
        }

        await db.collection('vocabularies').add({
            chinese: chinese,
            meaning: meaning,
            pinyin: pinyin,
            hanviet: hanviet,
            audioUrl: audioUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        const notification = document.getElementById('notification');
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
            document.getElementById('vocab-form').style.display = 'none';
            document.getElementById('vocab-form-element').reset();
            location.reload(); // Reload page after adding new vocab
        }, 1000);
    } catch (error) {
        console.error('添加词汇时出错:', error);
        alert('添加词汇时发生错误。');
    }
});