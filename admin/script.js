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

            // Load vocabularies and settings
            let vocabularies = [];
            Promise.all([
                db.collection('vocabularies').get(),
                db.collection('quiz-settings').doc('settings').get()
            ]).then(([querySnapshot, settingsDoc]) => {
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

                // Display all vocabularies initially
                displayVocabularies(vocabularies);
            }).catch((error) => {
                console.error('Error loading vocabularies:', error);
                results.innerHTML = '<p>Error loading vocabularies.</p>';
            });

            function displayVocabularies(filteredVocabularies) {
                results.innerHTML = '';
                filteredVocabularies.forEach((data) => {
                    const item = document.createElement('div');
                    item.innerHTML = `
                        <div><strong>${data.chinese}</strong></div>
                        <div>Meaning: ${data.meaning}</div>
                        <div>Pinyin: ${data.pinyin}</div>
                        ${data.hanviet ? `<div>Hanviet: ${data.hanviet}</div>` : ''}
                        <div>Date created: ${data.createdAt ? data.createdAt.toDate().toLocaleDateString() : 'N/A'}</div>
                        <hr>
                    `;
                    results.appendChild(item);
                });
                if (filteredVocabularies.length === 0) {
                    results.innerHTML = '<p>No vocabulary found.</p>';
                }
            }

            // Search
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const keyword = document.getElementById('keyword').value.trim();
                const startDate = document.getElementById('start-date').value;
                const endDate = document.getElementById('end-date').value;

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
                        if (!vocab.createdAt) return false;
                        const date = vocab.createdAt.toDate();
                        const start = startDate ? new Date(startDate) : null;
                        const end = endDate ? new Date(endDate) : null;
                        if (start && date < start) return false;
                        if (end && date > end) return false;
                        return true;
                    });
                }

                displayVocabularies(filtered);
            });
        });