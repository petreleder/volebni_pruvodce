const data = window.VOLBY;

const $ = (id) => document.getElementById(id);
const citySel = $("city");
const kindSel = $("kind");
const bodySel = $("body");
const qInput = $("q");
const rows = $("rows");
const hint = $("hint");
const drawer = $("drawer");
const detail = $("detail");

const cities = [...new Set(data.bodies.map((b) => b.city))];
cities.forEach((c) => {
  const o = document.createElement("option");
  o.value = c;
  o.textContent = c;
  citySel.appendChild(o);
});

function bodiesForFilters() {
  return data.bodies.filter((b) => {
    if (citySel.value && b.city !== citySel.value) return false;
    if (kindSel.value && b.kind !== kindSel.value) return false;
    return true;
  });
}

function refreshBodies() {
  const keep = bodySel.value;
  bodySel.innerHTML = '<option value="">Všechny</option>';
  bodiesForFilters().forEach((b) => {
    const o = document.createElement("option");
    o.value = b.id;
    o.textContent = b.name;
    bodySel.appendChild(o);
  });
  if ([...bodySel.options].some((o) => o.value === keep)) bodySel.value = keep;
}

function placeholder(body) {
  return {
    id: "ph-" + body.id,
    bodyId: body.id,
    party: "Kandidátky této MČ/obvodu zatím bez importu",
    leader: "—",
    placeholder: true,
    topics: ["Obvod je v databázi", "ČSÚ listiny se nepodařilo stáhnout"],
    summary:
      "Městská část/obvod je založená, ale jmenné kandidátky 2026 sem ČSÚ web nepustil (blokace). Magistrátní a senátní listiny jsou vyplněné. Doplní se importem z volby.gov.cz.",
    results2022: { note: "doplnit z ČSÚ u této MČ" },
    promises: [],
    trackRecord: { positive: [], negative: [] },
    controversies: [],
    lustration: {
      canInfluence: ["Místní komunikace, parky, školky, odpad, parkování v MČ"],
      cannotDecide: ["Daně, důchody, armáda, celostátní zákony"],
      canAdvocate: ["Tlak na magistrát, kraj a ministerstva"],
    },
    sources: ["Geografie: oficiální členění města"],
  };
}

function lists() {
  const q = qInput.value.trim().toLowerCase();
  const showPlaceholders =
    kindSel.value === "district" ||
    data.bodies.find((b) => b.id === bodySel.value)?.kind === "district";
  const extras = showPlaceholders
    ? data.bodies
        .filter((b) => b.kind === "district")
        .filter((b) => !data.lists.some((l) => l.bodyId === b.id))
        .map(placeholder)
    : [];
  return [...data.lists, ...extras].filter((item) => {
    const body = data.bodies.find((b) => b.id === item.bodyId);
    if (!body) return false;
    if (citySel.value && body.city !== citySel.value) return false;
    if (kindSel.value && body.kind !== kindSel.value) return false;
    if (bodySel.value && item.bodyId !== bodySel.value) return false;
    if (!q) return true;
    const blob = [
      item.party,
      item.short,
      item.leader,
      item.summary,
      ...(item.topics || []),
      body.name,
      body.city,
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });
}

function resultText(item) {
  const r = item.results2022;
  if (!r) return "—";
  if (r.note && !r.percent && r.mandates == null) return r.note;
  const bits = [];
  if (r.percent != null) bits.push(`${String(r.percent).replace(".", ",")} %`);
  if (r.mandates != null) bits.push(`${r.mandates} mand.`);
  if (r.predecessor) bits.push(r.predecessor);
  if (r.note) bits.push(r.note);
  return bits.join(" · ") || "—";
}

function renderStats() {
  const cityLists = data.lists.filter((l) => data.bodies.find((b) => b.id === l.bodyId)?.kind === "city");
  const senate = data.lists.filter((l) => data.bodies.find((b) => b.id === l.bodyId)?.kind === "senate");
  const districts = data.bodies.filter((b) => b.kind === "district").length;
  $("stats").innerHTML = `
    <div><dt>Kandidátek</dt><dd>${data.lists.length}</dd></div>
    <div><dt>Magistrát + senát</dt><dd>${cityLists.length + senate.length}</dd></div>
    <div><dt>MČ / obvody</dt><dd>${districts}</dd></div>
  `;
}

function render() {
  refreshBodies();
  const items = lists();
  const dist = data.bodies.filter((b) => {
    if (b.kind !== "district") return false;
    if (citySel.value && b.city !== citySel.value) return false;
    return true;
  });
  hint.textContent = `${items.length} záznamů. Městské části/obvody: ${dist.length}. Klikni na řádek pro detail (lídr, 2022, lustrace).`;
  rows.innerHTML = items
    .map((item) => {
      const body = data.bodies.find((b) => b.id === item.bodyId);
      const kindLabel = body.kind === "senate" ? "Senát" : body.kind === "district" ? "MČ/obvod" : "Město";
      return `<tr data-id="${item.id}">
        <td>${body.city}</td>
        <td><span class="badge">${kindLabel}</span> ${body.name}</td>
        <td><strong>${item.party}</strong></td>
        <td>${item.leader}</td>
        <td>${resultText(item)}</td>
        <td class="topics">${(item.topics || []).slice(0, 3).join(" · ")}</td>
      </tr>`;
    })
    .join("");
}

function listBlock(title, arr) {
  if (!arr || !arr.length) return "";
  return `<h3>${title}</h3><ul>${arr.map((x) => `<li>${x}</li>`).join("")}</ul>`;
}

function openDetail(id) {
  const item = data.lists.find((l) => l.id === id);
  if (!item) return;
  const body = data.bodies.find((b) => b.id === item.bodyId);
  const lus = item.lustration || {};
  detail.innerHTML = `
    <div class="detail">
      <h2>${item.party}</h2>
      <p class="meta">${body.city} · ${body.name}<br>Lídr: <strong>${item.leader}</strong>${item.leaderRole ? " · " + item.leaderRole : ""}</p>
      <h3>Shrnutí srozumitelně</h3>
      <p>${item.summary}</p>
      ${listBlock("Hlavní témata", item.topics)}
      ${listBlock("Sliby z programu", item.promises)}
      <h3>Výsledky v předchozích volbách</h3>
      <p>${resultText(item)}${item.results2022?.detail ? " — " + item.results2022.detail : ""}</p>
      <h3>Co mají za sebou</h3>
      <ul>
        ${(item.trackRecord?.positive || []).map((x) => `<li class="pos">${x}</li>`).join("")}
        ${(item.trackRecord?.negative || []).map((x) => `<li class="neg">${x}</li>`).join("")}
      </ul>
      ${listBlock("Minulé kauzy a medializace", item.controversies)}
      <h3>Lustrace programu</h3>
      <div class="lus">
        <section><h4>Mohou ovlivnit</h4><ul>${(lus.canInfluence || []).map((x) => `<li>${x}</li>`).join("")}</ul></section>
        <section><h4>Nerozhodují o tom</h4><ul>${(lus.cannotDecide || []).map((x) => `<li>${x}</li>`).join("")}</ul></section>
        <section><h4>Mohou prosazovat výš</h4><ul>${(lus.canAdvocate || []).map((x) => `<li>${x}</li>`).join("")}</ul></section>
      </div>
      ${item.sources?.length ? `<h3>Zdroje</h3><ul>${item.sources.map((s) => `<li>${s}</li>`).join("")}</ul>` : ""}
    </div>
  `;
  drawer.hidden = false;
}

citySel.addEventListener("change", render);
kindSel.addEventListener("change", render);
bodySel.addEventListener("change", render);
qInput.addEventListener("input", render);
rows.addEventListener("click", (e) => {
  const tr = e.target.closest("tr");
  if (tr?.dataset.id) openDetail(tr.dataset.id);
});
$("close").addEventListener("click", () => (drawer.hidden = true));
drawer.addEventListener("click", (e) => {
  if (e.target === drawer) drawer.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") drawer.hidden = true;
});

renderStats();
render();
