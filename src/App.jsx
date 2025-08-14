import { useEffect, useState } from "react";

// Read your backend URL from .env (Vite exposes it on import.meta.env)
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function Poster({ path, title }) {
  if (!path) return <div className="poster placeholder">No Image</div>;
  const url = `https://image.tmdb.org/t/p/w342${path}`;
  return <img className="poster" src={url} alt={title} loading="lazy" />;
}

export default function App() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ results: [], total_pages: 1 });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  async function search(p = 1) {
    if (!q.trim()) return;
    setError("");
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}&page=${p}`);
      if (!r.ok) throw new Error(`Search failed: ${r.status}`);
      const json = await r.json();
      setData(json);
      setPage(json.page || 1);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id) {
    setSelected(id);
    setDetail(null);
    setError("");
    try {
      const r = await fetch(`${API_BASE}/movie/${id}`);
      if (!r.ok) throw new Error(`Detail failed: ${r.status}`);
      const json = await r.json();
      setDetail(json);
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    // Pre-fill with a popular movie so the page isn't empty
    setQ("Inception");
  }, []);

  return (
    <div className="wrap">
      <header>
        <h1>🎬 CineScout</h1>
        <p>Search movies, view details, and build your watchlist.</p>
        <div className="bar">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search(1)}
            placeholder="Search for a movie…"
          />
          <button onClick={() => search(1)} disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </header>

      <main>
        <section className="grid">
          {data.results.map((m) => (
            <article key={m.id} className="card" onClick={() => openDetail(m.id)}>
              <Poster path={m.poster} title={m.title} />
              <div className="meta">
                <h3>{m.title}</h3>
                <span className="year">{m.year || "—"}</span>
                <span className="rating">★ {m.rating?.toFixed?.(1) ?? "–"}</span>
              </div>
              <p className="overview">{m.overview || "No overview provided."}</p>
            </article>
          ))}
        </section>

        {data.total_pages > 1 && (
          <div className="pager">
            <button
              onClick={() => {
                if (page > 1) {
                  const p = page - 1;
                  search(p);
                }
              }}
              disabled={page <= 1}
            >
              Prev
            </button>
            <span>
              Page {page} / {data.total_pages}
            </span>
            <button
              onClick={() => {
                if (page < data.total_pages) {
                  const p = page + 1;
                  search(p);
                }
              }}
              disabled={page >= data.total_pages}
            >
              Next
            </button>
          </div>
        )}

        {selected && detail && (
          <aside className="drawer" onClick={() => setSelected(null)}>
            <div className="panel" onClick={(e) => e.stopPropagation()}>
              <button className="close" onClick={() => setSelected(null)}>
                ×
              </button>
              <div className="flex">
                <Poster path={detail.poster} title={detail.title} />
                <div>
                  <h2>
                    {detail.title} <small>({detail.year || "—"})</small>
                  </h2>
                  <p>
                    <b>Rating:</b> {detail.rating ?? "—"} | <b>Runtime:</b>{" "}
                    {detail.runtime ?? "—"} min
                  </p>
                  <p>
                    <b>Genres:</b> {detail.genres?.join(", ") || "—"}
                  </p>
                  <p>
                    <b>Top cast:</b> {detail.cast?.join(", ") || "—"}
                  </p>
                  <p className="overview">{detail.overview || "No overview provided."}</p>
                </div>
              </div>
            </div>
          </aside>
        )}
      </main>

      <footer>
        <p>
          Data by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </footer>
    </div>
  );
}
