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

// Global variables
let currentCategory = "all";
let phrases = [];

// Function to display phrases
const displayPhrases = (docs) => {
    const list = document.getElementById('phrase-list');
    list.innerHTML = '';
    const filtered = currentCategory === "all" ? docs : docs.filter(doc => doc.data().category === currentCategory);
    filtered.forEach((doc) => {
        const data = doc.data();
        const item = document.createElement('div');
        item.setAttribute('data-doc-id', doc.id);
        item.innerHTML = `<div style="text-align: center; font-size: 1.2em;"><span class="edit-icon" style="font-size: 0.8em;">✏️</span> ${data.chinese} <span class="speaker-icon" style="font-size: 0.8em;">🔊</span></div><div>含义: <span class="vietnam-style">${data.meaning}</span><br>拼音: <span class="vietnam-style">${data.pinyin}</span></div>`;
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
                document.getElementById('edit-phrase-chinese').value = data.chinese;
                document.getElementById('edit-phrase-meaning').value = data.meaning;
                document.getElementById('edit-phrase-pinyin').value = data.pinyin;
                document.getElementById('edit-phrase-category').value = data.category || '生活';
                // Show edit modal
                document.getElementById('edit-phrase-form').style.display = 'block';
                // Store docId for submit
                document.getElementById('edit-phrase-form-element').setAttribute('data-doc-id', docId);
            });
        }
        list.appendChild(item);
    });

    // Move listen-all-btn to the end of phrase-list
    const listenBtn = document.getElementById('listen-all-btn');
    const playingMsg = document.getElementById('playing-message');
    if (listenBtn && playingMsg) {
        list.appendChild(listenBtn);
        list.appendChild(playingMsg);
    }
};

// Show modal on + button click
document.getElementById('add-phrase-btn').addEventListener('click', function() {
    document.getElementById('phrase-form').style.display = 'block';
});

// Close modal
document.getElementById('close-phrase-form').addEventListener('click', function() {
    document.getElementById('phrase-form').style.display = 'none';
});

// Close edit modal
document.getElementById('close-edit-phrase-form').addEventListener('click', function() {
    document.getElementById('edit-phrase-form').style.display = 'none';
    document.getElementById('edit-phrase-form-element').reset();
});

// Category filter
if (document.getElementById('category-filter')) document.getElementById('category-filter').addEventListener('change', (e) => {
    currentCategory = e.target.value;
    displayPhrases(phrases);
});

// Home button
if (document.getElementById('home-btn')) document.getElementById('home-btn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Listen all button
if (document.getElementById('listen-all-btn')) document.getElementById('listen-all-btn').addEventListener('click', () => {
    const button = document.getElementById('listen-all-btn');
    const message = document.getElementById('playing-message');
    button.classList.add('dimmed');
    message.style.display = 'block';
    const filtered = currentCategory === "all" ? phrases : phrases.filter(doc => doc.data().category === currentCategory);
    let index = 0;
    const playNext = () => {
        if (index >= filtered.length) {
            button.classList.remove('dimmed');
            message.style.display = 'none';
            return;
        }
        const data = filtered[index].data();
        if (data.audioUrl) {
            const audio = new Audio(data.audioUrl);
            audio.play();
            audio.onended = () => {
                index++;
                setTimeout(playNext, 2000);
            };
        } else {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(data.chinese);
                utterance.lang = 'zh-CN';
                speechSynthesis.speak(utterance);
                utterance.onend = () => {
                    index++;
                    setTimeout(playNext, 2000);
                };
            }
        }
    };
    playNext();
});

// Load and display commonPhrases
if (document.getElementById('spinner')) document.getElementById('spinner').style.display = 'block';
db.collection('commonPhrases').orderBy('timestamp').get().then((querySnapshot) => {
    phrases = querySnapshot.docs;
    displayPhrases(phrases);
    if (document.getElementById('spinner')) document.getElementById('spinner').style.display = 'none';
    document.getElementById('video').style.display = 'block';
}).catch((error) => {
    console.error('Error loading commonPhrases:', error);
    if (document.getElementById('spinner')) document.getElementById('spinner').style.display = 'none';
});

// Submit phrase form
document.getElementById('phrase-form-element').addEventListener('submit', async function(e) {
    e.preventDefault();
    const chinese = document.getElementById('phrase-chinese').value;
    const meaning = document.getElementById('phrase-meaning').value;
    const pinyin = document.getElementById('phrase-pinyin').value;
    const category = document.getElementById('phrase-category').value;
    const audioFile = document.getElementById('phrase-audio').files[0];

    if (document.getElementById('spinner')) document.getElementById('spinner').style.display = 'block';

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

        await db.collection('commonPhrases').add({
            chinese: chinese,
            meaning: meaning,
            pinyin: pinyin,
            category: category,
            audioUrl: audioUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        setTimeout(() => {
            if (document.getElementById('spinner')) document.getElementById('spinner').style.display = 'none';
            document.getElementById('phrase-form').style.display = 'none';
            document.getElementById('phrase-form-element').reset();
            location.reload(); // Reload to refresh list
        }, 1000);
    } catch (error) {
        if (document.getElementById('spinner')) document.getElementById('spinner').style.display = 'none';
        console.error('Error adding phrase:', error);
        alert('添加时发生错误。');
    }
});

// Submit edit phrase form
document.getElementById('edit-phrase-form-element').addEventListener('submit', async function(e) {
    e.preventDefault();
    const docId = this.getAttribute('data-doc-id');
    const chinese = document.getElementById('edit-phrase-chinese').value;
    const meaning = document.getElementById('edit-phrase-meaning').value;
    const pinyin = document.getElementById('edit-phrase-pinyin').value;
    const category = document.getElementById('edit-phrase-category').value;
    const audioFile = document.getElementById('edit-phrase-audio').files[0];

    if (document.getElementById('spinner')) document.getElementById('spinner').style.display = 'block';

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
            category: category
        };
        if (audioUrl) {
            updateData.audioUrl = audioUrl;
        }

        await db.collection('commonPhrases').doc(docId).update(updateData);
        setTimeout(() => {
            if (document.getElementById('spinner')) document.getElementById('spinner').style.display = 'none';
            document.getElementById('edit-phrase-form').style.display = 'none';
            document.getElementById('edit-phrase-form-element').reset();
            location.reload(); // Reload to refresh list
        }, 1000);
    } catch (error) {
        if (document.getElementById('spinner')) document.getElementById('spinner').style.display = 'none';
        console.error('Error updating phrase:', error);
        alert('更新时发生错误。');
    }
});