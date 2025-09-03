
// cc-axiom-trader/src/lib/telegram.ts

/**
 * Sends a message to a specified Telegram chat.
 * Retries up to 3 times on failure.
 * @param content The message text to send.
 * @param apiKey The Telegram Bot API key.
 * @param chatId The target chat ID.
 * @returns A boolean indicating whether the message was sent successfully.
 */
export async function sendToTelegram(content: string, apiKey: string, chatId: string): Promise<boolean> {
  let reply = 0;
  const internalApiUrl = '/api/telegram/send-message'; // Use internal API route

  const send = async (): Promise<boolean> => {
    reply++;
    try {
      const response = await fetch(internalApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content, // Pass content
          apiKey,  // Pass apiKey
          chatId   // Pass chatId
        })
      });

      const data = await response.json();
      console.log('Sent to Telegram via proxy:', data);
      return data.ok === true;
    } catch (error) {
      console.error('Failed to send message to Telegram via proxy:', error);
      if (reply < 3) {
        // Wait for a second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await send();
      }
      return false;
    }
  };

  return await send();
}
