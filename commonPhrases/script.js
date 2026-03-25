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

// Show modal on + button click
document.getElementById('add-phrase-btn').addEventListener('click', function() {
    document.getElementById('phrase-form').style.display = 'block';
});

// Close modal
document.getElementById('close-phrase-form').addEventListener('click', function() {
    document.getElementById('phrase-form').style.display = 'none';
});

// Load and display commonPhrases
db.collection('commonPhrases').orderBy('timestamp').get().then((querySnapshot) => {
    const list = document.getElementById('phrase-list');
    list.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const item = document.createElement('div');
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
        list.appendChild(item);
    });
}).catch((error) => {
    console.error('Error loading commonPhrases:', error);
});

// Submit phrase form
document.getElementById('phrase-form-element').addEventListener('submit', async function(e) {
    e.preventDefault();
    const chinese = document.getElementById('phrase-chinese').value;
    const meaning = document.getElementById('phrase-meaning').value;
    const pinyin = document.getElementById('phrase-pinyin').value;
    const category = document.getElementById('phrase-category').value;
    const audioFile = document.getElementById('phrase-audio').files[0];

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
    document.getElementById('phrase-form').style.display = 'none';
    document.getElementById('phrase-form-element').reset();
    location.reload(); // Reload to refresh list
});