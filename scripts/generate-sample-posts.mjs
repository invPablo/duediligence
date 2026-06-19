import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generatePostContent(ticker, name, price, change, sector) {
  const prompt = `Generate a concise financial analysis blog post about ${name} (${ticker}) which is up ${change.toFixed(2)}% today and is in the ${sector} sector.

The post should:
1. Start with why this stock is trending today (the price movement)
2. Include 2-3 key metrics to watch for this company
3. End with a brief investment consideration

Format the response as JSON with this structure:
{
  "title": "Post title (40-60 chars)",
  "description": "Meta description (100-120 chars)",
  "content": [
    {"type": "p", "text": "paragraph text"},
    {"type": "h2", "text": "heading"},
    ...
  ]
}

Keep paragraphs concise (2-3 sentences max). Make it actionable and informative.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                     responseText.match(/({[\s\S]*})/);

    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[1]);
  } catch (error) {
    console.error('Error generating content:', error);
    return null;
  }
}

// Sample stocks
const sampleStocks = [
  { ticker: 'AAPL', name: 'Apple Inc.', change: 4.2, sector: 'Technology' },
  { ticker: 'TSLA', name: 'Tesla Inc.', change: 5.8, sector: 'Automotive' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', change: 3.1, sector: 'Technology' },
];

async function main() {
  console.log('🚀 Generating sample posts...\n');

  for (const stock of sampleStocks) {
    console.log(`\n📝 Generating post for ${stock.ticker} (${stock.name})...`);
    const post = await generatePostContent(stock.ticker, stock.name, 0, stock.change, stock.sector);

    if (post) {
      console.log(`\n✅ ${stock.ticker} Post Generated:`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Title: ${post.title}`);
      console.log(`Description: ${post.description}`);
      console.log(`\nContent Preview:`);
      post.content.slice(0, 3).forEach((block, i) => {
        if (block.type === 'h2') {
          console.log(`\n## ${block.text}`);
        } else if (block.type === 'p') {
          console.log(`\n${block.text}`);
        }
      });
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }
  }
}

main();
