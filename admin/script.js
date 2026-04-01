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
        const auth = firebase.auth();
        const db = firebase.firestore();

        document.addEventListener('DOMContentLoaded', function() {
            const loginForm = document.getElementById('login-form');
            const adminContent = document.getElementById('admin-content');
            const searchForm = document.getElementById('search-form');
            const results = document.getElementById('results');
            const logoutBtn = document.getElementById('logout-btn');
            const notification = document.getElementById('notification');

            // Check auth state
            function checkAuthState() {
                const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                if (isLoggedIn) {
                    loginForm.style.display = 'none';
                    adminContent.style.display = 'block';
                } else {
                    loginForm.style.display = 'block';
                    adminContent.style.display = 'none';
                }
            }
            checkAuthState();

            // Login
            document.getElementById('login-btn').addEventListener('click', async () => {
                const userInput = document.getElementById('user').value;
                const password = document.getElementById('password').value;
                try {
                    const doc = await db.collection('admin').doc('account').get();
                    if (doc.exists) {
                        const data = doc.data();
                        if (data.user === userInput && data.password === password) {
                            localStorage.setItem('isLoggedIn', 'true');
                            checkAuthState();
                        } else {
                            alert('Login failed: Username or password is incorrect.');
                        }
                    } else {
                        alert('Login failed: Admin account does not exist.');
                    }
                } catch (error) {
                    alert('Login failed: ' + error.message);
                }
            });

            // Logout
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('isLoggedIn');
                checkAuthState();
            });

            // Password toggle
            const toggleBtn = document.getElementById('toggle-password');
            toggleBtn.addEventListener('click', () => {
                const passwordInput = document.getElementById('password');
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    toggleBtn.innerHTML = '🙈';
                } else {
                    passwordInput.type = 'password';
                    toggleBtn.innerHTML = '👁️';
                }
            });

            // Load vocabularies, settings, and testList
            let vocabularies = [];
            Promise.all([
                db.collection('vocabularies').get(),
                db.collection('quiz-settings').doc('settings').get(),
                db.collection('testList').get()
            ]).then(([querySnapshot, settingsDoc, testListSnapshot]) => {
                querySnapshot.forEach((doc) => {
                    vocabularies.push({ id: doc.id, ...doc.data() });
                });

                let includeGucu = true;
                if (settingsDoc.exists) {
                    const data = settingsDoc.data();
                    includeGucu = data.includeGucu !== false;
                }
                if (!includeGucu) {
                    vocabularies = vocabularies.filter(vocab => vocab.category !== '古词');
                }

                // Get chinese from testList
                const testListChineses = new Set();
                testListSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.chinese) {
                        testListChineses.add(data.chinese);
                    }
                });

                // Filter vocabularies not in testList
                vocabularies = vocabularies.filter(vocab => !testListChineses.has(vocab.chinese));

                // Display all vocabularies initially
                displayVocabularies(vocabularies);
                displayTestList(testListSnapshot);
            }).catch((error) => {
                console.error('Error loading vocabularies:', error);
                results.innerHTML = '<p>Error loading vocabularies.</p>';
            });

            function displayVocabularies(filteredVocabularies) {
                // Sort by timestamp descending
                filteredVocabularies.sort((a, b) => {
                    if (!a.timestamp || !b.timestamp) return 0;
                    return b.timestamp.toDate() - a.timestamp.toDate();
                });
                results.innerHTML = '';
                filteredVocabularies.forEach((data) => {
                    const item = document.createElement('div');
                    item.style.display = 'flex';
                    item.style.alignItems = 'center';
                    const addButton = document.createElement('button');
                    addButton.textContent = '+';
                    addButton.style.marginRight = '10px';
                    addButton.addEventListener('click', async () => {
                        try {
                            await db.collection('testList').add({
                                meaning: data.meaning,
                                chinese: data.chinese
                            });
                            notification.textContent = 'Added to testList!';
                            notification.style.display = 'block';
                            setTimeout(() => notification.style.display = 'none', 1000);
                            // Reload and display testList
                            const newSnapshot = await db.collection('testList').get();
                            displayTestList(newSnapshot);
                            // Also reload vocabularies to filter out the added one
                            const newVocabSnapshot = await db.collection('vocabularies').get();
                            let newVocabularies = [];
                            newVocabSnapshot.forEach((doc) => {
                                newVocabularies.push({ id: doc.id, ...doc.data() });
                            });
                            // Filter out from testList
                            const newTestListSnapshot = await db.collection('testList').get();
                            const newTestListChineses = new Set();
                            newTestListSnapshot.forEach((doc) => {
                                const data = doc.data();
                                if (data.chinese) {
                                    newTestListChineses.add(data.chinese);
                                }
                            });
                            newVocabularies = newVocabularies.filter(vocab => !newTestListChineses.has(vocab.chinese));
                            vocabularies = newVocabularies;
                            displayVocabularies(vocabularies);
                        } catch (error) {
                            alert('Error adding: ' + error.message);
                        }
                    });
                    item.appendChild(addButton);
                    const contentDiv = document.createElement('div');
                    contentDiv.style.flex = '1';
                    contentDiv.innerHTML = `
                        <strong>${data.chinese}</strong><br>
                        ${data.meaning}<br>
                        ${data.timestamp ? data.timestamp.toDate().toLocaleDateString() : 'N/A'}
                        <hr>
                    `;
                    item.appendChild(contentDiv);
                    results.appendChild(item);
                });
                if (filteredVocabularies.length === 0) {
                    results.innerHTML = '<p>No vocabulary found.</p>';
                }
            }

            function displayTestList(testListSnapshot) {
                const testListDiv = document.getElementById('testList');
                testListDiv.innerHTML = '';
                testListSnapshot.forEach((doc) => {
                    const data = doc.data();
                    const item = document.createElement('div');
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = '-';
                    removeBtn.style.marginRight = '5px';
                    removeBtn.addEventListener('click', async () => {
                        try {
                            await db.collection('testList').doc(doc.id).delete();
                            const newSnapshot = await db.collection('testList').get();
                            displayTestList(newSnapshot);
                            // Also reload vocabularies to add back the removed one
                            const newVocabSnapshot = await db.collection('vocabularies').get();
                            let newVocabularies = [];
                            newVocabSnapshot.forEach((doc) => {
                                newVocabularies.push({ id: doc.id, ...doc.data() });
                            });
                            // Filter out from testList
                            const newTestListSnapshot = await db.collection('testList').get();
                            const newTestListChineses = new Set();
                            newTestListSnapshot.forEach((doc) => {
                                const data = doc.data();
                                if (data.chinese) {
                                    newTestListChineses.add(data.chinese);
                                }
                            });
                            newVocabularies = newVocabularies.filter(vocab => !newTestListChineses.has(vocab.chinese));
                            vocabularies = newVocabularies;
                            displayVocabularies(vocabularies);
                        } catch (error) {
                            alert('Error removing: ' + error.message);
                        }
                    });
                    item.appendChild(removeBtn);
                    const content = document.createElement('span');
                    content.innerHTML = `${data.chinese}: ${data.meaning}`;
                    item.appendChild(content);
                    testListDiv.appendChild(item);
                });
                if (testListSnapshot.size === 0) {
                    testListDiv.innerHTML = '<p>No test list items.</p>';
                }
            }

            // Search
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const keyword = document.getElementById('keyword').value.trim();
                let startDate = document.getElementById('start-date').value;
                let endDate = document.getElementById('end-date').value;
                const noAudio = document.getElementById('no-audio').checked;
                const category = document.getElementById('category-filter').value;

                // If only one date is entered, set both to the same for single day search
                if (startDate && !endDate) {
                    endDate = startDate;
                } else if (!startDate && endDate) {
                    startDate = endDate;
                }

                // Validate dates
                if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
                    alert('Start date cannot be greater than end date.');
                    return;
                }

                let filtered = vocabularies;

                if (keyword) {
                    filtered = filtered.filter(vocab =>
                        vocab.chinese.toLowerCase().includes(keyword.toLowerCase()) ||
                        (vocab.hanviet && vocab.hanviet.toLowerCase().includes(keyword.toLowerCase())) ||
                        vocab.meaning.toLowerCase().includes(keyword.toLowerCase()) ||
                        vocab.pinyin.toLowerCase().includes(keyword.toLowerCase())
                    );
                }

                if (startDate || endDate) {
                    filtered = filtered.filter(vocab => {
                        if (!vocab.timestamp) return false;
                        const vocabDate = new Date(vocab.timestamp.toDate().toDateString());
                        const start = startDate ? new Date(new Date(startDate).toDateString()) : null;
                        const end = endDate ? new Date(new Date(endDate).toDateString()) : null;
                        if (start && vocabDate < start) return false;
                        if (end && vocabDate > end) return false;
                        return true;
                    });
                }

                if (noAudio) {
                    filtered = filtered.filter(vocab => !vocab.audioUrl || vocab.audioUrl === '');
                }

                if (category) {
                    filtered = filtered.filter(vocab => vocab.category === category);
                }

                displayVocabularies(filtered);
            });
        });