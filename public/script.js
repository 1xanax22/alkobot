// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();

// Загружаем конфигурацию Firebase и токен бота через API Vercel
fetch('/api/firebase')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Ошибка загрузки конфигурации Firebase: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        const { firebaseConfig, botToken } = data;

        // Проверка загрузки Firebase SDK
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK не загружен');
            alert('Ошибка: Firebase SDK не загружен. Проверь подключение в index.html.');
            return;
        }

        // Инициализация Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        // Элементы DOM
        const timerDisplay = document.getElementById('timer');
        const startBtn = document.getElementById('startBtn');
        const resetBtn = document.getElementById('resetBtn');
        const friendUsernameInput = document.getElementById('friendUsername');
        const addFriendBtn = document.getElementById('addFriendBtn');
        const friendsList = document.getElementById('friendsList');

        // Получение ID пользователя из Telegram
        const userId = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : 'anonymous';

        // Хранение данных
        let startTime = localStorage.getItem(`startTime_${userId}`) || null;
        let friends = JSON.parse(localStorage.getItem(`friends_${userId}`)) || [];
        let timerInterval = null; // Переменная для хранения интервала

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

            // Сохраняем в Firebase
            database.ref(`users/${userId}`).set({
                startTime: startTime,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            }).catch(error => console.error("Ошибка сохранения в Firebase:", error));
        }

        function startTimerInterval() {
            if (timerInterval) clearInterval(timerInterval); // Очищаем старый интервал
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

            // Удаляем данные из Firebase
            database.ref(`users/${userId}`).remove().catch(error => console.error("Ошибка удаления из Firebase:", error));
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
                }, (error) => console.error("Ошибка загрузки данных друга:", error));
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
                // Получаем ID по никнейму через Telegram API
                const response = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=@${username}`);
                const data = await response.json();
                if (data.ok) {
                    const friendId = data.result.id;
                    // Проверяем, зарегистрирован ли друг в Firebase
                    const friendRef = database.ref(`users/${friendId}`);
                    const snapshot = await friendRef.once('value');
                    if (!snapshot.exists()) {
                        alert('Друг не зарегистрирован! Пусть он откроет приложение и начнёт таймер.');
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
    })
    .catch(error => {
        console.error("Ошибка загрузки конфигурации Firebase:", error);
        alert('Не удалось подключиться к Firebase. Проверь настройки сервера.');
    });
