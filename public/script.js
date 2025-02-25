// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();

// Инициализация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD4WWJqbO16StdslNSnwg5vaLJKgS-_pOg",
    authDomain: "alkobot-7de63.firebaseapp.com",
    projectId: "alkobot-7de63",
    storageBucket: "alkobot-7de63.firebasestorage.app",
    messagingSenderId: "366065912279",
    appId: "1:366065912279:web:8613ff91d212360cff2392",
    measurementId: "G-0ZQJ008GSM",
    databaseURL: "https://alkobot-7de63-default-rtdb.europe-west1.firebasedatabase.app/"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Элементы DOM (добавим позже форму входа в HTML)
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const friendUsernameInput = document.getElementById('friendUsername');
const addFriendBtn = document.getElementById('addFriendBtn');
const friendsList = document.getElementById('friendsList');
const loginForm = document.getElementById('loginForm'); // Добавим в HTML
const logoutBtn = document.getElementById('logoutBtn'); // Добавим в HTML

// Скрываем основной контент до авторизации
function hideContent() {
    document.querySelector('.container').style.display = 'none';
}

function showContent() {
    document.querySelector('.container').style.display = 'block';
}

// Проверка авторизации
auth.onAuthStateChanged((user) => {
    if (user) {
        // Пользователь авторизован
        showContent();
        const userId = user.uid; // Используем UID пользователя Firebase

        // Хранение данных
        let startTime = localStorage.getItem(`startTime_${userId}`) || null;
        let friends = JSON.parse(localStorage.getItem(`friends_${userId}`)) || [];
        let timerInterval = null;

        function updateTimer() {
            if (!startTime) {
                timerDisplay.innerText = 'Нажми "Старт"!';
                timerDisplay.classList.remove('active');
                return;
            }
            const now = new Date();
            const start = new Date(startTime);
            const diff = now - start;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            timerDisplay.innerText = `${days} дней, ${hours} часов, ${minutes} минут, ${seconds} секунд`;
            timerDisplay.classList.add('active');

            database.ref(`users/${userId}`).set({
                startTime: startTime,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        }

        function startTimerInterval() {
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(updateTimer, 1000);
            updateTimer();
        }

        if (startTime) {
            startBtn.style.display = 'none';
            resetBtn.style.display = 'inline';
            startTimerInterval();
        }

        startBtn.addEventListener('click', () => {
            startTime = new Date().toISOString();
            localStorage.setItem(`startTime_${userId}`, startTime);
            startBtn.style.display = 'none';
            resetBtn.style.display = 'inline';
            startTimerInterval();
        });

        resetBtn.addEventListener('click', () => {
            startTime = null;
            clearInterval(timerInterval);
            timerInterval = null;
            localStorage.removeItem(`startTime_${userId}`);
            timerDisplay.innerText = 'Нажми "Старт"!';
            timerDisplay.classList.remove('active');
            startBtn.style.display = 'inline';
            resetBtn.style.display = 'none';

            database.ref(`users/${userId}`).remove();
        });

        function renderFriends() {
            friendsList.innerHTML = '';
            friends.forEach(friend => {
                const friendRef = database.ref(`users/${friend.id}`);
                friendRef.on('value', (snapshot) => {
                    const friendData = snapshot.val();
                    const li = document.createElement('li');
                    li.innerText = `${friend.username || `Друг ${friend.id}`}: ${friendData?.startTime ? calculateTime(friendData.startTime) : 'не начал'}`;
                    friendsList.appendChild(li);
                });
            });
        }
        renderFriends();

        function calculateTime(startTimeISO) {
            const start = new Date(startTimeISO);
            const now = new Date();
            const diff = now - start;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            return `${days} дней, ${hours} часов, ${minutes} минут, ${seconds} секунд`;
        }

        addFriendBtn.addEventListener('click', async () => {
            const username = friendUsernameInput.value.trim().replace('@', '');
            if (!username) return;

            try {
                const response = await fetch(`https://api.telegram.org/botYOUR_BOT_TOKEN/getChat?chat_id=@${username}`);
                const data = await response.json();
                if (data.ok) {
                    const friendId = data.result.id;
                    const friendRef = database.ref(`users/${friendId}`);
                    const snapshot = await friendRef.once('value');
                    if (!snapshot.exists()) {
                        alert('Друг не зарегистрирован! Пусть он зарегистрируется в приложении.');
                        return;
                    }
                    if (!friends.some(f => f.id === friendId)) {
                        friends.push({ id: friendId, username: `@${username}` });
                        localStorage.setItem(`friends_${userId}`, JSON.stringify(friends));
                        renderFriends();
                        friendUsernameInput.value = '';
                    }
                } else {
                    alert('Пользователь не найден или ник неверный!');
                }
            } catch (error) {
                alert('Ошибка при добавлении друга. Проверь ник и попробуй ещё раз.');
                console.error(error);
            }
        });

        // Анимация появления друзей
        friendsList.addEventListener('animationend', (e) => {
            if (e.animationName === 'fadeIn') {
                e.target.style.opacity = 1;
            }
        });

        // Кнопка выхода (logout)
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                hideContent();
                alert('Вы вышли из аккаунта. Пожалуйста, войдите снова.');
            }).catch((error) => {
                console.error("Ошибка выхода:", error);
            });
        });
    } else {
        // Пользователь не авторизован, показываем форму входа
        hideContent();
        // Здесь нужно добавить вызов функции показа формы входа
        showLoginForm();
    }
});

// Функция показа формы входа (нужно добавить в HTML и CSS)
function showLoginForm() {
    if (!document.getElementById('loginModal')) {
        const modal = document.createElement('div');
        modal.id = 'loginModal';
        modal.style = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #2d2d2d;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
            color: white;
        `;
        modal.innerHTML = `
            <h2>Вход в приложение</h2>
            <input type="email" id="emailInput" placeholder="Email" style="padding: 10px; margin: 10px 0; border-radius: 10px; border: 1px solid #555; background-color: #3a3a3a; color: white;">
            <input type="password" id="passwordInput" placeholder="Пароль" style="padding: 10px; margin: 10px 0; border-radius: 10px; border: 1px solid #555; background-color: #3a3a3a; color: white;">
            <button id="loginBtn" style="padding: 12px 24px; background-color: #00ff00; color: #1a1a1a; border: none; border-radius: 10px; cursor: pointer;">Войти</button>
            <button id="registerBtn" style="padding: 12px 24px; background-color: #00cc00; color: #1a1a1a; border: none; border-radius: 10px; cursor: pointer; margin-left: 10px;">Зарегистрироваться</button>
        `;
        document.body.appendChild(modal);

        document.getElementById('loginBtn').addEventListener('click', () => {
            const email = document.getElementById('emailInput').value;
            const password = document.getElementById('passwordInput').value;
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    hideContent();
                    showContent();
                })
                .catch((error) => {
                    alert('Ошибка входа: ' + error.message);
                });
        });

        document.getElementById('registerBtn').addEventListener('click', () => {
            const email = document.getElementById('emailInput').value;
            const password = document.getElementById('passwordInput').value;
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    hideContent();
                    showContent();
                    alert('Регистрация успешна! Теперь войдите.');
                })
                .catch((error) => {
                    alert('Ошибка регистрации: ' + error.message);
                });
        });
    }
}
