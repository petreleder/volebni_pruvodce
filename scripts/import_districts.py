#!/usr/bin/env python3
"""Doplní kandidátky městských částí z otevřených dat ČSÚ (KV 2026 + výsledky 2022)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSU26 = Path("/tmp/kv2026/KV2026reg20260901_json")
CSU22 = Path("/tmp/kv2022/csv/kvros.csv")

MUNI_CAN = [
    "Místní komunikace, parkování a veřejný prostor v MČ/obvodu",
    "Školky a ZŠ, které MČ zřizuje",
    "Lokální zeleň, odpady, sportoviště a kulturní akce MČ",
    "Bytový fond a sociální služby v kompetenci MČ",
    "Rozpočet městské části / obvodu",
]
MUNI_NO = [
    "Celoměstský územní plán a metro (to je magistrát / stát)",
    "Státní daně, důchody, armáda",
    "Celostátní zákony",
]
MUNI_UP = [
    "Tlak na magistrát u velkých staveb a MHD",
    "Kraj a ministerstva u peněz a norem",
]


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def norm(s: str) -> str:
    s = (s or "").lower()
    s = s.replace("hl.m.", "").replace("hlavní město", "")
    s = re.sub(r"[^a-záčďéěíňóřšťúůýž0-9]+", "", s)
    return s


def family(name: str) -> str:
    n = name.upper()
    rules = [
        ("ANO", ("ANO",)),
        ("ODS", ("ODS",)),
        ("PIRATI", ("PIRÁT", "PIRAT")),
        ("STAN", ("STAN", "STAROST")),
        ("SPD", ("SPD",)),
        ("KDU", ("KDU", "LIDOVC")),
        ("TOP09", ("TOP 09", "TOP09")),
        ("ZELENI", ("ZELEN",)),
        ("SOCDEM", ("SOCDEM", "ČSSD", "CSSD", "SOCIÁLNÍ DEM")),
        ("KSCM", ("KSČM", "KSCM", "STAČILO", "STACILO")),
        ("AUTO", ("MOTORIST", " AUTO")),
        ("SVOBODNI", ("SVOBODN",)),
        ("PRISAHA", ("PŘÍSAH", "PRISAH")),
        ("SOBE", ("SOBĚ", "SOBE")),
    ]
    for key, needles in rules:
        if any(x in n for x in needles):
            return key
    return ""


def parse_2022():
    import csv

    out = {}
    text = CSU22.read_text("cp1250")
    rows = csv.DictReader(text.splitlines(), delimiter=";")
    for r in rows:
        kod = int(r["KODZASTUP"])
        out.setdefault(kod, []).append(
            {
                "name": r["NAZEVCELK"].strip('"'),
                "short": r["ZKRATKAO8"].strip('"'),
                "percent": float(str(r["PROCHLSTR"]).replace(",", ".") or 0),
                "mandates": int(r["MAND_STR"] or 0),
            }
        )
    return out


def best_2022(kod: int, party: str, table: dict):
    rows = table.get(kod) or []
    pn, pf = norm(party), family(party)
    exact = [r for r in rows if norm(r["name"]) == pn]
    if exact:
        return exact[0]
    fam = [r for r in rows if pf and family(r["name"]) == pf]
    if len(fam) == 1:
        return fam[0]
    if fam:
        return max(fam, key=lambda r: r["percent"])
    return None


def leader_name(c):
    parts = [c.get("TITULPRED") or "", c.get("JMENO") or "", c.get("PRIJMENI") or ""]
    za = c.get("TITULZA")
    name = " ".join(p for p in parts if p).strip()
    if za:
        name = f"{name}, {za}"
    return name


def main():
    data = load_json(ROOT / "data/volby.json")
    bodies = {norm(b["name"]): b for b in data["bodies"] if b["kind"] == "district"}
    city_profiles = {}
    for item in data["lists"]:
        body = next(b for b in data["bodies"] if b["id"] == item["bodyId"])
        if body["kind"] == "city":
            city_profiles.setdefault(body["city"], []).append(item)

    zast = load_json(CSU26 / "kvrzcoco.json")["polozky"]
    lists = load_json(CSU26 / "kvros.json")["polozky"]
    cands = load_json(CSU26 / "kvrk.json")["polozky"]
    res22 = parse_2022()

    wanted_codes = {}
    for z in zast:
        if z["TYPZASTUP"] != 2:
            continue
        b = bodies.get(norm(z["NAZEVZAST"]))
        if not b:
            continue
        wanted_codes[z["KODZASTUP"]] = b
        b["csuCode"] = z["KODZASTUP"]
        b["seats"] = z.get("MANDATY")

    leaders = {}
    for c in cands:
        if c["KODZASTUP"] not in wanted_codes:
            continue
        if c.get("PORCISLO") != 1 or c.get("PLATNOST") != "A":
            continue
        leaders[(c["KODZASTUP"], c["OSTRANA"])] = c

    existing = {(x["bodyId"], norm(x["party"])) for x in data["lists"]}
    added = []
    for row in lists:
        kod = row["KODZASTUP"]
        if kod not in wanted_codes:
            continue
        body = wanted_codes[kod]
        party = row["NAZEVCELK"]
        key = (body["id"], norm(party))
        if key in existing:
            continue
        cand = leaders.get((kod, row["OSTRANA"]))
        leader = leader_name(cand) if cand else "—"
        prev = best_2022(kod, party, res22)
        inherited = None
        fam = family(party)
        if fam:
            for p in city_profiles.get(body["city"], []):
                if family(p["party"]) == fam:
                    inherited = p
                    break
        results = {"note": "v tomto obvodu v roce 2022 pod touto značkou nenalezeno"}
        if prev:
            results = {
                "percent": prev["percent"],
                "mandates": prev["mandates"],
                "predecessor": prev["name"],
                "detail": f"Výsledek 2022 v tomto zastupitelstvu: {prev['percent']} %, {prev['mandates']} mandát(ů).",
            }
        summary = (
            f"{party} kandiduje do zastupitelstva {body['name']}. "
            f"Lídr listiny: {leader}."
        )
        if inherited:
            summary += " Programově jde o místní listinu příbuznou magistrátní značce — kompetence je ale jen MČ/obvod, ne celé město."
        item = {
            "id": f"mc-{kod}-{row['OSTRANA']}",
            "bodyId": body["id"],
            "party": party,
            "short": row.get("ZKRATKAO8") or row.get("ZKRATKAO30") or party,
            "leader": leader,
            "leaderRole": (cand or {}).get("POVOLANI") or "",
            "results2022": results,
            "topics": (inherited or {}).get("topics") or ["Lokální správa MČ/obvodu"],
            "promises": (inherited or {}).get("promises") or [],
            "summary": summary,
            "trackRecord": (inherited or {}).get("trackRecord")
            or {"positive": [], "negative": []},
            "controversies": (inherited or {}).get("controversies") or [],
            "lustration": {
                "canInfluence": MUNI_CAN,
                "cannotDecide": MUNI_NO,
                "canAdvocate": MUNI_UP,
            },
            "sources": ["ČSÚ otevřená data KV 2026 (kvrk/kvros, stav 1. 9. 2026)", "ČSÚ KV 2022 kvros"],
        }
        added.append(item)
        existing.add(key)

    data["lists"].extend(added)
    data["meta"]["districtImport"] = {
        "listsAdded": len(added),
        "districtsMatched": len(wanted_codes),
        "source": "volby.gov.cz opendata kv2026 + kv2022",
    }
    js = "window.VOLBY = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
    (ROOT / "data.js").write_text(js, encoding="utf-8")
    (ROOT / "data/volby.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"added {len(added)} district lists across {len(wanted_codes)} bodies; total lists {len(data['lists'])}")


if __name__ == "__main__":
    main()
