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
    document.getElementById('loading-spinner').style.display = 'block';
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

    // Determine numWords
    let numWords;
    if (settings.numWords && !isNaN(parseInt(settings.numWords)) && parseInt(settings.numWords) > 0) {
        numWords = Math.min(parseInt(settings.numWords), vocabularies.length);
    } else {
        numWords = vocabularies.length;
    }

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
        itemDiv.style.border = '1px solid white';
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
            button.style.border = '1px solid white';
            button.style.borderRadius = '5px';
            button.addEventListener('click', () => {
                // Reset all buttons to default
                itemDiv.querySelectorAll('.option-btn').forEach(btn => {
                    btn.style.background = 'transparent';
                    btn.style.color = 'white';
                    btn.disabled = false;
                });
                // Highlight selected
                button.style.background = 'linear-gradient(45deg, green, black)';
                button.style.color = 'white';
                itemDiv.selectedOption = option;
                itemDiv.selectedButton = button;
            });
            itemDiv.appendChild(button);
        });
    });

    // Create result button after generating quiz
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
        const allItems = document.querySelectorAll('.quiz-question');
        let hasUnselected = false;
        allItems.forEach(item => {
            if (!item.selectedOption) {
                hasUnselected = true;
            }
        });
        if (hasUnselected) {
            document.getElementById('notification').innerHTML = '请先选择所有答案。';
            document.getElementById('notification').style.display = 'block';
            setTimeout(() => {
                document.getElementById('notification').style.display = 'none';
            }, 1000);
            return;
        }
        let allCorrect = true;
        allItems.forEach(item => {
            const selected = item.selectedOption;
            const correct = item.vocab.meaning;
            if (selected !== correct) {
                allCorrect = false;
                // Highlight wrong
                if (item.selectedButton) {
                    item.selectedButton.style.background = 'linear-gradient(45deg, red, black)';
                    item.selectedButton.style.color = 'white';
                }
                // Highlight correct
                const correctBtn = Array.from(item.querySelectorAll('.option-btn')).find(btn => btn.textContent === correct);
                if (correctBtn) {
                    correctBtn.style.background = 'linear-gradient(45deg, green, black)';
                    correctBtn.style.color = 'white';
                }
                // Keep wrong item visible
                item.style.display = 'block';
            } else {
                // Hide correct item
                item.style.display = 'none';
            }
        });
        if (allCorrect) {
            document.getElementById('notification').innerHTML = '全部答案都正确！';
            document.getElementById('notification').style.display = 'block';
            setTimeout(() => {
                document.getElementById('notification').style.display = 'none';
                document.getElementById('result-modal').style.display = 'none';
                document.getElementById('confirm-modal').style.display = 'block';
            }, 1000);
        } else {
            document.getElementById('notification').innerHTML = '仍有答案不正确，请再查看。';
            document.getElementById('notification').style.display = 'block';
            setTimeout(() => {
                document.getElementById('notification').style.display = 'none';
                continueBtn.style.display = 'block';
                continueBtn.style.margin = '0 auto';
                homeBtn.style.display = 'none';
            }, 1000);
        }
        resultBtn.style.display = 'none';
        document.querySelector('.title-container h2').textContent = '选择的词语不正确:';
    });
    document.getElementById('reading-test').insertAdjacentElement('afterend', resultBtn);

    // Create continue and home buttons
    const continueBtn = document.createElement('button');
    continueBtn.textContent = '继续';
    continueBtn.className = 'result-btn';
    continueBtn.style.fontSize = '20px';
    continueBtn.style.fontFamily = "'Ma Shan Zheng', sans-serif";
    continueBtn.style.color = 'white';
    continueBtn.style.background = 'linear-gradient(45deg, green, black)';
    continueBtn.style.border = 'none';
    continueBtn.style.padding = '10px 20px';
    continueBtn.style.position = 'fixed';
    continueBtn.style.bottom = '5px';
    continueBtn.style.left = '45%';
    continueBtn.style.zIndex = '1000';
    continueBtn.style.display = 'none';
    continueBtn.addEventListener('click', () => location.reload());

    const homeBtn = document.createElement('button');
    homeBtn.textContent = '返回首页';
    homeBtn.className = 'result-btn';
    homeBtn.style.fontSize = '20px';
    homeBtn.style.fontFamily = "'Ma Shan Zheng', sans-serif";
    homeBtn.style.color = 'white';
    homeBtn.style.background = 'linear-gradient(45deg, blue, black)';
    homeBtn.style.border = 'none';
    homeBtn.style.padding = '10px 20px';
    homeBtn.style.position = 'fixed';
    homeBtn.style.bottom = '5px';
    homeBtn.style.left = '51%';
    homeBtn.style.zIndex = '1000';
    homeBtn.style.display = 'none';
    homeBtn.addEventListener('click', () => window.location.href = '../index.html');

    document.getElementById('reading-test').insertAdjacentElement('afterend', continueBtn);
    document.getElementById('reading-test').insertAdjacentElement('afterend', homeBtn);

    // Check if there are vocabularies to display
    if (selectedVocabs.length === 0) {
        // No vocabularies, hide spinner, hide result button, hide title
        document.getElementById('loading-spinner').style.display = 'none';
        resultBtn.style.display = 'none';
        document.querySelector('.title-container').style.display = 'none';
        // Disable modal buttons
        document.getElementById('close-modal').disabled = true;
        document.getElementById('continue-btn').disabled = true;
        document.getElementById('home-btn').disabled = true;
        document.getElementById('close-modal').style.opacity = '0.5';
        document.getElementById('continue-btn').style.opacity = '0.5';
        document.getElementById('home-btn').style.opacity = '0.5';
    } else {
        // Have vocabularies, hide spinner and enable functions
        document.getElementById('loading-spinner').style.display = 'none';
        resultBtn.disabled = false;
        resultBtn.style.opacity = '1';
        document.querySelector('.title-container').style.display = 'block';
        // Enable modal buttons
        document.getElementById('close-modal').disabled = false;
        document.getElementById('continue-btn').disabled = false;
        document.getElementById('home-btn').disabled = false;
        document.getElementById('close-modal').style.opacity = '1';
        document.getElementById('continue-btn').style.opacity = '1';
        document.getElementById('home-btn').style.opacity = '1';
    }
    document.getElementById('video').style.display = 'block';
});


function showModal(text) {
    document.getElementById('modal-text').textContent = text;
    document.getElementById('result-modal').style.display = 'block';
}

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('result-modal').style.display = 'none';
});

document.getElementById('continue-btn').addEventListener('click', () => {
    location.reload();
});

document.getElementById('home-btn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

if (document.getElementById('home-header-btn')) document.getElementById('home-header-btn').addEventListener('click', () => {
    window.location.href = '../index.html';
});
