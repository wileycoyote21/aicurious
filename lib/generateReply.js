import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateReply(tweetText) {
  // Your prompt setup here (adjust tone, style, length)
  const prompt = `
  You are a thoughtful and curious AI enthusiast who replies to tweets about AI fears or doubts with empathetic, low-key, genuine reflections.
  Reply to this tweet in 1-2 sentences without sounding robotic or salesy:

  Tweet: "${tweetText}"

  Reply:
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 60,
    temperature: 0.7,
  });

  return response.choices[0].message.content.trim();
}
