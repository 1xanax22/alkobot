export default function handler(req, res) {
    // Полная конфигурация только на сервере
    const fullConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID
    };

    // Отправляем клиенту только необходимые поля
    const clientConfig = {
        apiKey: fullConfig.apiKey,
        authDomain: fullConfig.authDomain,
        databaseURL: fullConfig.databaseURL,
        projectId: fullConfig.projectId
    };

    res.status(200).json({
        firebaseConfig: clientConfig,
        botToken: process.env.BOT_TOKEN
    });
}
