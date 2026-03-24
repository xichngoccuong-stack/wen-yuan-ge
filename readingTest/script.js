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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

window.addEventListener('load', async () => {
    // Load quiz settings
    const settingsDoc = await db.collection('quiz-settings').doc('settings').get();
    const settings = settingsDoc.data() || {};
    const category = settings.category || '全部';

    // Load vocabularies
    let query = db.collection('vocabularies');
    if (category !== '全部') {
        query = query.where('category', '==', category);
    }
    const vocabSnapshot = await query.get();
    const vocabularies = vocabSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Vocabularies count:', vocabularies.length);
    console.log('Category:', category);

    // Determine numWords
    let numWords;
    if (settings.numWords && !isNaN(parseInt(settings.numWords))) {
        numWords = Math.min(parseInt(settings.numWords), vocabularies.length);
    } else {
        numWords = vocabularies.length;
    }
    console.log('NumWords:', numWords);

    // Random select numWords
    const shuffled = vocabularies.sort(() => 0.5 - Math.random());
    const selectedVocabs = shuffled.slice(0, numWords);

    // Generate quiz
    selectedVocabs.forEach((vocab, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'quiz-question';
        itemDiv.vocab = vocab;
        itemDiv.style.padding = '10px';
        itemDiv.style.background = 'rgba(0,0,0,0.3)';
        itemDiv.style.border = '1px solid rgba(255,255,255,0.2)';
        itemDiv.style.borderRadius = '5px';
        itemDiv.style.textAlign = 'left';
        itemDiv.style.wordWrap = 'break-word';
        itemDiv.style.margin = '0';
        const h3 = document.createElement('h3');
        h3.textContent = vocab.chinese;
        h3.style.textAlign = 'center';
        itemDiv.appendChild(h3);
        document.getElementById('reading-test').appendChild(itemDiv);

        // Options: 1 correct + 3 random wrong
        const options = [vocab.meaning];
        const wrongOptions = vocabularies.filter(v => v.id !== vocab.id).map(v => v.meaning);
        const shuffledWrong = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 3);
        options.push(...shuffledWrong);

        // Shuffle options
        const shuffledOptions = options.sort(() => 0.5 - Math.random());

        shuffledOptions.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.className = 'option-btn';
            button.style.fontFamily = "'Shalimar', cursive";
            button.style.fontSize = '24px';
            button.style.width = '45%';
            button.style.margin = '2%';
            button.style.background = 'transparent';
            button.style.color = 'white';
            button.addEventListener('click', () => {
                // Highlight selected
                button.style.background = 'linear-gradient(45deg, green, black)';
                button.style.color = 'white';
                itemDiv.selectedOption = option;
                itemDiv.selectedButton = button;
                // Disable other buttons in this item
                itemDiv.querySelectorAll('.option-btn').forEach(btn => {
                    if (btn !== button) btn.disabled = true;
                });
            });
            itemDiv.appendChild(button);
        });
    });
});

const resultBtn = document.createElement('button');
resultBtn.textContent = '查看结果';
resultBtn.className = 'result-btn';
resultBtn.style.fontSize = '20px';
resultBtn.style.fontFamily = "'Ma Shan Zheng', sans-serif";
resultBtn.style.color = 'white';
resultBtn.style.background = 'linear-gradient(45deg, red, black)';
resultBtn.style.border = 'none';
resultBtn.style.padding = '10px 20px';
resultBtn.style.position = 'fixed';
resultBtn.style.bottom = '5px';
resultBtn.style.left = '50%';
resultBtn.style.transform = 'translateX(-50%)';
resultBtn.style.zIndex = '1000';
resultBtn.addEventListener('click', () => {
    let allCorrect = true;
    const allItems = document.querySelectorAll('.quiz-question');
    allItems.forEach(item => {
        const selected = item.selectedOption;
        const correct = item.vocab.meaning;
        if (selected !== correct) {
            allCorrect = false;
            // Highlight wrong
            if (item.selectedButton) item.selectedButton.style.background = 'red';
            // Highlight correct
            const correctBtn = Array.from(item.querySelectorAll('.option-btn')).find(btn => btn.textContent === correct);
            if (correctBtn) correctBtn.style.background = 'green';
            // Show modal
            showModal(`Wrong for "${item.vocab.chinese}". Correct is: ${correct}`);
        } else {
            if (item.selectedButton) item.selectedButton.style.background = 'green';
        }
    });
    if (allCorrect) {
        showModal('All correct!');
    }
});
document.getElementById('reading-test').insertAdjacentElement('afterend', resultBtn);

// Hide loading spinner
document.getElementById('loading-spinner').style.display = 'none';

function showModal(text) {
    document.getElementById('modal-text').textContent = text;
    document.getElementById('result-modal').style.display = 'block';
}

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('result-modal').style.display = 'none';
});
