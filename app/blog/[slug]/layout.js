import { supabase } from '../../../lib/supabase';

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const { data: post } = await supabase.from('blog_posts').select('*').eq('slug', slug).single();
    if (!post) return { title: 'Post not found — Traqcker Blog' };

    return {
      title: `${post.title} — Traqcker Blog`,
      description: post.description,
      openGraph: {
        title: post.title,
        description: post.description,
        url: `https://traqcker.com/blog/${post.slug}`,
        siteName: 'Traqcker',
        images: [{ url: '/og-screenshot.png', width: 1200, height: 630 }],
        type: 'article',
        publishedTime: post.date,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.description,
        images: ['/og-screenshot.png'],
      },
      alternates: { canonical: `https://traqcker.com/blog/${post.slug}` },
    };
  } catch {
    return { title: 'Traqcker Blog' };
  }
}

export default function BlogPostLayout({ children }) {
  return children;
}
