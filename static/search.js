// static/search.js — búsqueda en el navegador. Vainilla ES6+, sin dependencias.
// Estilo funcional: funciones puras arriba; el DOM (efectos) solo al final.
//
// MDN:
//   fetch                 https://developer.mozilla.org/es/docs/Web/API/Fetch_API
//   Array.filter / every  https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
//   String.normalize      https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
//   Element.replaceChildren https://developer.mozilla.org/es/docs/Web/API/Element/replaceChildren
//   Escapes Unicode \p{M} https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape

// --- puras ------------------------------------------------------------------

// "Árbol" → "arbol": minúsculas y sin acentos
const normalize = s => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

const terms = query => normalize(query).split(/\s+/).filter(Boolean);

const haystack = post => normalize(`${post.title} ${post.tags.join(" ")} ${post.text}`);

// Cuenta cuántos términos de búsqueda aparecen en un artículo
const score = ts => post =>
  ts.filter(t => haystack(post).includes(t)).length;

// Ordena los artículos por número de coincidencias
const search = (posts, query) => {
  const ts = terms(query);

  return ts.length
    ? posts
        .map(post => ({ post, score: score(ts)(post) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.post)
    : [];
};

// --- efectos (DOM) ----------------------------------------------------------

// textContent, nunca innerHTML: el contenido se trata como texto, no como HTML
const toItem = base => post => {
  const a = document.createElement("a");
  a.href = base.replace(/\/$/, "") + post.url;
  a.textContent = post.title;

  const meta = document.createElement("span");
  meta.className = "meta";
  meta.textContent = ` ${post.date.slice(0, 10)} — ${post.summary}`;

  const li = document.createElement("li");
  li.append(a, meta);
  return li;
};

const emptyItem = () => {
  const li = document.createElement("li");
  li.className = "meta";
  li.textContent = "Sin resultados.";
  return li;
};

const main = async () => {
  const input = document.querySelector("#q");
  const list = document.querySelector("#results");
  if (!input || !list) return;

  const { index, base } = list.dataset;
  const posts = await fetch(index).then(r => r.json());

  input.addEventListener("input", () => {
    const found = search(posts, input.value);
    const items = found.map(toItem(base));
    list.replaceChildren(...(items.length || !input.value.trim() ? items : [emptyItem()]));
  });
};

main().catch(err => console.error("search.js:", err));
