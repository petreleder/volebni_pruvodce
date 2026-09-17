const data = window.VOLBY;
const G = window.GUIDE;
const KEY = "volby2026-loc";

const $ = (id) => document.getElementById(id);
const hdrCity = $("hdr-city");
const hdrDistrict = $("hdr-district");
const kindSel = $("kind");
const bodySel = $("body");
const qInput = $("q");
const rows = $("rows");
const hint = $("hint");
const drawer = $("drawer");
const detail = $("detail");
const quiz = $("quiz");
const results = $("results");

const cities = ["Praha", "Brno", "Pardubice"];
let loc = { city: "", districtId: "" };
let answers = {};
let lastQuestions = [];
let lastAskQuery = "";

const ASK_EXAMPLES = [
  "Nemám kde parkovat u domu",
  "Chybí školka a kapacity škol",
  "Vadí mi Airbnb v centru",
  "Chci víc městských bytů",
  "Málo stromů a zeleně",
  "MHD je drahá a málo jezdí",
];

const ASK_STOP = new Set(
  "a i na v ve se si ze z do k ke o u je to co jak pro pri pred po za od aby kdyz jestli mam mame nemam nemame me muj ma ten ta ty tenhle tahle tohle nejaka nejaky nejake strana strany problem problemy resi resit reseni by bych chtel chtela chci muze muzu jde my vas nebo ani uz jeste tak tady tam kde kdy proc protoze proto tento tato toto svuj svoji ho ji jim nam vam jejich jeho jeji nas nase vase ze li at az jen pouze taky take moc hodne malo vic mene da mi ti mu nam vam lidi lide vec veci centrum centra centru mesto praha brno pardubice vadi trapi".split(" ")
);

const ASK_SYN = [
  ["parkov", "stani", "garaz", "rezident", "p+r"],
  ["byt", "bydlen", "najem", "developer", "pds", "druzstev", "sidlist"],
  ["airbnb", "kratkodob", "pronaj", "turism", "turist"],
  ["strom", "zelen", "stin", "parky", "parku", "parkem", "hrist", "verejn"],
  ["skolk", "skol", "skolstv"],
  ["metro", "tramvaj", "autobus", "dpp", "mhd", "lanovk", "trolej", "salinkart", "jizdn"],
  ["uzavir", "omezen", "restrik", "cyklostez", "cyklo", "pesi"],
  ["okruh", "silnic", "doprav", "ridic"],
  ["bezpec", "poradek", "strazn", "polici", "kriminal", "kamer", "cistot", "uklid"],
  ["odpad", "kontejner", "triden"],
  ["senior", "duchod", "social", "terenn"],
  ["klima", "vedr", "hork", "povodn"],
  ["letist", "nadrazi", "vrt", "zeleznic"],
  ["poplat", "dan"],
  ["zvirat", "utul"],
  ["sportov", "stadion"],
];

function districts(city) {
  return data.bodies
    .filter((b) => b.city === city && b.kind === "district")
    .sort((a, b) => a.name.localeCompare(b.name, "cs"));
}

function fillCitySelect(sel, withEmpty) {
  sel.innerHTML = withEmpty ? '<option value="">Vyber město</option>' : "";
  cities.forEach((c) => {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    sel.appendChild(o);
  });
}

function fillDistrictSelect(sel, city, withEmpty) {
  sel.innerHTML = "";
  if (!city) {
    sel.innerHTML = '<option value="">Nejdřív město</option>';
    sel.disabled = true;
    return;
  }
  sel.disabled = false;
  if (withEmpty) {
    const z = document.createElement("option");
    z.value = "";
    z.textContent = "Vyber obvod";
    sel.appendChild(z);
  }
  districts(city).forEach((b) => {
    const o = document.createElement("option");
    o.value = b.id;
    o.textContent = b.note ? `${b.name} (${b.note})` : b.name;
    sel.appendChild(o);
  });
}

function saveLoc() {
  localStorage.setItem(KEY, JSON.stringify(loc));
}

function loadLoc() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

function bodyById(id) {
  return data.bodies.find((b) => b.id === id);
}

function cityBody(city) {
  return data.bodies.find((b) => b.city === city && b.kind === "city");
}

function listsFor(bodyId) {
  return data.lists.filter((l) => l.bodyId === bodyId);
}

function setLoc(city, districtId, persist) {
  loc = { city, districtId };
  hdrCity.value = city;
  fillDistrictSelect(hdrDistrict, city, false);
  if (districtId && [...hdrDistrict.options].some((o) => o.value === districtId)) {
    hdrDistrict.value = districtId;
  } else if (hdrDistrict.options.length) {
    loc.districtId = hdrDistrict.value;
  }
  if (persist !== false) saveLoc();
  answers = {};
  renderGuide();
  renderAskIntro();
  syncTableFilters();
  renderTable();
  renderSenate();
  if (lastAskQuery) runAsk(lastAskQuery, false);
}

function renderGuide() {
  const district = bodyById(loc.districtId);
  const city = cityBody(loc.city);
  const nCity = listsFor(city?.id).length;
  const nDist = listsFor(loc.districtId).length;
  $("guide-intro").textContent = district
    ? `Otázky jsou pro ${loc.city}. Po vyplnění uvidíš procentní shodu se zastupitelstvem města (${nCity} listin) i s ${district.name} (${nDist} listin). „Nevím“ se do výpočtu nepočítá.`
    : "";
  lastQuestions = G.questionsFor(loc.city, loc.districtId);
  quiz.innerHTML = lastQuestions
    .map((q, i) => {
      const opts =
        q.type === "likert"
          ? G.LIKERT.map(
              (o) =>
                `<button type="button" data-q="${q.id}" data-val="${o.value ?? "skip"}" aria-pressed="${String(answers[q.id]) === String(o.value ?? "skip")}">${o.label}</button>`
            ).join("")
          : q.options
              .map(
                (o) =>
                  `<button type="button" data-q="${q.id}" data-val="${o.id}" aria-pressed="${answers[q.id] === o.id}">${o.label}</button>`
              )
              .join("");
      return `<div class="q">
        <h3>${i + 1}. ${q.text}</h3>
        <div class="opts ${q.type === "choice" ? "stack" : ""}">${opts}</div>
      </div>`;
    })
    .join("");
  results.hidden = true;
  results.innerHTML = "";
}

function rankBlock(title, ranked, emptyNote) {
  if (!ranked.length) return `<div class="rank"><h2>${title}</h2><p>${emptyNote}</p></div>`;
  const top = ranked[0];
  const rowsHtml = ranked
    .map((r) => {
      const why = r.why.length ? `<p class="why">${r.why[0]}</p>` : "";
      return `<div class="bar-row" data-id="${r.item.id}">
        <div><strong>${r.item.party}</strong><br>${r.item.leader || ""}${why}</div>
        <div class="pct">${r.percent} %</div>
        <div class="bar"><span style="width:${r.percent}%"></span></div>
      </div>`;
    })
    .join("");
  return `<div class="rank">
    <h2>${title}</h2>
    <p>Nejvyšší shoda: <strong>${top.item.party}</strong> (${top.percent} %) · lídr ${top.item.leader}.</p>
    ${rowsHtml}
  </div>`;
}

function showResults() {
  const answered = lastQuestions.filter((q) => {
    const a = answers[q.id];
    return a != null && a !== "" && a !== "skip";
  }).length;
  if (!answered) {
    results.hidden = false;
    results.innerHTML = `<p class="note">Vyber aspoň jednu odpověď kromě „Nevím“.</p>`;
    return;
  }
  const city = cityBody(loc.city);
  const district = bodyById(loc.districtId);
  const cityRank = G.scoreLists(listsFor(city.id), lastQuestions, answers);
  const distLists = listsFor(loc.districtId);
  const distRank = G.scoreLists(distLists, lastQuestions, answers);
  const few =
    distLists.length <= 2
      ? `<p class="note">V ${district.name} kandiduje ${distLists.length === 1 ? "jen jedna listina" : "jen dvě listiny"}. Procenta tu spíš popisují, jak sedí k tvým odpovědím, než že bys měl z čeho vybírat.</p>`
      : "";
  results.hidden = false;
  results.innerHTML =
    `<p class="note">Započteno ${answered} z ${lastQuestions.length} otázek. Klikni na listinu pro detail.</p>` +
    few +
    rankBlock(`Zastupitelstvo města — ${loc.city}`, cityRank, "Chybí listiny města.") +
    rankBlock(district.name, distRank, "V tomto obvodu nejsou v datech kandidátky.");
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

quiz.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-q]");
  if (!btn) return;
  answers[btn.dataset.q] = btn.dataset.val;
  quiz.querySelectorAll(`button[data-q="${btn.dataset.q}"]`).forEach((b) => {
    b.setAttribute("aria-pressed", String(b === btn));
  });
});

$("submit-quiz").addEventListener("click", showResults);
$("reset-quiz").addEventListener("click", () => {
  answers = {};
  renderGuide();
});

results.addEventListener("click", (e) => {
  const row = e.target.closest("[data-id]");
  if (row) openDetail(row.dataset.id);
});

function syncTableFilters() {
  bodySel.innerHTML = '<option value="">Všechny v tomto městě</option>';
  data.bodies
    .filter((b) => b.city === loc.city)
    .forEach((b) => {
      const o = document.createElement("option");
      o.value = b.id;
      o.textContent = b.name;
      bodySel.appendChild(o);
    });
  bodySel.value = "";
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

function renderTable() {
  const q = qInput.value.trim().toLowerCase();
  const items = data.lists.filter((item) => {
    const body = bodyById(item.bodyId);
    if (!body || body.city !== loc.city) return false;
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
      ...(item.candidates || []).map((c) => c.name),
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });
  hint.textContent = `${items.length} záznamů pro ${loc.city}. Klikni na řádek pro detail.`;
  rows.innerHTML = items
    .map((item) => {
      const body = bodyById(item.bodyId);
      const kindLabel = body.kind === "senate" ? "Senát" : body.kind === "district" ? "MČ/obvod" : "Město";
      return `<tr data-id="${item.id}">
        <td>${body.city}</td>
        <td><span class="badge">${kindLabel}</span> ${body.name}</td>
        <td><strong>${item.party}</strong></td>
        <td>${item.leader}</td>
        <td>${resultText(item)}</td>
        <td>${(item.topics || []).slice(0, 3).join(" · ")}</td>
      </tr>`;
    })
    .join("");
}

function renderSenate() {
  const box = $("senate-box");
  const info = G.senateFor(loc.city, loc.districtId);
  const district = bodyById(loc.districtId);
  if (info.none) {
    box.innerHTML = `<div class="note"><h2 style="margin-top:0">${info.title}</h2><p>${info.note}</p>
      <p>Bydlíš v ${district ? district.name : loc.city}. Komunální volby (město i obvod) se konají všude.</p></div>`;
    return;
  }
  const body = bodyById(info.id);
  const cands = listsFor(info.id);
  const warn = info.note ? `<p class="note">${info.note}</p>` : "";
  box.innerHTML = `
    <p>Podle ${district.name} spadáš do <strong>${body.name}</strong>. Volby do Senátu: 9.–10. 10. 2026, případné 2. kolo 16.–17. 10.</p>
    ${warn}
    <div class="cards">
      ${cands
        .map(
          (c) => `<article class="card" data-id="${c.id}">
            <h3>${c.leader}</h3>
            <p>${c.party}</p>
            <p>${resultText(c)}</p>
          </article>`
        )
        .join("")}
    </div>`;
}

$("senate-box").addEventListener("click", (e) => {
  const card = e.target.closest("[data-id]");
  if (card) openDetail(card.dataset.id);
});

function listBlock(title, arr) {
  if (!arr || !arr.length) return "";
  return `<h3>${title}</h3><ul>${arr.map((x) => `<li>${x}</li>`).join("")}</ul>`;
}

function candidateLine(c) {
  const bits = [c.age ? `${c.age} let` : "", c.job, c.home].filter(Boolean);
  return `<li><strong>${c.order}. ${c.name}</strong>${bits.length ? " · " + bits.join(" · ") : ""}</li>`;
}

function candidatesBlock(item) {
  const cands = item.candidates || [];
  if (!cands.length) return "";
  const n = cands.length;
  return `<h3>Kandidátní listina (${n} ${n === 1 ? "jméno" : n < 5 ? "jména" : "jmen"})</h3>
    <ol class="cands">${cands.map(candidateLine).join("")}</ol>`;
}

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fold(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function stem(word) {
  let w = fold(word).replace(/[^a-z0-9+]+/g, "");
  if (w.length <= 4) return w;
  const cuts = ["ovanim", "ovani", "ovane", "ovat", "nich", "nimi", "emi", "ech", "ich", "ami", "ove", "ovi", "ost", "skych", "skeho", "skou", "sky", "eni", "ani", "ach"];
  for (const c of cuts) {
    if (w.length - c.length >= 4 && w.endsWith(c)) return w.slice(0, -c.length);
  }
  return w;
}

function askTokens(text) {
  const raw = fold(text)
    .split(/[^a-z0-9+]+/)
    .map(stem)
    .filter((w) => w && w.length >= 3 && !ASK_STOP.has(w));
  const extra = new Set();
  for (const w of raw) {
    for (const group of ASK_SYN) {
      if (group.some((g) => w === g || (g.length >= 4 && w.startsWith(g)) || (w.length >= 4 && g.startsWith(w) && w.length >= g.length))) {
        group.forEach((g) => extra.add(g));
      }
    }
  }
  return [...new Set([...raw, ...extra])];
}

function fieldHits(text, tokens) {
  const f = fold(text);
  if (!f) return 0;
  let n = 0;
  for (const t of tokens) {
    if (t.length >= 4 ? f.includes(t) : f.split(/[^a-z0-9+]+/).includes(t)) n += 1;
  }
  return n;
}

function bestSnippets(lines, tokens, limit) {
  return (lines || [])
    .map((line) => ({ line, hits: fieldHits(line, tokens) }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.line.length - b.line.length)
    .slice(0, limit)
    .map((x) => x.line);
}

function askLists() {
  const city = cityBody(loc.city);
  const district = bodyById(loc.districtId);
  const senate = G.senateFor(loc.city, loc.districtId);
  const ids = new Set([city?.id, district?.id, senate?.none ? null : senate?.id].filter(Boolean));
  return data.lists.filter((item) => ids.has(item.bodyId));
}

function scoreAskItem(item, tokens) {
  const lus = item.lustration || {};
  const promises = item.promises || [];
  const topics = item.topics || [];
  const summary = item.summary || "";
  let score = 0;
  score += fieldHits(promises.join(" "), tokens) * 5;
  score += fieldHits(topics.join(" "), tokens) * 4;
  score += fieldHits(summary, tokens) * 2;
  score += fieldHits((lus.canInfluence || []).join(" "), tokens) * 2;
  score += fieldHits((lus.canAdvocate || []).join(" "), tokens);
  const solutions = bestSnippets(promises, tokens, 2);
  if (!solutions.length) solutions.push(...bestSnippets(topics, tokens, 2));
  if (!solutions.length) {
    const sent = summary.split(/(?<=[.!?])\s+/).filter(Boolean);
    solutions.push(...bestSnippets(sent, tokens, 1));
  }
  const caveats = bestSnippets(lus.cannotDecide || [], tokens, 1);
  return { item, score, solutions, caveats };
}

function renderAskIntro() {
  const district = bodyById(loc.districtId);
  const el = $("ask-intro");
  if (!el) return;
  el.textContent = district
    ? `Napiš, co tě v ${loc.city} / ${district.name} trápí. Prohledám sliby a témata zastupitelstva města, tvé městské části a případně senátu — nemusíš číst programy jednu po druhé. Shoda je podle veřejných výpisků programů 2026, ne podle toho, co strana reálně prosadí.`
    : "Nejdřív vyber město a obvod.";
}

function renderAskExamples() {
  const box = $("ask-examples");
  if (!box || box.dataset.ready) return;
  box.innerHTML = ASK_EXAMPLES.map((q) => `<button type="button" class="ghost" data-ask="${esc(q)}">${esc(q)}</button>`).join("");
  box.dataset.ready = "1";
}

function runAsk(raw, persist) {
  const q = (raw || "").trim();
  const box = $("ask-results");
  if (persist !== false) lastAskQuery = q;
  if (!q) {
    box.innerHTML = `<p class="note">Napiš konkrétní problém — parkování, školka, Airbnb, zeleň, MHD…</p>`;
    return;
  }
  const tokens = askTokens(q);
  if (!tokens.length) {
    box.innerHTML = `<p class="note">Zkus to popsat obyčejnými slovy, třeba „parkování u domu“ nebo „málo školek“.</p>`;
    return;
  }
  const ranked = askLists()
    .map((item) => scoreAskItem(item, tokens))
    .filter((r) => r.score > 0 && r.solutions.length)
    .sort((a, b) => b.score - a.score || a.item.party.localeCompare(b.item.party, "cs"));
  if (!ranked.length) {
    box.innerHTML = `<p class="note">V programech pro ${esc(loc.city)} se k „${esc(q)}“ nenašel výslovný slib. Zkus jiná slova, nebo se podívej do srovnávací tabulky.</p>`;
    return;
  }
  const top = ranked[0];
  const topBody = bodyById(top.item.bodyId);
  const kindLabel = topBody.kind === "senate" ? "Senát" : topBody.kind === "district" ? topBody.name : `zastupitelstvo ${loc.city}`;
  const others = ranked.slice(1, 6);
  box.innerHTML = `
    <p class="note">Nejvíc to v programu řeší <strong>${esc(top.item.party)}</strong> (${esc(kindLabel)}, lídr ${esc(top.item.leader)}).</p>
    <article class="ask-hit" data-id="${esc(top.item.id)}">
      <h3>${esc(top.item.party)}</h3>
      <p class="meta">${esc(topBody.name)} · ${esc(top.item.leader)}</p>
      <p class="sol"><strong>Řešení v programu:</strong> ${esc(top.solutions.join(" · "))}</p>
      ${top.caveats.length ? `<p class="caveat">Pozor: ${esc(top.caveats[0])} — tohle zastupitelstvo samo neschválí.</p>` : ""}
    </article>
    ${
      others.length
        ? `<h3>Další listiny, které se toho dotýkají</h3>` +
          others
            .map((r) => {
              const b = bodyById(r.item.bodyId);
              return `<article class="ask-hit" data-id="${esc(r.item.id)}">
                <h3>${esc(r.item.party)}</h3>
                <p class="meta">${esc(b.name)} · ${esc(r.item.leader)}</p>
                <p class="sol">${esc(r.solutions[0] || "")}</p>
              </article>`;
            })
            .join("")
        : ""
    }
    <p class="hint">Klikni na listinu pro celý program. Hledání je v ${esc(loc.city)} a ${esc(bodyById(loc.districtId)?.name || "tvém obvodu")}.</p>
  `;
}

function openDetail(id) {
  const item = data.lists.find((l) => l.id === id);
  if (!item) return;
  const body = bodyById(item.bodyId);
  const lus = item.lustration || {};
  detail.innerHTML = `
    <div class="detail">
      <h2>${item.party}</h2>
      <p class="meta">${body.city} · ${body.name}${item.ballotNo ? " · č. " + item.ballotNo : ""}<br>Lídr: <strong>${item.leader}</strong>${item.leaderRole ? " · " + item.leaderRole : ""}</p>
      <h3>Shrnutí srozumitelně</h3>
      <p>${item.summary}</p>
      ${candidatesBlock(item)}
      ${listBlock("Hlavní témata", item.topics)}
      ${listBlock("Sliby z programu", item.promises)}
      <h3>Výsledky v předchozích volbách</h3>
      <p>${resultText(item)}${item.results2022?.detail ? " — " + item.results2022.detail : ""}</p>
      <h3>Co mají za sebou</h3>
      <ul>
        ${(item.trackRecord?.positive || []).map((x) => `<li>${x}</li>`).join("")}
        ${(item.trackRecord?.negative || []).map((x) => `<li>${x}</li>`).join("")}
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

function setTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-on", t.dataset.tab === name));
  $("panel-guide").hidden = name !== "guide";
  $("panel-ask").hidden = name !== "ask";
  $("panel-table").hidden = name !== "table";
  $("panel-senate").hidden = name !== "senate";
  if (name === "table") renderTable();
  if (name === "senate") renderSenate();
  if (name === "ask") {
    renderAskIntro();
    renderAskExamples();
  }
}

document.querySelectorAll(".tab").forEach((t) => {
  t.addEventListener("click", () => setTab(t.dataset.tab));
});

hdrCity.addEventListener("change", () => {
  const first = districts(hdrCity.value)[0];
  setLoc(hdrCity.value, first?.id || "", true);
});
hdrDistrict.addEventListener("change", () => setLoc(hdrCity.value, hdrDistrict.value, true));
kindSel.addEventListener("change", renderTable);
bodySel.addEventListener("change", renderTable);
qInput.addEventListener("input", renderTable);
rows.addEventListener("click", (e) => {
  const tr = e.target.closest("tr");
  if (tr?.dataset.id) openDetail(tr.dataset.id);
});
$("ask-form").addEventListener("submit", (e) => {
  e.preventDefault();
  runAsk($("ask-q").value, true);
});
$("ask-examples").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-ask]");
  if (!btn) return;
  $("ask-q").value = btn.dataset.ask;
  runAsk(btn.dataset.ask, true);
});
$("ask-results").addEventListener("click", (e) => {
  const hit = e.target.closest("[data-id]");
  if (hit) openDetail(hit.dataset.id);
});
$("close").addEventListener("click", () => (drawer.hidden = true));
drawer.addEventListener("click", (e) => {
  if (e.target === drawer) drawer.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") drawer.hidden = true;
});

const overlay = $("loc-overlay");
const startCity = $("start-city");
const startDistrict = $("start-district");
const startOk = $("start-ok");

function refreshStart() {
  fillDistrictSelect(startDistrict, startCity.value, true);
  startOk.disabled = !(startCity.value && startDistrict.value);
}
startCity.addEventListener("change", refreshStart);
startDistrict.addEventListener("change", () => {
  startOk.disabled = !(startCity.value && startDistrict.value);
});
startOk.addEventListener("click", () => {
  setLoc(startCity.value, startDistrict.value, true);
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");
});

fillCitySelect(hdrCity, false);
fillCitySelect(startCity, true);

const saved = loadLoc();
if (saved?.city && saved?.districtId && bodyById(saved.districtId)) {
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");
  setLoc(saved.city, saved.districtId, false);
} else {
  overlay.hidden = false;
  overlay.setAttribute("aria-hidden", "false");
  fillDistrictSelect(hdrDistrict, "Praha", false);
}
