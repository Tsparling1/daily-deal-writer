import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const TONE_INSTRUCTIONS = {
  friendly: 'friendly, casual, and warm — like a neighbor sharing good news',
  professional: 'professional, polished, and authoritative — building trust and credibility',
  urgent: 'urgent and exciting — create FOMO with limited-time energy and strong action words',
};

app.post('/api/generate', async (req, res) => {
  const { deal, businessName, tone } = req.body;

  if (!deal || !businessName || !tone) {
    return res.status(400).json({ error: 'Missing required fields: deal, businessName, tone' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
  }

  const toneDesc = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.friendly;

  const prompt = `You are an expert local marketing copywriter for ${businessName}.

Create three distinct marketing posts for this deal or special:
"${deal}"

Tone for all posts: ${toneDesc}

Return ONLY a valid JSON object — no markdown, no explanation, no code fences. Use this exact structure:

{
  "facebook": "Facebook/Instagram post: conversational, use 3-5 relevant emojis naturally, mention the local business by name, include a clear call-to-action, end with 3-5 relevant hashtags. Keep it 2-4 sentences of body text before hashtags.",
  "google": "Google Business Post: professional, clean, local SEO-friendly, NO emojis, must be UNDER 300 characters total including spaces. Include business name and a call-to-action.",
  "sms": "SMS text blast: punchy, conversational, must be UNDER 160 characters total. Include business name. No emojis."
}

Important: The sms value MUST be 160 characters or fewer. The google value MUST be 300 characters or fewer. Return only the raw JSON object.`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Anthropic API error:', err.message);
    const message =
      err.status === 401
        ? 'Invalid API key. Please check your ANTHROPIC_API_KEY.'
        : err.status === 429
        ? 'Rate limit reached. Please wait a moment and try again.'
        : `API error: ${err.message}`;
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Daily Deal Writer running at http://localhost:${PORT}`);
});
