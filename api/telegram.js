export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const username = req.query.username;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getChat?chat_id=@${username}`
        );
        const data = await response.json();
        
        // Возвращаем только необходимые данные, не раскрывая токен
        if (data.ok) {
            return res.status(200).json({
                ok: true,
                userId: data.result.id,
                username: data.result.username
            });
        } else {
            return res.status(404).json({
                ok: false,
                error: 'User not found'
            });
        }
    } catch (error) {
        console.error('Telegram API Error:', error);
        return res.status(500).json({ error: 'Failed to fetch user data' });
    }
}
