import * as SecureStore from 'expo-secure-store';
import { AppSettings, AIExplanation } from '@/types';

const API_KEY_KEY = 'devsnippets_ai_api_key';

export async function saveApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_KEY, key);
}

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(API_KEY_KEY);
}

export async function deleteApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(API_KEY_KEY);
}

export async function generateExplanation(
  code: string,
  language: string,
  settings: Pick<AppSettings, 'aiProvider' | 'aiModel' | 'customAiEndpoint'>
): Promise<AIExplanation> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('API key not configured. Please add your API key in Settings.');
  }

  const prompt = buildPrompt(code, language);

  if (settings.aiProvider === 'openai' || settings.aiProvider === 'custom') {
    return callOpenAICompatible(prompt, apiKey, settings);
  } else if (settings.aiProvider === 'gemini') {
    return callGemini(prompt, apiKey, settings.aiModel);
  }

  throw new Error('Unknown AI provider');
}

function buildPrompt(code: string, language: string): string {
  return `Analyze the following ${language} code snippet and provide:
1. A clear explanation of what the code does
2. A brief one-sentence summary
3. Three specific improvement suggestions

Code:
\`\`\`${language}
${code}
\`\`\`

Respond in this exact JSON format:
{
  "explanation": "Detailed explanation here...",
  "summary": "One sentence summary here.",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"]
}`;
}

async function callOpenAICompatible(
  prompt: string,
  apiKey: string,
  settings: Pick<AppSettings, 'aiProvider' | 'aiModel' | 'customAiEndpoint'>
): Promise<AIExplanation> {
  const baseUrl =
    settings.aiProvider === 'custom' && settings.customAiEndpoint
      ? settings.customAiEndpoint.replace(/\/$/, '')
      : 'https://api.openai.com/v1';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: settings.aiModel || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert code analyst. Always respond with valid JSON only, no markdown.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI API error (${response.status}): ${text.substring(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? '';
  return parseAIResponse(content);
}

async function callGemini(
  prompt: string,
  apiKey: string,
  model: string
): Promise<AIExplanation> {
  const geminiModel = model || 'gemini-1.5-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
        systemInstruction: {
          parts: [
            {
              text: 'You are an expert code analyst. Always respond with valid JSON only, no markdown.',
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${text.substring(0, 200)}`);
  }

  const data = (await response.json()) as {
    candidates: { content: { parts: { text: string }[] } }[];
  };
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return parseAIResponse(content);
}

function parseAIResponse(content: string): AIExplanation {
  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as Partial<AIExplanation>;
    return {
      explanation: parsed.explanation ?? 'No explanation available.',
      summary: parsed.summary ?? 'No summary available.',
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    };
  } catch {
    return {
      explanation: content,
      summary: 'AI response received.',
      improvements: [],
    };
  }
}
