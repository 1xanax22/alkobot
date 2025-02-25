// Инициализация Telegram WebApp и запрос на полноэкранный режим
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); // Открываем мини-приложение на весь экран

// Получаем элементы DOM
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const friendIdInput = document.getElementById('friendId');
const addFriendBtn = document.getElementById('addFriendBtn');
const friendsList = document.getElementById('friendsList');

// Загружаем данные из локального хранилища
let startTime = localStorage.getItem('startTime');
let friends = JSON.parse(localStorage.getItem('friends')) || [];

// Функция обновления таймера
function updateTimer() {
    if (!startTime) {
        timerDisplay.innerText = 'Нажми "Старт", чтобы начать!';
        timerDisplay.classList.remove('active');
        startBtn.style.display = 'block';
        resetBtn.style.display = 'none';
        return;
    }

    const now = new Date();
    const start = new Date(startTime);
    const diff = now - start;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    timerDisplay.innerText = `${days} дней, ${hours} часов, ${minutes} минут`;
    timerDisplay.classList.add('active');
    startBtn.style.display = 'none';
    resetBtn.style.display = 'block';
}

// Инициализация таймера, если он уже запущен
if (startTime) {
    startBtn.style.display = 'none';
    resetBtn.style.display = 'block';
    setInterval(updateTimer, 1000);
    updateTimer();
} else {
    startBtn.style.display = 'block';
    resetBtn.style.display = 'none';
}

// Обработчик кнопки "Старт"
startBtn.addEventListener('click', () => {
    startTime = new Date().toISOString();
    localStorage.setItem('startTime', startTime);

    // Добавляем анимацию нажатия на кнопку
    startBtn.classList.add('start-animation');
    setTimeout(() => {
        startBtn.classList.remove('start-animation');
    }, 500); // Убираем анимацию через 0.5 секунды

    updateTimer();
    setInterval(updateTimer, 1000);
});

// Обработчик кнопки "Сброс"
resetBtn.addEventListener('click', () => {
    startTime = null;
    localStorage.removeItem('startTime');
    timerDisplay.innerText = 'Нажми "Старт", чтобы начать!';
    timerDisplay.classList.remove('active');
    startBtn.style.display = 'block';
    resetBtn.style.display = 'none';

    // Добавляем анимацию нажатия на кнопку "Сброс"
    resetBtn.classList.add('start-animation');
    setTimeout(() => {
        resetBtn.classList.remove('start-animation');
    }, 500); // Убираем анимацию через 0.5 секунды
});

// Функция отображения списка друзей
function renderFriends() {
    friendsList.innerHTML = '';
    friends.forEach(friend => {
        const li = document.createElement('li');
        li.innerText = `Друг ${friend.id}: ${friend.time || 'не начал'}`;
        friendsList.appendChild(li);
    });
}
renderFriends();

// Обработчик добавления друга
addFriendBtn.addEventListener('click', () => {
    const friendId = friendIdInput.value.trim();
    if (friendId && !friends.some(f => f.id === friendId)) {
        friends.push({ id: friendId, time: null });
        localStorage.setItem('friends', JSON.stringify(friends));
        renderFriends();
        friendIdInput.value = '';
    } else {
        alert('Введите корректный ID друга или убедитесь, что он не добавлен!');
    }
});

// Обработчик изменения размера окна (опционально)
tg.onEvent('viewportChanged', () => {
    console.log('Размер окна изменился:', tg.viewportStableHeight, tg.viewportHeight);
});