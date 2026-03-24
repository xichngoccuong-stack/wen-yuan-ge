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
    db.collection('vocabularies').orderBy('hanviet').get()
]).then(([_timeout, _fonts, querySnapshot]) => {
    document.getElementById('image').style.display = 'none';
    document.getElementById('video').style.display = 'block';
    document.querySelector('header').style.display = 'block';
    
    // Display vocabularies
    const list = document.getElementById('vocab-list');
    let vocabularies = [];
    querySnapshot.forEach((doc) => {
        vocabularies.push({ id: doc.id, ...doc.data() });
    });

    function displayVocabularies(filteredVocabularies) {
        list.innerHTML = '';
        filteredVocabularies.forEach((data) => {
            const item = document.createElement('div');
            item.setAttribute('data-doc-id', data.id);
            item.innerHTML = `<div style="text-align: center; font-size: 1.2em;"><span class="edit-icon" style="font-size: 0.8em;">✏️</span> ${data.chinese} <span class="speaker-icon" style="font-size: 0.8em;">🔊</span></div><div>含义: <span class="vietnam-style">${data.meaning}</span><br>拼音: <span class="vietnam-style">${data.pinyin}</span>${data.hanviet && data.hanviet !== data.meaning ? '<br>汉越音: <span class="vietnam-style">' + data.hanviet + '</span>' : ''}</div>`;
            const speakerIcon = item.querySelector('.speaker-icon');
            if (speakerIcon) {
                speakerIcon.addEventListener('click', () => {
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
            }
            const editIcon = item.querySelector('.edit-icon');
            if (editIcon) {
                editIcon.addEventListener('click', () => {
                    const docId = item.getAttribute('data-doc-id');
                    // Populate edit form with data
                    document.getElementById('edit-chinese').value = data.chinese;
                    document.getElementById('edit-meaning').value = data.meaning;
                    document.getElementById('edit-pinyin').value = data.pinyin;
                    document.getElementById('edit-hanviet').value = data.hanviet || '';
                    document.getElementById('edit-category').value = data.category || '生活';
                    // Show edit modal
                    document.getElementById('edit-vocab-form').style.display = 'block';
                    // Store docId for submit
                    document.getElementById('edit-vocab-form-element').setAttribute('data-doc-id', docId);
                });
            }
            list.appendChild(item);
        });
    }

    displayVocabularies(vocabularies);
    
    // Search functionality
    document.getElementById('search-input').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const category = document.getElementById('category-filter').value;
        const filtered = vocabularies.filter(vocab => {
            const matchesSearch = vocab.chinese.toLowerCase().includes(term) ||
                    (vocab.hanviet && vocab.hanviet.toLowerCase().includes(term)) ||
                    vocab.meaning.toLowerCase().includes(term) ||
                    vocab.pinyin.toLowerCase().includes(term);
            const matchesCategory = category === '' || vocab.category === category;
            return matchesSearch && matchesCategory;
        });
        displayVocabularies(filtered);
    });

    // Category filter functionality
    document.getElementById('category-filter').addEventListener('change', () => {
        const term = document.getElementById('search-input').value.toLowerCase();
        const category = document.getElementById('category-filter').value;
        const filtered = vocabularies.filter(vocab => {
            const matchesSearch = vocab.chinese.toLowerCase().includes(term) ||
                    (vocab.hanviet && vocab.hanviet.toLowerCase().includes(term)) ||
                    vocab.meaning.toLowerCase().includes(term) ||
                    vocab.pinyin.toLowerCase().includes(term);
            const matchesCategory = category === '' || vocab.category === category;
            return matchesSearch && matchesCategory;
        });
        displayVocabularies(filtered);
    });
}).catch((error) => {
    console.error('添加词汇时出错:', error);
});

// Menu toggle
document.getElementById('menu-button').addEventListener('click', function() {
    const dropdown = document.getElementById('menu-dropdown');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const vocabList = document.getElementById('vocab-list');

    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
        searchInput.classList.remove('dimmed');
        categoryFilter.classList.remove('dimmed');
        vocabList.classList.remove('dimmed');
    } else {
        dropdown.style.display = 'block';
        searchInput.classList.add('dimmed');
        categoryFilter.classList.add('dimmed');
        vocabList.classList.add('dimmed');
    }
});

// Check vocab modal toggle
document.getElementById('check-vocab-link').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('check-vocab-modal').style.display = 'block';
    document.getElementById('menu-dropdown').style.display = 'none';
    // Keep dimmed
});

// Close check vocab modal
document.getElementById('close-check-vocab-modal').addEventListener('click', function() {
    document.getElementById('check-vocab-modal').style.display = 'none';
    document.getElementById('search-input').classList.remove('dimmed');
    document.getElementById('category-filter').classList.remove('dimmed');
    document.getElementById('vocab-list').classList.remove('dimmed');
});

// Show vocab form
document.getElementById('add-vocab-link').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('vocab-form').style.display = 'block';
    document.getElementById('menu-dropdown').style.display = 'none';
    document.getElementById('search-input').classList.remove('dimmed');
    document.getElementById('category-filter').classList.remove('dimmed');
    document.getElementById('vocab-list').classList.remove('dimmed');
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

// Show quiz settings form
document.getElementById('setup-quiz-link').addEventListener('click', async function(e) {
    e.preventDefault();
    document.getElementById('quiz-settings-form').style.display = 'block';
    document.getElementById('menu-dropdown').style.display = 'none';
    document.getElementById('search-input').classList.remove('dimmed');
    document.getElementById('category-filter').classList.remove('dimmed');
    document.getElementById('vocab-list').classList.remove('dimmed');
    const docRef = db.collection('quiz-settings').doc('settings');
    const doc = await docRef.get();
    if (doc.exists) {
        const data = doc.data();
        document.getElementById('num-words').value = data.numWords || '';
        document.getElementById('quiz-category').value = data.category || '';
    }
});

// Close quiz settings form
const closeQuizForm = document.getElementById('close-quiz-form');
if (closeQuizForm) {
    closeQuizForm.addEventListener('click', function() {
        document.getElementById('quiz-settings-form').style.display = 'none';
        document.getElementById('quiz-settings-form-element').reset();
    });
}

// Submit quiz settings form
document.getElementById('quiz-settings-form-element').addEventListener('submit', async function(e) {
    e.preventDefault();
    const numWords = document.getElementById('num-words').value;
    const category = document.getElementById('quiz-category').value;
    const docRef = db.collection('quiz-settings').doc('settings');
    const doc = await docRef.get();
    if (doc.exists) {
        await docRef.update({
            numWords: numWords,
            category: category
        });
    } else {
        await docRef.set({
            numWords: numWords,
            category: category
        });
    }
    document.getElementById('quiz-settings-form').style.display = 'none';
    document.getElementById('quiz-settings-form-element').reset();
    document.getElementById('notification').innerHTML = '设置已保存！';
    document.getElementById('notification').style.display = 'block';
    setTimeout(() => {
        document.getElementById('notification').style.display = 'none';
    }, 1000);
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
            hanviet: hanviet,
            category: document.getElementById('edit-category').value
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

        await db.collection('vocabularies').add({
            chinese: chinese,
            meaning: meaning,
            pinyin: pinyin,
            hanviet: hanviet,
            category: document.getElementById('category').value,
            audioUrl: audioUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        const notification = document.getElementById('notification');
        notification.style.display = 'block';
        setTimeout(() => {
            document.getElementById('spinner').style.display = 'none';
            notification.style.display = 'none';
            document.getElementById('vocab-form').style.display = 'none';
            document.getElementById('vocab-form-element').reset();
            location.reload(); // Reload page after adding new vocab
        }, 1000);
    } catch (error) {
        document.getElementById('spinner').style.display = 'none';
        console.error('添加词汇时出错:', error);
        alert('添加词汇时发生错误。');
    }
});