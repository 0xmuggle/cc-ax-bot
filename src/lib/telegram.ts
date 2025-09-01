
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
  const url = `https://api.telegram.org/bot${apiKey}/sendMessage`;

  const send = async (): Promise<boolean> => {
    reply++;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: content,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });

      const data = await response.json();
      console.log('Sent to Telegram:', data);
      return data.ok === true;
    } catch (error) {
      console.error('Failed to send message to Telegram:', error);
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
