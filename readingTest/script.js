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
                if (option === vocab.meaning) {
                    button.style.background = 'green';
                    alert('Correct!');
                } else {
                    button.style.background = 'red';
                    alert('Wrong!');
                }
                // Disable all buttons
                itemDiv.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
            });
            itemDiv.appendChild(button);
        });
    });
});

// Hide loading spinner
document.getElementById('loading-spinner').style.display = 'none';