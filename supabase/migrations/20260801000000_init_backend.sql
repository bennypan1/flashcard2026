-- Flashcard backend — initial schema, RLS, and save_deck RPC.
-- Mirrors docs/spec.md → Backend. Client-generated text ids (generateId),
-- normalized decks/cards tables, every row scoped to its owner via RLS, and
-- a single transactional save_deck(jsonb) so the app's "save the whole deck"
-- calling convention maps onto two tables atomically.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.decks (
  id             text primary key,               -- client-generated, e.g. generateId('deck')
  user_id        uuid not null references auth.users on delete cascade,
  name           text not null,
  reveal_order   text[] not null,
  created_at     timestamptz not null,
  last_practiced timestamptz
);

create table if not exists public.cards (
  id            text primary key,                 -- client-generated, e.g. generateId('card')
  deck_id       text not null references public.decks(id) on delete cascade,
  english       text not null,
  pinyin        text not null,
  chinese       text not null,
  notes         text not null default '',
  created_at    timestamptz not null,
  last_reviewed timestamptz,
  srs           jsonb not null                    -- { nextDue, interval, ease } — same shape as Card.srs
);

create index if not exists cards_deck_id_idx on public.cards (deck_id);

-- ---------------------------------------------------------------------------
-- Row-level security — an account can only ever see or touch its own rows.
-- decks: directly by user_id. cards: via a join through their deck.
-- ---------------------------------------------------------------------------

alter table public.decks enable row level security;
alter table public.cards enable row level security;

create policy "decks are owned by their user"
  on public.decks
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "cards are owned via their deck"
  on public.cards
  for all
  using (
    exists (
      select 1 from public.decks d
      where d.id = cards.deck_id and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.decks d
      where d.id = cards.deck_id and d.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- save_deck(deck jsonb) — atomic diff-and-upsert of a whole deck.
--
-- The client always sends a complete Deck object (camelCase keys, timestamps
-- as epoch-millis numbers). This runs in one transaction:
--   1. upsert the deck row
--   2. delete cards no longer present
--   3. upsert every incoming card
-- Ownership is enforced from auth.uid() — the client's payload never sets
-- user_id, and cards are only ever written under a deck this user owns.
-- ---------------------------------------------------------------------------

create or replace function public.save_deck(deck jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid := auth.uid();
  v_deck_id  text := deck->>'id';
  v_card     jsonb;
  v_card_ids text[];
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  -- Reject writes to a deck owned by someone else (id collision / hijack attempt).
  if exists (
    select 1 from public.decks
    where id = v_deck_id and user_id <> v_user_id
  ) then
    raise exception 'deck % is not owned by the current user', v_deck_id;
  end if;

  -- 1. Upsert the deck row. created_at is preserved on update.
  insert into public.decks (id, user_id, name, reveal_order, created_at, last_practiced)
  values (
    v_deck_id,
    v_user_id,
    deck->>'name',
    array(select jsonb_array_elements_text(deck->'revealOrder')),
    to_timestamp((deck->>'createdAt')::bigint / 1000.0),
    case
      when deck->>'lastPracticed' is null then null
      else to_timestamp((deck->>'lastPracticed')::bigint / 1000.0)
    end
  )
  on conflict (id) do update
    set name           = excluded.name,
        reveal_order   = excluded.reveal_order,
        last_practiced = excluded.last_practiced;

  -- Collect the ids of cards present in the incoming payload.
  select coalesce(array_agg(c->>'id'), '{}')
    into v_card_ids
    from jsonb_array_elements(coalesce(deck->'cards', '[]'::jsonb)) c;

  -- 2. Delete cards that were removed from the deck.
  delete from public.cards
   where deck_id = v_deck_id
     and not (id = any (v_card_ids));

  -- 3. Upsert each incoming card (scoped to this deck).
  for v_card in
    select * from jsonb_array_elements(coalesce(deck->'cards', '[]'::jsonb))
  loop
    insert into public.cards (
      id, deck_id, english, pinyin, chinese, notes,
      created_at, last_reviewed, srs
    )
    values (
      v_card->>'id',
      v_deck_id,
      v_card->>'english',
      v_card->>'pinyin',
      v_card->>'chinese',
      coalesce(v_card->>'notes', ''),
      to_timestamp((v_card->>'createdAt')::bigint / 1000.0),
      case
        when v_card->>'lastReviewed' is null then null
        else to_timestamp((v_card->>'lastReviewed')::bigint / 1000.0)
      end,
      coalesce(v_card->'srs', '{"nextDue":null,"interval":0,"ease":2.5}'::jsonb)
    )
    on conflict (id) do update
      set english       = excluded.english,
          pinyin        = excluded.pinyin,
          chinese       = excluded.chinese,
          notes         = excluded.notes,
          last_reviewed = excluded.last_reviewed,
          srs           = excluded.srs
      where public.cards.deck_id = v_deck_id;  -- never touch a card under another deck
  end loop;
end;
$$;

-- Only signed-in users may call it; the function's own checks do the rest.
revoke all on function public.save_deck(jsonb) from public, anon;
grant execute on function public.save_deck(jsonb) to authenticated;
