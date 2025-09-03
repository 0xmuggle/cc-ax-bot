import { NextResponse } from 'next/server';
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
const agent = new HttpsProxyAgent("http://127.0.0.1:7890");

export async function POST(request: Request) {
  try {
    const { content, apiKey, chatId } = await request.json();

    if (!content || !apiKey || !chatId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const url = `https://api.telegram.org/bot${apiKey}/sendMessage`;
    console.log("sned", process.env.proxy);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: content,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      agent: process.env.proxy ? agent : undefined,
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('Telegram API error:', data);
      return NextResponse.json({ error: data.description || 'Failed to send message to Telegram' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
