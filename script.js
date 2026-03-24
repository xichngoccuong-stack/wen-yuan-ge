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
]).then(([timeout, fonts, querySnapshot]) => {
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
                document.getElementById('edit-category').value = data.category || '生活';
                // Show edit modal
                document.getElementById('edit-vocab-form').style.display = 'block';
                // Store docId for submit
                document.getElementById('edit-vocab-form-element').setAttribute('data-doc-id', docId);
            });
            list.appendChild(item);
        });
    }

    displayVocabularies(vocabularies);
    window.vocabularies = vocabularies; // Make vocabularies global for read modal

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

// Read modal functionality
let currentReadWords = [];
let currentReadIndex = 0;
let userAnswers = [];
let selectedForCurrent = false;
let resultShown = false;
let wordOptions = [];
let correctIndexPerWord = [];

// Listen modal functionality
let currentListenWords = [];
let currentListenIndex = 0;
let listenUserAnswers = [];
let listenResultShown = false;

document.getElementById('read-btn').addEventListener('click', async function() {
    const docRef = db.collection('quiz-settings').doc('settings');
    const doc = await docRef.get();
    let numWords = Infinity;
    let category = '';
    if (doc.exists) {
        const data = doc.data();
        numWords = data.numWords ? parseInt(data.numWords) : Infinity;
        category = data.category || '';
    }
    let filteredVocabs = window.vocabularies;
    if (category && category !== '全部') {
        filteredVocabs = window.vocabularies.filter(v => v.category === category);
    }
    // Always shuffle to randomize the list
    if (filteredVocabs.length > 1) {
        const shuffled = [...filteredVocabs].sort(() => 0.5 - Math.random());
        filteredVocabs = shuffled;
    }
    if (numWords && numWords < filteredVocabs.length) {
        filteredVocabs = filteredVocabs.slice(0, numWords);
    }
    if (filteredVocabs.length === 0) {
        alert('No vocabularies found for the selected category.');
        return;
    }
    currentReadWords = filteredVocabs;
    // Pre-generate options for each word
    wordOptions = [];
    correctIndexPerWord = [];
    currentReadWords.forEach(word => {
        const options = [word.meaning];
        const otherVocabs = window.vocabularies.filter(v => v.meaning !== word.meaning);
        const shuffledOthers = otherVocabs.sort(() => 0.5 - Math.random()).slice(0, 3);
        options.push(...shuffledOthers.map(v => v.meaning));
        const shuffledOptions = options.sort(() => 0.5 - Math.random());
        wordOptions.push(shuffledOptions);
        correctIndexPerWord.push(shuffledOptions.indexOf(word.meaning));
    });
    currentReadIndex = 0;
    showCurrentWord();
    document.getElementById('read-vocab-modal').style.display = 'block';
    document.getElementById('check-vocab-modal').style.display = 'none';
    document.getElementById('vocab-list').style.display = 'none';
    // Hide search and filter
    document.querySelector('.search-filter-row').style.display = 'none';
    document.querySelector('.menu-container').style.display = 'none';
    // Disable menu button
    document.getElementById('menu-button').style.pointerEvents = 'none';
    document.getElementById('menu-button').style.opacity = '0.5';
    resultShown = false;
});

function showCurrentWord() {
    const word = currentReadWords[currentReadIndex];
    const wordChinese = document.getElementById('word-chinese');
    if (wordChinese) wordChinese.textContent = word.chinese;
    const prevBtn = document.getElementById('prev-word');
    if (prevBtn) prevBtn.disabled = currentReadIndex === 0;
    const nextBtn = document.getElementById('next-word');
    if (nextBtn) nextBtn.disabled = currentReadIndex === currentReadWords.length - 1;

    // Use pre-generated options
    const shuffledOptions = wordOptions[currentReadIndex];
    // Store correct answer index
    window.correctIndex = correctIndexPerWord[currentReadIndex];
    // Update buttons
    for (let i = 1; i <= 4; i++) {
        const btn = document.getElementById(`option-${i}`);
        if (btn) {
            btn.textContent = shuffledOptions[i - 1];
            btn.style.background = '';
            btn.style.backgroundColor = '';
            btn.disabled = false;
        }
    }
    // Check if already selected
    if (userAnswers[currentReadIndex]) {
        const selectedMeaning = userAnswers[currentReadIndex].selectedMeaning;
        for (let i = 1; i <= 4; i++) {
            const btn = document.getElementById(`option-${i}`);
            if (btn && btn.textContent === selectedMeaning) {
                btn.style.background = 'linear-gradient(to right, orange, red)';
                selectedForCurrent = true;
                break;
            }
        }
    } else {
        selectedForCurrent = false;
    }

    const closeBtn = document.getElementById('close-read-modal');
    if (closeBtn) {
        // If last word and not result shown, change close button to "查看结果"
        if (currentReadIndex === currentReadWords.length - 1 && !resultShown) {
            closeBtn.textContent = '查看结果';
        } else if (resultShown) {
            closeBtn.textContent = '关闭';
        } else {
            closeBtn.textContent = '关闭';
        }
    }
}

// Option button event listeners
for (let i = 1; i <= 4; i++) {
    document.getElementById(`option-${i}`).addEventListener('click', function() {
        const selectedMeaning = this.textContent;
        const word = currentReadWords[currentReadIndex];
        const isCorrect = selectedMeaning === word.meaning;
        userAnswers[currentReadIndex] = {
            word: word.chinese,
            selectedMeaning: selectedMeaning,
            correct: isCorrect,
            correctMeaning: word.meaning
        };
        // Reset all options background
        for (let j = 1; j <= 4; j++) {
            const optBtn = document.getElementById(`option-${j}`);
            if (optBtn) optBtn.style.background = '';
        }
        // Highlight selected option
        this.style.background = 'linear-gradient(to right, orange, red)';
        selectedForCurrent = true;
        document.getElementById('next-word').disabled = currentReadIndex === currentReadWords.length - 1;
    });
}

document.getElementById('prev-word').addEventListener('click', function() {
    if (currentReadIndex > 0) {
        currentReadIndex--;
        showCurrentWord();
    }
});

document.getElementById('next-word').addEventListener('click', function() {
    if (currentReadIndex < currentReadWords.length - 1) {
        currentReadIndex++;
        showCurrentWord();
    }
});

document.getElementById('close-read-modal').addEventListener('click', function() {
    if (resultShown) {
        // Close modal and reload
        document.getElementById('read-vocab-modal').style.display = 'none';
        document.getElementById('vocab-list').style.display = 'block';
        // Show search and filter
        document.querySelector('.search-filter-row').style.display = 'flex';
        document.querySelector('.menu-container').style.display = 'block';
        // Enable menu button
        document.getElementById('menu-button').style.pointerEvents = 'auto';
        document.getElementById('menu-button').style.opacity = '1';
        document.getElementById('spinner').style.display = 'block';
        location.reload(); // Reload page when closing modal
    } else if (currentReadIndex === currentReadWords.length - 1) {
        // Check if all answers are provided
        if (userAnswers.length < currentReadWords.length) {
            alert('请回答所有问题后再查看结果。');
            return;
        }
        // Check all answers
        const wrongAnswers = userAnswers.filter(a => !a.correct);
        let resultHTML = '';
        if (wrongAnswers.length === 0) {
            resultHTML = '<p style="text-align: center;">完成！全部正确。</p>';
        } else {
            resultHTML = '<p>错误的词：</p><ul>';
            wrongAnswers.forEach(a => {
                resultHTML += `<li>${a.word}: <span style="font-family: 'Shalimar'; font-size: 24px;">${a.correctMeaning}</span> <span style="color: red; font-weight: bold; font-family: 'Shalimar'; font-size: 24px;">(${a.selectedMeaning})</span></li>`;
            });
            resultHTML += '</ul>';
        }
        // Update modal content
        const wordChinese = document.getElementById('word-chinese');
        if (wordChinese) wordChinese.textContent = '结果:';
        const readContent = document.getElementById('read-vocab-content');
        if (readContent) readContent.innerHTML = resultHTML;
        // Hide options
        document.querySelectorAll('.option-btn').forEach(btn => btn.style.display = 'none');
        const prevBtn = document.getElementById('prev-word');
        if (prevBtn) prevBtn.style.display = 'none';
        const nextBtn = document.getElementById('next-word');
        if (nextBtn) nextBtn.style.display = 'none';
        // Change button to "关闭" for reload
        const closeBtn = document.getElementById('close-read-modal');
        if (closeBtn) {
            closeBtn.textContent = '关闭';
        }
        resultShown = true;
    } else {
        document.getElementById('read-vocab-modal').style.display = 'none';
        document.getElementById('vocab-list').style.display = 'block';
        // Show search and filter
        document.querySelector('.search-filter-row').style.display = 'flex';
        document.querySelector('.menu-container').style.display = 'block';
        // Enable menu button
        document.getElementById('menu-button').style.pointerEvents = 'auto';
        document.getElementById('menu-button').style.opacity = '1';
        document.getElementById('spinner').style.display = 'block';
        location.reload(); // Reload page when closing modal
    }
});

// Listen modal functionality
document.getElementById('listen-btn').addEventListener('click', async function() {
    const docRef = db.collection('quiz-settings').doc('settings');
    const doc = await docRef.get();
    let numWords = 1; // default to 1 for listen
    let category = '';
    if (doc.exists) {
        const data = doc.data();
        numWords = data.numWords ? parseInt(data.numWords) : 1;
        category = data.category || '';
    }
    let filteredVocabs = window.vocabularies;
    if (category && category !== '全部') {
        filteredVocabs = window.vocabularies.filter(v => v.category === category);
    }
    // Randomize
    if (filteredVocabs.length > 1) {
        const shuffled = [...filteredVocabs].sort(() => 0.5 - Math.random());
        filteredVocabs = shuffled;
    }
    if (numWords && numWords < filteredVocabs.length) {
        filteredVocabs = filteredVocabs.slice(0, numWords);
    }
    if (filteredVocabs.length === 0) {
        alert('No vocabularies found for the selected category.');
        return;
    }
    currentListenWords = filteredVocabs;
    currentListenIndex = 0;
    listenUserAnswers = [];
    showCurrentListenWord();
    document.getElementById('listen-vocab-modal').style.display = 'block';
    document.getElementById('check-vocab-modal').style.display = 'none';
    document.getElementById('vocab-list').style.display = 'none';
    // Hide search and filter
    document.querySelector('.search-filter-row').style.display = 'none';
    document.querySelector('.menu-container').style.display = 'none';
    // Disable menu button
    document.getElementById('menu-button').style.pointerEvents = 'none';
    document.getElementById('menu-button').style.opacity = '0.5';
    listenResultShown = false;
});

function showCurrentListenWord() {
    const word = currentListenWords[currentListenIndex];
    const audio = document.getElementById('word-audio');
    if (audio) {
        audio.src = word.audioUrl || '';
        audio.load();
    }
    // Populate input if already answered
    const input = document.getElementById('user-chinese-input');
    if (listenUserAnswers[currentListenIndex]) {
        input.value = listenUserAnswers[currentListenIndex].userInput;
    } else {
        input.value = '';
    }
    // Update button states
    const prevBtn = document.getElementById('prev-listen-word');
    if (prevBtn) prevBtn.disabled = currentListenIndex === 0;
    const nextBtn = document.getElementById('next-listen-word');
    if (nextBtn) nextBtn.disabled = currentListenIndex === currentListenWords.length - 1;
    // Update close button
    const closeBtn = document.getElementById('close-listen-modal');
    if (closeBtn) {
        if (currentListenIndex === currentListenWords.length - 1 && !listenResultShown) {
            closeBtn.textContent = '查看结果';
        } else {
            closeBtn.textContent = '关闭';
        }
    }
}

document.getElementById('next-listen-word').addEventListener('click', function() {
    const userInput = document.getElementById('user-chinese-input').value.trim();
    const word = currentListenWords[currentListenIndex];
    const isCorrect = userInput === word.chinese;
    listenUserAnswers[currentListenIndex] = {
        word: word.chinese,
        userInput: userInput,
        correct: isCorrect,
        pinyin: word.pinyin,
        audioUrl: word.audioUrl
    };
    if (currentListenIndex < currentListenWords.length - 1) {
        currentListenIndex++;
        showCurrentListenWord();
    } else {
        showListenResults();
    }
});

document.getElementById('prev-listen-word').addEventListener('click', function() {
    if (currentListenIndex > 0) {
        currentListenIndex--;
        showCurrentListenWord();
    }
});

function showListenResults() {
    let resultHTML = '';
    const wrongAnswers = listenUserAnswers.filter(a => !a.correct);
    if (wrongAnswers.length === 0) {
        resultHTML = '<p style="text-align: center;">完成！全部正确。</p>';
    } else {
        resultHTML = '<p>错误的词：</p><ul>';
        wrongAnswers.forEach(a => {
            resultHTML += `<li>正确: ${a.word} | <span style="font-family: 'Shalimar'; font-size: 26px;">${a.pinyin}</span> | <span class="play-icon" onclick="playAudio('${a.audioUrl}')">🔊</span><br>您的输入: <span style="color: red;">${a.userInput}</span></li>`;
        });
        resultHTML += '</ul>';
    }
    // Update modal content
    document.getElementById('listen-vocab-content').innerHTML = resultHTML;
    // Hide input
    document.querySelector('.input-section').style.display = 'none';
    document.getElementById('prev-listen-word').style.display = 'none';
    document.getElementById('next-listen-word').style.display = 'none';
    // Change close button
    document.getElementById('close-listen-modal').textContent = '关闭';
    listenResultShown = true;
}

function playAudio(url) {
    const audio = new Audio(url);
    audio.play();
}

document.getElementById('close-listen-modal').addEventListener('click', function() {
    if (listenResultShown) {
        // Close and reload
        document.getElementById('listen-vocab-modal').style.display = 'none';
        document.getElementById('vocab-list').style.display = 'block';
        // Show search and filter
        document.querySelector('.search-filter-row').style.display = 'flex';
        document.querySelector('.menu-container').style.display = 'block';
        // Enable menu button
        document.getElementById('menu-button').style.pointerEvents = 'auto';
        document.getElementById('menu-button').style.opacity = '1';
        document.getElementById('spinner').style.display = 'block';
        location.reload();
    } else if (currentListenIndex === currentListenWords.length - 1) {
        // Save current answer if not saved
        if (!listenUserAnswers[currentListenIndex]) {
            const userInput = document.getElementById('user-chinese-input').value.trim();
            const word = currentListenWords[currentListenIndex];
            const isCorrect = userInput === word.chinese;
            listenUserAnswers[currentListenIndex] = {
                word: word.chinese,
                userInput: userInput,
                correct: isCorrect,
                pinyin: word.pinyin,
                audioUrl: word.audioUrl
            };
        }
        // Check if all answers are provided
        let allAnswered = true;
        for (let i = 0; i < currentListenWords.length; i++) {
            if (!listenUserAnswers[i]) {
                allAnswered = false;
                break;
            }
        }
        if (!allAnswered) {
            alert('请回答所有问题后再查看结果。');
            return;
        }
        // Check all answers
        const wrongAnswers = listenUserAnswers.filter(a => !a.correct);
        let resultHTML = '';
        if (wrongAnswers.length === 0) {
            resultHTML = '<p style="text-align: center;">完成！全部正确。</p>';
        } else {
            resultHTML = '<p>错误的词：</p><ul>';
            wrongAnswers.forEach(a => {
                resultHTML += `<li>正确: ${a.word} | <span style="font-family: 'Shalimar'; font-size: 26px;">${a.pinyin}</span> | <span class="play-icon" onclick="playAudio('${a.audioUrl}')">🔊</span><br>您的输入: <span style="color: red;">${a.userInput}</span></li>`;
            });
            resultHTML += '</ul>';
        }
        // Update modal content
        document.getElementById('listen-vocab-content').innerHTML = resultHTML;
        // Hide input
        document.querySelector('.input-section').style.display = 'none';
        document.getElementById('prev-listen-word').style.display = 'none';
        document.getElementById('next-listen-word').style.display = 'none';
        // Change close button
        document.getElementById('close-listen-modal').textContent = '关闭';
        listenResultShown = true;
    } else {
        document.getElementById('listen-vocab-modal').style.display = 'none';
        document.getElementById('vocab-list').style.display = 'block';
        // Show search and filter
        document.querySelector('.search-filter-row').style.display = 'flex';
        document.querySelector('.menu-container').style.display = 'block';
        // Enable menu button
        document.getElementById('menu-button').style.pointerEvents = 'auto';
        document.getElementById('menu-button').style.opacity = '1';
        document.getElementById('spinner').style.display = 'block';
        location.reload();
    }
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
document.getElementById('close-quiz-form').addEventListener('click', function() {
    document.getElementById('quiz-settings-form').style.display = 'none';
    document.getElementById('quiz-settings-form-element').reset();
});

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