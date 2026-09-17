#!/usr/bin/env python3
"""Doplní jména na kandidátkách z API Programy do voleb (ČSÚ KV 2026, CC BY 4.0)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path("/tmp/pdv_kv2026")
CITY_CSU = {"praha": 554782, "brno": 582786, "pardubice": 555134}
SOURCE = "Programy do voleb / ČSÚ KV 2026 (CC BY 4.0, programydovoleb.cz)"


def norm(s: str) -> str:
    s = (s or "").lower()
    return re.sub(r"[^a-záčďéěíňóřšťúůýž0-9]+", "", s)


def payload(code: int) -> dict:
    raw = json.loads((CACHE / f"{code}.json").read_text(encoding="utf-8"))
    lst = raw.get("list") or []
    if not lst:
        raise SystemExit(f"empty PDV payload for {code}")
    return lst[0]


def cand_name(c: dict) -> str:
    parts = [c.get("TITULPRED") or "", c.get("JMENO") or "", c.get("PRIJMENI") or ""]
    name = " ".join(p for p in parts if p).strip()
    za = c.get("TITULZA")
    if za:
        name = f"{name}, {za}"
    return name


def compact(c: dict) -> dict:
    return {
        "order": c.get("PORCISLO"),
        "name": cand_name(c),
        "age": c.get("VEK"),
        "job": c.get("POVOLANI") or "",
        "home": c.get("BYDLISTEN") or "",
    }


def ostrana_from_id(list_id: str):
    m = re.match(r"mc-(\d+)-(-?\d+)$", list_id or "")
    if m:
        return int(m.group(1)), int(m.group(2))
    return None, None


def same_ticket(item: dict, party: dict) -> bool:
    pn, on = norm(party["NAZEV"]), norm(item["party"])
    if not pn or not on:
        return False
    if pn == on:
        return True
    shorter = pn if len(pn) <= len(on) else on
    if len(shorter) >= 8 and (pn in on or on in pn):
        return True
    n = min(len(pn), len(on), 28)
    if n >= 16 and pn[:n] == on[:n]:
        return True
    keywords = (
        "cibulka",
        "pravyblok",
        "naplno",
        "urza",
        "mimozemstan",
        "prahasobě",
        "senproprahu",
        "spdproprahu",
        "progresivnipardubice",
        "brnobrňankám",
        "spdspodporoutrikolory",
    )
    return any(k in pn and k in on for k in keywords)


def match_party(item: dict, strany: list, kod: int | None) -> dict | None:
    _, os = ostrana_from_id(item["id"])
    if os is not None:
        hit = next((s for s in strany if s.get("OSTRANA") == os and s.get("KODZASTUP") == kod), None)
        if hit:
            return hit
    hits = [s for s in strany if same_ticket(item, s)]
    if len(hits) == 1:
        return hits[0]
    if len(hits) > 1:
        with_pos = [s for s in hits if (s.get("POR_STR_HL") or 0) > 0]
        return (with_pos or hits)[0]
    return None


def ballot_no(party: dict):
    n = party.get("POR_STR_HL")
    if isinstance(n, int) and 1 <= n <= 80:
        return n
    return None


def main():
    if not CACHE.exists():
        raise SystemExit(f"missing PDV cache {CACHE}")
    data = json.loads((ROOT / "data/volby.json").read_text(encoding="utf-8"))
    filled = 0
    names = 0
    missing = []
    for body in data["bodies"]:
        if body["kind"] == "district":
            code = int(body["csuCode"])
        elif body["kind"] == "city":
            code = CITY_CSU[body["id"]]
        else:
            continue
        pl = payload(code)
        strany = pl.get("$strany") or []
        by_os: dict[int, list] = {}
        for c in pl.get("$kandidati") or []:
            by_os.setdefault(c["OSTRANA"], []).append(c)
        for item in data["lists"]:
            if item["bodyId"] != body["id"]:
                continue
            party = match_party(item, strany, code if body["kind"] == "district" else None)
            if not party:
                missing.append((body["name"], item["party"], item["id"]))
                continue
            cands = sorted(by_os.get(party["OSTRANA"]) or [], key=lambda x: x.get("PORCISLO") or 0)
            item["candidates"] = [compact(c) for c in cands]
            bn = ballot_no(party)
            if bn:
                item["ballotNo"] = bn
            src = list(item.get("sources") or [])
            if SOURCE not in src:
                src.append(SOURCE)
                item["sources"] = src
            filled += 1
            names += len(cands)

    data["meta"]["updated"] = "2026-09-15"
    data["meta"]["candidates"] = {
        "listsFilled": filled,
        "people": names,
        "source": SOURCE,
        "note": "Jména z registrace ČSÚ přes Programy do voleb. Prázdné PDV záznamy bez kandidátů se nepřidávají.",
    }
    js = "window.VOLBY = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
    (ROOT / "data.js").write_text(js, encoding="utf-8")
    (ROOT / "data/volby.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"filled {filled} lists, {names} candidates; unmatched {len(missing)}")
    for row in missing:
        print(" unmatched", row)


if __name__ == "__main__":
    main()
