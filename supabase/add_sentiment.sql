alter table blog_posts add column if not exists sentiment text not null default 'neutral';
