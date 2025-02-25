const tg = window.Telegram.WebApp;
tg.ready();

const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const friendIdInput = document.getElementById('friendId');
const addFriendBtn = document.getElementById('addFriendBtn');
const friendsList = document.getElementById('friendsList');

let startTime = localStorage.getItem('startTime');
let friends = JSON.parse(localStorage.getItem('friends')) || [];

function updateTimer() {
    if (!startTime) return;
    const now = new Date();
    const start = new Date(startTime);
    const diff = now - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    timerDisplay.innerText = `${days} дней, ${hours} часов, ${minutes} минут`;
    timerDisplay.classList.add('active'); // Анимация включается
}

if (startTime) {
    startBtn.style.display = 'none';
    resetBtn.style.display = 'inline';
    setInterval(updateTimer, 1000);
    updateTimer();
}

startBtn.addEventListener('click', () => {
    startTime = new Date();
    localStorage.setItem('startTime', startTime);
    startBtn.style.display = 'none';
    resetBtn.style.display = 'inline';
    setInterval(updateTimer, 1000);
    updateTimer();
});

resetBtn.addEventListener('click', () => {
    startTime = null;
    localStorage.removeItem('startTime');
    timerDisplay.innerText = 'Нажми "Старт"!';
    timerDisplay.classList.remove('active');
    startBtn.style.display = 'inline';
    resetBtn.style.display = 'none';
});

function renderFriends() {
    friendsList.innerHTML = '';
    friends.forEach(friend => {
        const li = document.createElement('li');
        li.innerText = `Друг ${friend.id}: ${friend.time || 'не начал'}`;
        friendsList.appendChild(li);
    });
}
renderFriends();

addFriendBtn.addEventListener('click', () => {
    const friendId = friendIdInput.value.trim();
    if (friendId && !friends.some(f => f.id === friendId)) {
        friends.push({ id: friendId, time: null }); // В реальной версии время друга с сервера
        localStorage.setItem('friends', JSON.stringify(friends));
        renderFriends();
        friendIdInput.value = '';
    }
});