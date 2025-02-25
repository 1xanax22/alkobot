// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();

// Инициализация Firebase
const firebaseConfig = {
    // Вставь свои данные Firebase (нужно зарегистрировать проект)
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

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

function updateTimer() {
    if (!startTime) return;
    const now = new Date();
    const start = new Date(startTime);
    const diff = now - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    timerDisplay.innerText = `${days} дней, ${hours} часов, ${minutes} минут`;
    timerDisplay.classList.add('active');

    // Сохраняем в Firebase
    database.ref(`users/${userId}`).set({
        startTime: startTime,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
}

if (startTime) {
    startBtn.style.display = 'none';
    resetBtn.style.display = 'inline';
    setInterval(updateTimer, 1000);
    updateTimer();
}

startBtn.addEventListener('click', () => {
    startTime = new Date().toISOString();
    localStorage.setItem(`startTime_${userId}`, startTime);
    startBtn.style.display = 'none';
    resetBtn.style.display = 'inline';
    setInterval(updateTimer, 1000);
    updateTimer();
});

resetBtn.addEventListener('click', () => {
    startTime = null;
    localStorage.removeItem(`startTime_${userId}`);
    timerDisplay.innerText = 'Нажми "Старт"!';
    timerDisplay.classList.remove('active');
    startBtn.style.display = 'inline';
    resetBtn.style.display = 'none';

    // Удаляем данные из Firebase
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
    return `${days} дней, ${hours} часов, ${minutes} минут`;
}

addFriendBtn.addEventListener('click', async () => {
    const username = friendUsernameInput.value.trim().replace('@', '');
    if (!username) return;

    try {
        // Получаем ID по никнейму через Telegram API
        const response = await fetch(`https://api.telegram.org/botYOUR_BOT_TOKEN/getChat?chat_id=@${username}`);
        const data = await response.json();
        if (data.ok) {
            const friendId = data.result.id;
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
