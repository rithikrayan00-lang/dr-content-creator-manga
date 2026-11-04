import Image from 'next/image';
import Link from 'next/link';
import type { Character, CharacterRelationship, WorldEntry, WorldEntryType } from '@/lib/catalog';

const worldEntryLabels: Record<WorldEntryType, string> = {
  lore: 'Lore',
  location: 'Location',
  kingdom: 'Kingdom',
  faction: 'Faction',
  timeline: 'Timeline',
  power_system: 'Power system',
};

export function ArchiveNotice({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="archive-notice" role="status">{error} Apply <code>supabase/advanced-universe.sql</code> to enable this archive.</p>;
}

export function CharacterCard({ mangaSlug, character }: { mangaSlug: string; character: Character }) {
  return <article className="universe-card character-card">
    <Link href={`/manga/${encodeURIComponent(mangaSlug)}/characters/${encodeURIComponent(character.slug)}`} className="universe-card-image" aria-label={`View ${character.name}`}>
      {character.portrait_url ? <Image src={character.portrait_url} alt={`${character.name} portrait`} fill sizes="(max-width: 680px) 45vw, 220px" unoptimized /> : <span aria-hidden="true">{character.name.slice(0, 1).toUpperCase()}</span>}
    </Link>
    <div className="universe-card-copy">
      <span className="universe-kind">CHARACTER{character.age ? ` · ${character.age}` : ''}</span>
      <h3><Link href={`/manga/${encodeURIComponent(mangaSlug)}/characters/${encodeURIComponent(character.slug)}`}>{character.name}</Link></h3>
      <p>{character.description || 'Character profile details coming soon.'}</p>
      <Link className="text-link" href={`/manga/${encodeURIComponent(mangaSlug)}/characters/${encodeURIComponent(character.slug)}`}>View profile <b>↗</b></Link>
    </div>
  </article>;
}

export function CharacterArchive({ mangaSlug, characters, error }: { mangaSlug: string; characters: Character[]; error: string | null }) {
  return <section className="universe-section" aria-labelledby="characters-heading">
    <div className="section-heading"><div><div className="eyebrow">MEET THE CAST</div><h2 id="characters-heading">Characters <span className="chapter-count">{characters.length}</span></h2></div><Link className="text-link" href={`/manga/${encodeURIComponent(mangaSlug)}/characters`}>Character archive <b>↗</b></Link></div>
    <ArchiveNotice error={error} />
    {characters.length ? <div className="universe-grid">{characters.slice(0, 4).map((character) => <CharacterCard key={character.id} mangaSlug={mangaSlug} character={character} />)}</div> : !error ? <p className="universe-empty">Character profiles will appear here as this universe grows.</p> : null}
  </section>;
}

export function WorldEntryCard({ mangaSlug, entry }: { mangaSlug: string; entry: WorldEntry }) {
  return <article className="universe-card world-card">
    {entry.image_url && <div className="world-card-image"><Image src={entry.image_url} alt="" fill sizes="(max-width: 680px) 90vw, 500px" unoptimized /></div>}
    <div className="universe-card-copy">
      <span className="universe-kind">{worldEntryLabels[entry.entry_type]}</span>
      <h3><Link href={`/manga/${encodeURIComponent(mangaSlug)}/world/${encodeURIComponent(entry.slug)}`}>{entry.title}</Link></h3>
      <p>{entry.summary || entry.content.slice(0, 220) || 'More details coming soon.'}</p>
      <Link className="text-link" href={`/manga/${encodeURIComponent(mangaSlug)}/world/${encodeURIComponent(entry.slug)}`}>Explore entry <b>↗</b></Link>
    </div>
  </article>;
}

export function WorldArchive({ mangaSlug, entries, error }: { mangaSlug: string; entries: WorldEntry[]; error: string | null }) {
  return <section className="universe-section" aria-labelledby="world-heading">
    <div className="section-heading"><div><div className="eyebrow">BEYOND THE PAGES</div><h2 id="world-heading">World guide <span className="chapter-count">{entries.length}</span></h2></div><Link className="text-link" href={`/manga/${encodeURIComponent(mangaSlug)}/world`}>Explore the lore <b>↗</b></Link></div>
    <ArchiveNotice error={error} />
    {entries.length ? <div className="universe-grid">{entries.slice(0, 4).map((entry) => <WorldEntryCard key={entry.id} mangaSlug={mangaSlug} entry={entry} />)}</div> : !error ? <p className="universe-empty">Lore, places and factions will appear here as this universe grows.</p> : null}
  </section>;
}

export function CharacterDetails({ mangaSlug, character, relationships, worldEntries }: { mangaSlug: string; character: Character; relationships: CharacterRelationship[]; worldEntries: WorldEntry[] }) {
  return <article className="universe-detail">
    <div className="universe-detail-portrait">
      {character.portrait_url ? <Image src={character.portrait_url} alt={`${character.name} portrait`} fill sizes="(max-width: 680px) 90vw, 380px" unoptimized priority /> : <span>{character.name.slice(0, 1).toUpperCase()}</span>}
    </div>
    <div className="universe-detail-copy">
      <div className="eyebrow">CHARACTER PROFILE</div>
      <h1>{character.name}</h1>
      {character.age && <p className="universe-detail-meta">Age · {character.age}</p>}
      <p className="universe-detail-description">{character.description || 'No description has been added yet.'}</p>
      {character.abilities.length > 0 && <section><h2>Abilities</h2><ul className="universe-tags">{character.abilities.map((ability) => <li key={ability}>{ability}</li>)}</ul></section>}
      {relationships.length > 0 && <section><h2>Relationships</h2><ul className="relationship-list">{relationships.map((item) => <li key={`${item.related_character_id}-${item.relationship}`}><span>{item.relationship}</span>{item.related_character && <Link href={`/manga/${encodeURIComponent(mangaSlug)}/characters/${encodeURIComponent(item.related_character.slug)}`}>{item.related_character.name}</Link>}{item.description && <p>{item.description}</p>}</li>)}</ul></section>}
      {worldEntries.length > 0 && <section><h2>Connected places & lore</h2><ul className="relationship-list">{worldEntries.map((entry) => <li key={entry.id}><span>{worldEntryLabels[entry.entry_type]}</span><Link href={`/manga/${encodeURIComponent(mangaSlug)}/world/${encodeURIComponent(entry.slug)}`}>{entry.title}</Link></li>)}</ul></section>}
    </div>
  </article>;
}

export function WorldEntryDetails({ entry }: { entry: WorldEntry }) {
  return <article className="world-entry-details">
    {entry.image_url && <div className="world-entry-hero"><Image src={entry.image_url} alt="" fill sizes="(max-width: 900px) 100vw, 900px" unoptimized priority /></div>}
    <div className="eyebrow">{worldEntryLabels[entry.entry_type].toUpperCase()}</div>
    <h1>{entry.title}</h1>
    {entry.summary && <p className="world-entry-summary">{entry.summary}</p>}
    {entry.content && <div className="world-entry-content">{entry.content.split(/\r?\n/).filter(Boolean).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}</div>}
  </article>;
}
