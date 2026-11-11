"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { srcSet } from "@/lib/format";

type Suggestion =
  | { type: "category"; name: string; url: string }
  | { type: "product"; name: string; url: string; image: string | null };

export default function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(pathname.startsWith("/search") ? params.get("q") ?? "" : "");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [sel, setSel] = useState(-1);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/suggest/?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => {
          setItems(d.suggestions ?? []);
          setSel(-1);
        })
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const go = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  const categories = items.filter((i) => i.type === "category");
  const products = items.filter((i) => i.type === "product");
  const ordered = [...categories, ...products];

  return (
    <form
      id="header-search-form"
      className="form-inline"
      method="get"
      action="/search/"
      onSubmit={(e) => {
        e.preventDefault();
        if (sel >= 0 && ordered[sel]) return go(ordered[sel].url);
        if (q.trim()) go(`/search/?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <div className="input-group" ref={wrap} style={{ position: "relative" }}>
        <input
          type="search"
          name="q"
          placeholder="Search for brand, part or category"
          tabIndex={1}
          className="form-control input-search typeahead"
          autoComplete="off"
          required
          id="id_q"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((s) => Math.min(s + 1, ordered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((s) => Math.max(s - 1, -1));
            } else if (e.key === "Escape") setOpen(false);
          }}
        />
        <div className="input-group-append">
          <button className="btn btn-icon btn-dark" type="submit">
            <Icon name="search" />
          </button>
        </div>
        {open && ordered.length > 0 && (
          <div
            className="autocomplete-suggestions"
            style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1050, maxHeight: 400, textAlign: "left" }}
          >
            {categories.length > 0 && <div className="autocomplete-group">Categories</div>}
            {categories.map((c, i) => (
              <div
                key={c.url}
                className={`autocomplete-suggestion${sel === i ? " autocomplete-selected" : ""}`}
                onMouseEnter={() => setSel(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(c.url);
                }}
              >
                {c.name}
              </div>
            ))}
            {products.length > 0 && <div className="autocomplete-group">Products</div>}
            {products.map((p, j) => {
              const i = categories.length + j;
              return (
                <div
                  key={p.url}
                  className={`autocomplete-suggestion${sel === i ? " autocomplete-selected" : ""}`}
                  onMouseEnter={() => setSel(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(p.url);
                  }}
                >
                  {p.type === "product" && p.image && (
                    <img className="product-suggestion-img mr-2" src={p.image} srcSet={srcSet(p.image)} alt="" />
                  )}
                  {p.name}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </form>
  );
}
