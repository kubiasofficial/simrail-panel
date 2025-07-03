// api/send-discord-message.js
// Tato funkce bude přijímat data a odesílat je na Discord webhook.

export default async function handler(request, response) {
  // Logování pro diagnostiku spuštění funkce
  console.log('Vercel Function: send-discord-message.js started.');
  console.log('Request method:', request.method);

  if (request.method !== 'POST') {
    console.log('Method Not Allowed: Only POST requests are supported for send-discord-message.');
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const discordMessage = request.body;

    const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

    if (!DISCORD_WEBHOOK_URL) {
      console.error("Missing DISCORD_WEBHOOK_URL environment variable.");
      return response.status(500).json({ message: "Server configuration error: Discord Webhook URL is missing." });
    }

    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordMessage),
    });

    if (discordResponse.ok) {
      console.log('Discord message sent successfully.');
      response.status(200).json({ message: 'Zpráva úspěšně odeslána na Discord!' });
    } else {
      const errorData = await discordResponse.json();
      console.error("Error sending to Discord:", errorData);
      response.status(discordResponse.status).json({ message: `Chyba při odesílání na Discord: ${errorData.message || discordResponse.statusText}` });
    }

  } catch (error) {
    console.error('Error processing Discord message:', error);
    response.status(500).json({ message: 'Interní chyba serveru při odesílání na Discord.', error: error.message });
  }
}
