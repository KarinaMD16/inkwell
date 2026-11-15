import Link from "next/link";
import { fmt, type Story } from "@/lib/data";
import { Book, FlatCover } from "./Book";
import { Icon } from "./Icon";
import { Chip } from "./ui";

function Meta({ story }: { story: Story }) {
  return (
    <span className="meta">
      <span><Icon name="heart" size={15} />{fmt(story.votes)}</span>
      <span>{story.chapters} caps.</span>
    </span>
  );
}

/** Libro de pie sobre un tramo de repisa, con sus datos debajo de la tabla. */
export function ShelfCard({ story }: { story: Story }) {
  return (
    <Link href={`/historia/${story.slug}`} className="shelfcard">
      <span className="shelfcard__book"><Book story={story} /></span>
      <span className="board board--flat" aria-hidden="true" />
      <span className="shelfcard__info">
        <span className="h-card">{story.title}</span>
        <span className="muted small">@{story.author}</span>
        <Meta story={story} />
        <span><Chip>{story.genre}</Chip></span>
      </span>
    </Link>
  );
}

/** Fila compacta con portada plana: la vista densa de resultados. */
export function StoryRow({ story }: { story: Story }) {
  return (
    <Link href={`/historia/${story.slug}`} className="storyrow">
      <FlatCover story={story} />
      <span className="storyrow__info">
        <span className="h-card">{story.title}</span>
        <span className="muted small">@{story.author} · {story.status}</span>
        <span className="chips">{[story.genre, ...story.tropes].slice(0, 2).map((t) => <Chip key={t}>{t}</Chip>)}</span>
        <Meta story={story} />
      </span>
    </Link>
  );
}
