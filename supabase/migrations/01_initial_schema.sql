-- Create tables
create table movies (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  attention_level text not null,
  vibe text not null,
  image_url text,
  description text not null,
  runtime integer not null,
  language text not null,
  release_year integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table collections (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  type text not null check (type in ('occasion', 'mood', 'project', 'archive')),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table collection_movies (
  collection_id uuid not null references collections(id) on delete cascade,
  movie_id uuid not null references movies(id) on delete cascade,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (collection_id, movie_id)
);

create table user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_attention_level text,
  preferred_vibes text[] not null default '{}',
  preferred_languages text[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table movies enable row level security;
alter table collections enable row level security;
alter table collection_movies enable row level security;
alter table user_preferences enable row level security;

-- Create policies

-- Movies are readable by everyone
create policy "Movies are viewable by everyone"
  on movies for select
  using (true);

-- Collections are only viewable by their owners
create policy "Collections are viewable by owner"
  on collections for select
  using (auth.uid() = user_id);

create policy "Collections are insertable by owner"
  on collections for insert
  with check (auth.uid() = user_id);

create policy "Collections are updatable by owner"
  on collections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Collections are deletable by owner"
  on collections for delete
  using (auth.uid() = user_id);

-- Collection movies are viewable by collection owners
create policy "Collection movies are viewable by collection owner"
  on collection_movies for select
  using (
    auth.uid() in (
      select user_id from collections where id = collection_id
    )
  );

create policy "Collection movies are insertable by collection owner"
  on collection_movies for insert
  with check (
    auth.uid() in (
      select user_id from collections where id = collection_id
    )
  );

create policy "Collection movies are deletable by collection owner"
  on collection_movies for delete
  using (
    auth.uid() in (
      select user_id from collections where id = collection_id
    )
  );

-- User preferences are only accessible by the user
create policy "User preferences are viewable by owner"
  on user_preferences for select
  using (auth.uid() = user_id);

create policy "User preferences are insertable by owner"
  on user_preferences for insert
  with check (auth.uid() = user_id);

create policy "User preferences are updatable by owner"
  on user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create indexes for better performance
create index movies_attention_level_idx on movies(attention_level);
create index movies_vibe_idx on movies(vibe);
create index movies_language_idx on movies(language);
create index collections_user_id_idx on collections(user_id);
create index collection_movies_collection_id_idx on collection_movies(collection_id);
create index collection_movies_movie_id_idx on collection_movies(movie_id); 