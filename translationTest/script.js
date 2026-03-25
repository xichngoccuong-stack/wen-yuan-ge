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
    let query = db.collection('vocabularies').orderBy('meaning');
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
item.innerHTML = `
    <label style="display: block; text-align: center; font-family: 'Shalimar', sans-serif; font-size: 28px;">${vocab.meaning}</label>
    <div style="text-align: center;">
        <input type="text" class="chinese-input" style="font-family: 'Ma Shan Zheng', sans-serif; font-size: 20px; width: auto; min-width: 150px; max-width: 400px; display: block; margin: 0 auto; text-align: center;" data-correct="${vocab.chinese}">
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
submitBtn.style.bottom = '5px';
submitBtn.style.left = '50%';
submitBtn.style.transform = 'translateX(-50%)';
document.body.appendChild(submitBtn);

// Add event listeners
document.getElementById('submit-btn').addEventListener('click', checkResults);
}

function checkResults() {
    // Check if all inputs are filled
    const allInputs = document.querySelectorAll('.chinese-input');
    let hasEmpty = false;
    allInputs.forEach(input => {
        if (input.value.trim() === '') {
            hasEmpty = true;
        }
    });
    if (hasEmpty) {
        const notification = document.createElement('div');
        notification.textContent = '请先填写所有答案。';
        notification.style.position = 'fixed';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.background = 'rgba(0,0,0,0.8)';
        notification.style.color = 'white';
        notification.style.padding = '10px';
        notification.style.borderRadius = '5px';
        notification.style.fontSize = '18px';
        notification.style.fontFamily = 'Ma Shan Zheng, sans-serif';
        notification.style.zIndex = '300';
        document.body.appendChild(notification);
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 1000);
        return;
    }

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
            input.style.color = 'red';
            // Update label to show Chinese and pinyin
            label.innerHTML = '<span style="font-family: \'Ma Shan Zheng\', sans-serif; font-size: 20px;">' + correct + '</span> | <span style="font-family: \'Shalimar\', sans-serif; font-size: 28px;">' + pinyin + '</span>' + ' |';
            incorrectCount++;
        }
    });
    if (incorrectCount === 0) {
        // Show notification for 1 second then open modal
        const notification = document.createElement('div');
        notification.textContent = '全部答案都正确！';
        notification.style.position = 'fixed';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.background = 'rgba(0,0,0,0.8)';
        notification.style.color = 'white';
        notification.style.padding = '10px';
        notification.style.borderRadius = '5px';
        notification.style.fontSize = '18px';
        notification.style.fontFamily = 'Ma Shan Zheng, sans-serif';
        notification.style.zIndex = '300';
        document.body.appendChild(notification);
        setTimeout(() => {
            document.body.removeChild(notification);
            document.getElementById('confirm-modal').style.display = 'block';
        }, 1000);
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
    document.getElementById('loading-spinner').style.display = 'none';
}

// Start when page loads
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loading-spinner').style.display = 'block';
    init();
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('continue-btn').addEventListener('click', () => {
        document.getElementById('confirm-modal').style.display = 'none';
        window.location.reload();
    });
});