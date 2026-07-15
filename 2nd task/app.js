/**
 * QuizSync - Interactive SPA logic
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // INITIAL MOCK DATA & CONFIG
    // ==========================================================================
    const DEFAULT_QUIZZES = [
        {
            id: "default-web-dev",
            title: "Web Development Basics",
            category: "Web Development",
            description: "Test your understanding of core concepts in HTML5, CSS3, and JavaScript syntax.",
            creator: "SystemAdmin",
            questions: [
                {
                    question: "Which HTML5 tag is used to embed visual media content natively in a page?",
                    options: ["<media>", "<source>", "<video>", "<embed>"],
                    correctIndex: 2
                },
                {
                    question: "What CSS property defines the layout spacing between structural grid cells?",
                    options: ["grid-gap (or gap)", "grid-padding", "grid-margin", "cell-spacing"],
                    correctIndex: 0
                },
                {
                    question: "Which JS keyword declares a block-scoped variable that cannot be reassigned?",
                    options: ["var", "let", "const", "static"],
                    correctIndex: 2
                },
                {
                    question: "What does the DOM stand for in client-side programming?",
                    options: [
                        "Data Object Model",
                        "Document Object Model",
                        "Digital Operation Module",
                        "Dynamic Page Method"
                    ],
                    correctIndex: 1
                }
            ]
        },
        {
            id: "default-sci-fi",
            title: "General Space Trivia",
            category: "Science / Technology",
            description: "Explore the solar system and review important historical milestones in astrophysics.",
            creator: "AstroExplorer",
            questions: [
                {
                    question: "Which planet is commonly referred to as the Red Planet?",
                    options: ["Venus", "Mars", "Jupiter", "Saturn"],
                    correctIndex: 1
                },
                {
                    question: "What is the approximate speed of electromagnetic light waves in a vacuum?",
                    options: ["150,000 km/s", "300,000 km/s", "500,000 km/s", "1,000,000 km/s"],
                    correctIndex: 1
                },
                {
                    question: "Who was the first human to orbit Earth in space?",
                    options: ["Neil Armstrong", "Yuri Gagarin", "Buzz Aldrin", "John Glenn"],
                    correctIndex: 1
                }
            ]
        }
    ];

    // Initialize LocalStorage if empty
    if (!localStorage.getItem('quizsync_quizzes')) {
        localStorage.setItem('quizsync_quizzes', JSON.stringify(DEFAULT_QUIZZES));
    }
    if (!localStorage.getItem('quizsync_users')) {
        // Core developer account
        localStorage.setItem('quizsync_users', JSON.stringify([{ username: "admin", password: "password" }]));
    }

    // ==========================================================================
    // SELECTION OF ELEMENTS
    // ==========================================================================
    const navMenu = document.getElementById('navMenu');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelectorAll('.nav-link');
    const userWidget = document.getElementById('userWidget');
    
    // Auth elements
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Creator elements
    const quizCreatorForm = document.getElementById('quizCreatorForm');
    const questionsBuilderContainer = document.getElementById('questionsBuilderContainer');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    
    // Play elements
    const playQuizName = document.getElementById('playQuizName');
    const playQuestionCounter = document.getElementById('playQuestionCounter');
    const playProgressBar = document.getElementById('playProgressBar');
    const playQuestionText = document.getElementById('playQuestionText');
    const playOptionsContainer = document.getElementById('playOptionsContainer');
    const playPrevBtn = document.getElementById('playPrevBtn');
    const playNextBtn = document.getElementById('playNextBtn');

    // Results elements
    const resultsPercentage = document.getElementById('resultsPercentage');
    const resultsFraction = document.getElementById('resultsFraction');
    const resultsFeedbackText = document.getElementById('resultsFeedbackText');
    const resultsCorrectionList = document.getElementById('resultsCorrectionList');

    // ==========================================================================
    // SYSTEM STATE
    // ==========================================================================
    let currentUser = JSON.parse(sessionStorage.getItem('quizsync_logged_user')) || null;
    let activeQuizPlaying = null;
    let quizPlayState = {
        currentIndex: 0,
        answers: [] // indices selected by user
    };

    // ==========================================================================
    // ROUTING / VIEW MANAGER
    // ==========================================================================
    const renderUserWidget = () => {
        if (currentUser) {
            userWidget.innerHTML = `
                <div class="user-profile-widget">
                    <span class="user-avatar-text">${currentUser.username.substring(0,2).toUpperCase()}</span>
                    <span class="user-name-widget">${currentUser.username}</span>
                    <button class="logout-btn" id="logoutBtn">Logout</button>
                </div>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => {
                sessionStorage.removeItem('quizsync_logged_user');
                currentUser = null;
                renderUserWidget();
                window.location.hash = '#/home';
            });
        } else {
            userWidget.innerHTML = `
                <a href="#/auth" class="btn btn-primary btn-small" id="headerAuthBtn">Login / Register</a>
            `;
        }
    };

    const routes = {
        '#/home': 'view-home',
        '#/auth': 'view-auth',
        '#/listing': 'view-listing',
        '#/create': 'view-create',
        '#/take': 'view-take',
        '#/results': 'view-results'
    };

    const navigateToView = () => {
        const hash = window.location.hash || '#/home';
        const targetViewId = routes[hash] || 'view-home';

        // 1. Auth Guard for Creator screen
        if (hash === '#/create' && !currentUser) {
            alert('Access Denied: You must be logged in to create custom quizzes!');
            window.location.hash = '#/auth';
            return;
        }

        // 2. State Guard for Play screen
        if (hash === '#/take' && !activeQuizPlaying) {
            window.location.hash = '#/listing';
            return;
        }

        // 3. Toggle View Active panels
        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        const targetPanel = document.getElementById(targetViewId);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }

        // 4. Update Header Nav links active states
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            }
        });

        // 5. Trigger screen loaders
        if (hash === '#/listing') {
            loadQuizzesListing();
        } else if (hash === '#/create') {
            resetQuizCreatorForm();
        } else if (hash === '#/take') {
            renderQuizPlayStep();
        }
    };

    window.addEventListener('hashchange', navigateToView);
    // Initialize Widget & Route
    renderUserWidget();
    navigateToView();

    // Hamburger Mobile toggler
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // ==========================================================================
    // MOCK USER AUTH LOGIC
    // ==========================================================================
    // Switch tabs login/register
    tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });

    tabRegisterBtn.addEventListener('click', () => {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    // Login Submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('loginUser').value.trim();
        const passwordInput = document.getElementById('loginPass').value.trim();

        const registeredUsers = JSON.parse(localStorage.getItem('quizsync_users')) || [];
        const matchedUser = registeredUsers.find(u => u.username.toLowerCase() === usernameInput.toLowerCase() && u.password === passwordInput);

        if (matchedUser) {
            currentUser = { username: matchedUser.username };
            sessionStorage.setItem('quizsync_logged_user', JSON.stringify(currentUser));
            renderUserWidget();
            loginForm.reset();
            window.location.hash = '#/listing';
        } else {
            alert('Error: Invalid username or password verification failed.');
        }
    });

    // Registration Submission
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('registerUser').value.trim();
        const passwordInput = document.getElementById('registerPass').value.trim();

        const registeredUsers = JSON.parse(localStorage.getItem('quizsync_users')) || [];
        const isDuplicateName = registeredUsers.some(u => u.username.toLowerCase() === usernameInput.toLowerCase());

        if (isDuplicateName) {
            alert('Error: That username is already registered. Choose another one.');
            return;
        }

        const newUser = { username: usernameInput, password: passwordInput };
        registeredUsers.push(newUser);
        localStorage.setItem('quizsync_users', JSON.stringify(registeredUsers));

        currentUser = { username: usernameInput };
        sessionStorage.setItem('quizsync_logged_user', JSON.stringify(currentUser));
        renderUserWidget();
        registerForm.reset();
        
        // Go back to login tab defaults
        tabLoginBtn.click();
        
        alert('Welcome! Your account has been registered.');
        window.location.hash = '#/listing';
    });

    // ==========================================================================
    // BROWSE / LOAD LISTING LOGIC
    // ==========================================================================
    const loadQuizzesListing = () => {
        const quizzesGrid = document.getElementById('quizzesGrid');
        const quizzes = JSON.parse(localStorage.getItem('quizsync_quizzes')) || [];
        
        if (quizzes.length === 0) {
            quizzesGrid.innerHTML = `
                <div class="empty-list-message" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <p style="color: var(--color-text-muted);">No quizzes available. Be the first to create one!</p>
                </div>
            `;
            return;
        }

        quizzesGrid.innerHTML = '';
        quizzes.forEach((quiz) => {
            const card = document.createElement('article');
            card.className = 'quiz-card';
            card.innerHTML = `
                <div class="card-top">
                    <span class="card-category">${quiz.category}</span>
                    <span class="card-q-count">${quiz.questions.length} Questions</span>
                </div>
                <h3 class="card-title">${quiz.title}</h3>
                <p class="card-desc">${quiz.description}</p>
                <div class="card-bottom">
                    <span class="card-creator">Creator: ${quiz.creator}</span>
                    <button class="btn btn-primary btn-small select-quiz-btn" data-quiz-id="${quiz.id}">Start Quiz</button>
                </div>
            `;
            quizzesGrid.appendChild(card);
        });

        // Attach event triggers
        document.querySelectorAll('.select-quiz-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const quizId = btn.dataset.quizId;
                const selectQuiz = quizzes.find(q => q.id === quizId);
                if (selectQuiz) {
                    activeQuizPlaying = selectQuiz;
                    quizPlayState = {
                        currentIndex: 0,
                        answers: new Array(selectQuiz.questions.length).fill(null)
                    };
                    window.location.hash = '#/take';
                }
            });
        });
    };

    // ==========================================================================
    // QUIZ CREATOR (BUILDER) LOGIC
    // ==========================================================================
    let questionSlideCount = 0;

    const createQuestionCardHTML = (index) => {
        return `
            <div class="question-item-card" data-card-index="${index}">
                <div class="question-card-header">
                    <span class="question-index-label">Question #${index + 1}</span>
                    ${index > 0 ? `<button type="button" class="btn-danger-small delete-question-btn">Delete</button>` : ''}
                </div>
                
                <div class="form-group">
                    <label class="form-label">Question Statement</label>
                    <input type="text" placeholder="Enter question description..." required class="form-input builder-q-text">
                </div>

                <div class="options-builder-grid">
                    <!-- Option 1 -->
                    <div class="option-input-wrap">
                        <input type="radio" name="correct-idx-${index}" value="0" required class="option-radio" title="Mark Option 1 Correct">
                        <input type="text" placeholder="Option A" required class="option-inner-input builder-opt-text" data-opt-idx="0">
                    </div>
                    <!-- Option 2 -->
                    <div class="option-input-wrap">
                        <input type="radio" name="correct-idx-${index}" value="1" required class="option-radio" title="Mark Option 2 Correct">
                        <input type="text" placeholder="Option B" required class="option-inner-input builder-opt-text" data-opt-idx="1">
                    </div>
                    <!-- Option 3 -->
                    <div class="option-input-wrap">
                        <input type="radio" name="correct-idx-${index}" value="2" required class="option-radio" title="Mark Option 3 Correct">
                        <input type="text" placeholder="Option C" required class="option-inner-input builder-opt-text" data-opt-idx="2">
                    </div>
                    <!-- Option 4 -->
                    <div class="option-input-wrap">
                        <input type="radio" name="correct-idx-${index}" value="3" required class="option-radio" title="Mark Option 4 Correct">
                        <input type="text" placeholder="Option D" required class="option-inner-input builder-opt-text" data-opt-idx="3">
                    </div>
                </div>
            </div>
        `;
    };

    const appendQuestionBuilderCard = () => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = createQuestionCardHTML(questionSlideCount);
        const cardNode = tempDiv.firstElementChild;
        questionsBuilderContainer.appendChild(cardNode);
        
        // Attach delete trigger
        if (questionSlideCount > 0) {
            cardNode.querySelector('.delete-question-btn').addEventListener('click', () => {
                cardNode.remove();
                reindexQuestionBuilderCards();
            });
        }
        
        questionSlideCount++;
    };

    const reindexQuestionBuilderCards = () => {
        const cards = questionsBuilderContainer.querySelectorAll('.question-item-card');
        questionSlideCount = 0;
        cards.forEach((card, idx) => {
            card.dataset.cardIndex = idx;
            card.querySelector('.question-index-label').textContent = `Question #${idx + 1}`;
            
            const radios = card.querySelectorAll('.option-radio');
            radios.forEach(radio => {
                radio.name = `correct-idx-${idx}`;
            });
            
            questionSlideCount++;
        });
    };

    const resetQuizCreatorForm = () => {
        quizCreatorForm.reset();
        questionsBuilderContainer.innerHTML = '';
        questionSlideCount = 0;
        appendQuestionBuilderCard(); // add first template card automatically
    };

    // Add Slide click trigger
    addQuestionBtn.addEventListener('click', () => {
        appendQuestionBuilderCard();
    });

    // Form Submission (Save New Quiz)
    quizCreatorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('quizTitle').value.trim();
        const category = document.getElementById('quizCategory').value;
        const description = document.getElementById('quizDesc').value.trim();
        
        const cards = questionsBuilderContainer.querySelectorAll('.question-item-card');
        const questionsList = [];

        let isValidForm = true;
        cards.forEach((card, idx) => {
            const questionText = card.querySelector('.builder-q-text').value.trim();
            const optionInputs = card.querySelectorAll('.builder-opt-text');
            const options = [];
            
            optionInputs.forEach(input => {
                options.push(input.value.trim());
            });

            // Find marked correct index
            const checkedRadio = card.querySelector('.option-radio:checked');
            if (!checkedRadio) {
                alert(`Please select a correct answer option for Question #${idx + 1}.`);
                isValidForm = false;
                return;
            }
            const correctIndex = parseInt(checkedRadio.value);

            questionsList.push({
                question: questionText,
                options: options,
                correctIndex: correctIndex
            });
        });

        if (!isValidForm) return;

        if (questionsList.length === 0) {
            alert('Error: You must add at least one question to the quiz.');
            return;
        }

        const newQuiz = {
            id: 'quiz-' + Date.now(),
            title: title,
            category: category,
            description: description,
            creator: currentUser ? currentUser.username : "Anonymous",
            questions: questionsList
        };

        const quizzes = JSON.parse(localStorage.getItem('quizsync_quizzes')) || [];
        quizzes.push(newQuiz);
        localStorage.setItem('quizsync_quizzes', JSON.stringify(quizzes));

        alert('Success! Your custom quiz has been created and published.');
        window.location.hash = '#/listing';
    });

    // ==========================================================================
    // QUIZ PLAY (TAKING) STEPPER LOGIC
    // ==========================================================================
    const renderQuizPlayStep = () => {
        if (!activeQuizPlaying) return;

        const currentQ = activeQuizPlaying.questions[quizPlayState.currentIndex];
        
        // Headers
        playQuizName.textContent = activeQuizPlaying.title;
        playQuestionCounter.textContent = `Question ${quizPlayState.currentIndex + 1} of ${activeQuizPlaying.questions.length}`;
        
        // Progress Fill width
        const progressPercentage = ((quizPlayState.currentIndex) / activeQuizPlaying.questions.length) * 100;
        playProgressBar.style.width = `${progressPercentage}%`;

        // Body Info
        playQuestionText.textContent = currentQ.question;
        
        playOptionsContainer.innerHTML = '';
        currentQ.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'play-option-btn';
            btn.textContent = opt;
            
            // Highlight saved chosen option
            if (quizPlayState.answers[quizPlayState.currentIndex] === idx) {
                btn.classList.add('selected');
            }

            btn.addEventListener('click', () => {
                // Remove selected highlighting from other options
                playOptionsContainer.querySelectorAll('.play-option-btn').forEach(b => b.classList.remove('selected'));
                
                // Add select status
                btn.classList.add('selected');
                quizPlayState.answers[quizPlayState.currentIndex] = idx;
            });

            playOptionsContainer.appendChild(btn);
        });

        // Footer buttons state
        // Prev button
        if (quizPlayState.currentIndex === 0) {
            playPrevBtn.disabled = true;
        } else {
            playPrevBtn.disabled = false;
        }

        // Next button label text
        if (quizPlayState.currentIndex === activeQuizPlaying.questions.length - 1) {
            playNextBtn.textContent = "Finish Quiz";
        } else {
            playNextBtn.textContent = "Next Question";
        }
    };

    // Play Navigation Clicks
    playPrevBtn.addEventListener('click', () => {
        if (quizPlayState.currentIndex > 0) {
            quizPlayState.currentIndex--;
            renderQuizPlayStep();
        }
    });

    playNextBtn.addEventListener('click', () => {
        // Enforce answer validation before advancing
        if (quizPlayState.answers[quizPlayState.currentIndex] === null) {
            alert('Please select an option to proceed!');
            return;
        }

        if (quizPlayState.currentIndex === activeQuizPlaying.questions.length - 1) {
            // End of Quiz: calculate final statistics and route
            calculateQuizResults();
        } else {
            // Advance slide
            quizPlayState.currentIndex++;
            renderQuizPlayStep();
        }
    });

    // ==========================================================================
    // QUIZ RESULTS COMPUTATION
    // ==========================================================================
    const calculateQuizResults = () => {
        let correctCount = 0;
        resultsCorrectionList.innerHTML = '';

        activeQuizPlaying.questions.forEach((q, idx) => {
            const chosenIdx = quizPlayState.answers[idx];
            const isCorrect = chosenIdx === q.correctIndex;
            
            if (isCorrect) {
                correctCount++;
            }

            const correctionItem = document.createElement('div');
            correctionItem.className = `correction-item ${isCorrect ? 'correct' : 'incorrect'}`;
            
            const userChoiceText = chosenIdx !== null ? q.options[chosenIdx] : 'No answer selected';
            const realCorrectText = q.options[q.correctIndex];

            correctionItem.innerHTML = `
                <div class="correction-q">${idx + 1}. ${q.question}</div>
                <div class="correction-ans user-val ${isCorrect ? 'correct-val' : 'incorrect-val'}">
                    <strong>Your Choice:</strong> ${userChoiceText}
                </div>
                ${!isCorrect ? `
                <div class="correction-ans real-val">
                    <strong>Correct Answer:</strong> ${realCorrectText}
                </div>` : ''}
            `;
            resultsCorrectionList.appendChild(correctionItem);
        });

        const percentScore = Math.round((correctCount / activeQuizPlaying.questions.length) * 100);
        
        // Render Score Board
        resultsPercentage.textContent = `${percentScore}%`;
        resultsFraction.textContent = `Score: ${correctCount} / ${activeQuizPlaying.questions.length}`;

        // Feedback statement
        if (percentScore === 100) {
            resultsFeedbackText.textContent = "Perfect score! Outstanding work, you know your topics thoroughly.";
        } else if (percentScore >= 70) {
            resultsFeedbackText.textContent = "Great job! You passed with high marks.";
        } else {
            resultsFeedbackText.textContent = "Good try, but there's room for improvement. Review correction sheet choices.";
        }

        // Route to screen
        window.location.hash = '#/results';
    };
});
