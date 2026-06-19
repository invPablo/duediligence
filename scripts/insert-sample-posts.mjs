import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const samplePosts = [
  {
    ticker: 'AAPL',
    title: 'Apple Stock Surges 4.20%: What\'s Driving AAPL Today',
    description: 'Apple Inc. stock up 4.20% today. Explore key metrics and investment insights for AAPL in the technology sector.',
    change: 4.2,
    content: [
      {
        type: 'p',
        text: 'Apple Inc. (AAPL) is experiencing notable momentum today with a 4.20% gain, signaling positive investor sentiment in the technology sector. This rally could be driven by broader tech sector strength, positive earnings expectations, or product announcement anticipation heading into the holiday season.',
      },
      {
        type: 'h2',
        text: 'Key Metrics to Monitor',
      },
      {
        type: 'p',
        text: 'Price-to-Earnings Ratio (P/E): Apple\'s valuation relative to earnings helps determine if today\'s price movement reflects fair value or potential overheating. Compare this to historical averages and peer companies like Microsoft and Google.',
      },
      {
        type: 'p',
        text: 'Return on Invested Capital (ROIC): Monitor how efficiently Apple converts its massive cash position into returns. A strong ROIC indicates the company effectively deploys capital for shareholder benefit.',
      },
      {
        type: 'h2',
        text: 'Investment Consideration',
      },
      {
        type: 'p',
        text: 'Today\'s 4% move suggests renewed confidence in Apple\'s ecosystem strength and services growth. Watch for any product announcements or earnings guidance updates that could validate or challenge today\'s momentum.',
      },
    ],
  },
  {
    ticker: 'TSLA',
    title: 'Tesla Stock Surges 5.80%: What Investors Should Know',
    description: 'Tesla shares jump 5.80% today. Explore key metrics and investment insights for this automotive sector leader.',
    change: 5.8,
    content: [
      {
        type: 'p',
        text: 'Tesla (TSLA) is trading up 5.80% today, signaling strong market momentum. This significant daily gain suggests positive investor sentiment, likely driven by favorable industry news, earnings expectations, or broader EV market tailwinds.',
      },
      {
        type: 'h2',
        text: 'Key Metrics to Monitor',
      },
      {
        type: 'p',
        text: 'Delivery Numbers & Growth: Tesla\'s quarterly vehicle deliveries remain the primary performance indicator. Consistent year-over-year growth in deliveries signals expanding market share in the competitive EV space.',
      },
      {
        type: 'p',
        text: 'Gross Margin Trends: Monitor Tesla\'s automotive gross margin. Improving margins despite increased competition indicate pricing power and operational efficiency.',
      },
      {
        type: 'h2',
        text: 'Investment Consideration',
      },
      {
        type: 'p',
        text: 'Tesla\'s 5.8% rally reflects market confidence in EV adoption acceleration. Key to watch: production capacity expansion and margin sustainability in an increasingly competitive market.',
      },
    ],
  },
  {
    ticker: 'MSFT',
    title: 'MSFT Gains 3.10%: What\'s Driving Microsoft Today',
    description: 'Microsoft stock rises 3.10% today. Explore key metrics and investment considerations for this tech giant.',
    change: 3.1,
    content: [
      {
        type: 'p',
        text: 'Microsoft (MSFT) is up 3.10% today, reflecting positive investor sentiment in the technology sector. This gain suggests renewed confidence in the company\'s growth trajectory and market position.',
      },
      {
        type: 'h2',
        text: 'Key Metrics to Watch',
      },
      {
        type: 'p',
        text: 'Revenue Growth & Cloud Expansion: Monitor Azure\'s quarter-over-quarter growth rates. Microsoft\'s cloud services remain a primary growth driver, with enterprise adoption continuing to accelerate.',
      },
      {
        type: 'p',
        text: 'Operating Margin: Microsoft maintains industry-leading operating margins. Watch if margins expand as Azure scales, indicating strong operational leverage.',
      },
      {
        type: 'h2',
        text: 'Investment Consideration',
      },
      {
        type: 'p',
        text: 'Today\'s move underscores Microsoft\'s dominance in enterprise cloud. The secular shift toward cloud computing and AI integration remains a long-term tailwind for MSFT.',
      },
    ],
  },
];

async function insertPosts() {
  console.log('📝 Inserting sample posts into Supabase...\n');

  for (const post of samplePosts) {
    const slug = slugify(`${post.title}-${new Date().toISOString().split('T')[0]}`);

    // Check if post already exists
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug);

    if (existing?.length) {
      console.log(`⏭️  Post already exists for ${post.ticker}, skipping...`);
      continue;
    }

    const { error } = await supabase.from('blog_posts').insert({
      slug,
      title: post.title,
      description: post.description,
      date: new Date().toISOString().split('T')[0],
      read_time: '3 min read',
      tag: 'Market Movers',
      tickers: [post.ticker],
      sentiment: post.change > 5 ? 'positive' : 'neutral',
      author: 'Market Analysis',
      content: JSON.stringify(post.content),
      published: true,
    });

    if (error) {
      console.error(`❌ Error inserting ${post.ticker}:`, error);
    } else {
      console.log(`✅ ${post.ticker} post inserted successfully`);
      console.log(`   Title: ${post.title}`);
      console.log(`   Slug: ${slug}\n`);
    }
  }

  console.log('\n🎉 Done! Check your blog at /blog');
}

insertPosts().catch(console.error);
