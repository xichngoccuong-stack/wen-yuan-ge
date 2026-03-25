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

let quizSettings = { numWords: 10, category: '全部' };
let vocabularies = [];
let selectedVocabularies = [];

function convertNumberToChineseSimple(num) {
    const units = ['', '十', '百', '千', '万'];
    const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    if (num === 0) return '零';
    let result = '';
    let unitIndex = 0;
    while (num > 0) {
        const digit = num % 10;
        if (digit !== 0) {
            result = digits[digit] + units[unitIndex] + result;
        } else if (result !== '') {
            result = '零' + result;
        }
        num = Math.floor(num / 10);
        unitIndex++;
    }
    return result.replace(/^一十/, '十'); // Handle 10 as 十 instead of 一十
}

async function loadQuizSettings() {
    const docRef = db.collection('quiz-settings').doc('settings');
    const doc = await docRef.get();
    if (doc.exists) {
        const data = doc.data();
        quizSettings.numWords = data.numWords || null;
        quizSettings.category = data.category || '全部';
    }
}

async function loadVocabularies() {
    let query = db.collection('vocabularies').orderBy('hanviet');
    const querySnapshot = await query.get();
    vocabularies = [];
    querySnapshot.forEach((doc) => {
        vocabularies.push({ id: doc.id, ...doc.data() });
    });

    // Filter by category
    if (quizSettings.category !== '全部') {
        vocabularies = vocabularies.filter(vocab => vocab.category === quizSettings.category);
    }

    // Shuffle and take numWords
    const shuffled = vocabularies.sort(() => 0.5 - Math.random());
    if (quizSettings.numWords) {
        selectedVocabularies = shuffled.slice(0, quizSettings.numWords);
    } else {
        selectedVocabularies = shuffled;
    }
}

function displayTest() {
const container = document.querySelector('#listening-test');
container.innerHTML = '';
selectedVocabularies.forEach((vocab, index) => {
const item = document.createElement('div');
item.className = 'quiz-question';
const questionNumber = convertNumberToChineseSimple(index + 1);
item.innerHTML = `
    <label style="display: block; text-align: center;">第${questionNumber}题</label>
    <div style="text-align: center;">
        <button class="play-btn" style="margin-top: -10px;" data-audio="${vocab.audioUrl || ''}" data-chinese="${vocab.chinese}">🔊</button>
        <input type="text" class="chinese-input" style="font-family: 'Ma Shan Zheng', sans-serif; font-size: 20px;" data-correct="${vocab.chinese}">
    </div>
`;
item.setAttribute('data-pinyin', vocab.pinyin);
container.appendChild(item);
});

// Add submit button
const submitBtn = document.createElement('button');
submitBtn.textContent = '查看结果';
submitBtn.id = 'submit-btn';
submitBtn.className = 'result-btn';
submitBtn.style.fontFamily = 'Ma Shan Zheng, sans-serif';
submitBtn.style.position = 'fixed';
submitBtn.style.bottom = '20px';
submitBtn.style.left = '50%';
submitBtn.style.transform = 'translateX(-50%)';
document.body.appendChild(submitBtn);

    // Add event listeners
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const audioUrl = this.getAttribute('data-audio');
            const chinese = this.getAttribute('data-chinese');
            if (audioUrl) {
                const audio = new Audio(audioUrl);
                audio.play();
            } else {
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(chinese);
                    utterance.lang = 'zh-CN';
                    speechSynthesis.speak(utterance);
                }
            }
        });
    });

    document.getElementById('submit-btn').addEventListener('click', checkResults);
}

function checkResults() {
    let incorrectCount = 0;
    const inputs = document.querySelectorAll('.chinese-input');
    inputs.forEach(input => {
        const correct = input.getAttribute('data-correct');
        const userInput = input.value.trim();
        const item = input.closest('.quiz-question');
        const label = item.querySelector('label');
        const pinyin = item.getAttribute('data-pinyin');
        if (userInput === correct) {
            item.style.display = 'none';
        } else {
            input.style.borderColor = 'red';
            input.style.backgroundColor = '#ffdddd';
            // Update label to show Chinese and pinyin
            label.innerHTML = correct + ' | <span style="font-family: \'Shalimar\', sans-serif; font-size: 28px;">' + pinyin + '</span>' + ' |';
            incorrectCount++;
        }
    });
    if (incorrectCount === 0) {
        document.getElementById('confirm-modal').style.display = 'block';
    }
    if (incorrectCount > 0) {
        const btn = document.getElementById('submit-btn');
        btn.textContent = '继续';
        btn.style.background = 'linear-gradient(to right, green, black)';
        btn.style.color = 'white';
        btn.removeEventListener('click', checkResults);
        btn.addEventListener('click', () => window.location.reload());
        document.getElementById('test-title').textContent = '输入错误的词:';
    }
}

async function init() {
    await loadQuizSettings();
    await loadVocabularies();
    displayTest();
}

// Start when page loads
document.addEventListener('DOMContentLoaded', init);

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('continue-btn').addEventListener('click', () => {
        document.getElementById('confirm-modal').style.display = 'none';
        window.location.reload();
    });
});