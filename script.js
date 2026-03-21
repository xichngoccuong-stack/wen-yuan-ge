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
        item.innerHTML = `<div style="text-align: center;">${data.chinese}</div><div>含义: ${data.meaning}<br>拼音: ${data.pinyin}<br>汉越音: ${data.hanviet || ''}</div>`;
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

// Submit vocab form
document.getElementById('vocab-form-element').addEventListener('submit', async function(e) {
    e.preventDefault();
    const chinese = document.getElementById('chinese').value;
    const meaning = document.getElementById('meaning').value;
    const pinyin = document.getElementById('pinyin').value;
    const hanviet = document.getElementById('hanviet').value;

    try {
        await db.collection('vocabularies').add({
            chinese: chinese,
            meaning: meaning,
            pinyin: pinyin,
            hanviet: hanviet,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        const notification = document.getElementById('notification');
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
            document.getElementById('vocab-form').style.display = 'none';
            document.getElementById('vocab-form-element').reset();
        }, 1000);
    } catch (error) {
        console.error('添加词汇时出错:', error);
        alert('添加词汇时发生错误。');
    }
});