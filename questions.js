/* Volební průvodce: otázky, pozice stran a senátní obvody 2026. */
(function () {
  function family(name) {
    const n = (name || "").toUpperCase();
    const rules = [
      ["AUTO", ["MOTORIST", " AUTO"]],
      ["PIRATI", ["PIRÁT", "PIRAT", "TU!", "FAKT BRNO"]],
      ["SOBE", ["SOBĚ", "SOBE"]],
      ["SPOLU", ["SPOLU"]],
      ["STAN", ["STAN", "STAROST"]],
      ["KDU", ["KDU", "LIDOVC"]],
      ["ODS", ["ODS", "OBČANSKÁ DEMOKRATICK", "OBCANSKA DEMOKRATICK", "NEJLEPŠÍ ADRESA", "NEJLEPSI ADRESA"]],
      ["TOP09", ["TOP 09", "TOP09"]],
      ["ANO", ["ANO"]],
      ["SPD", ["SPD"]],
      ["ZELENI", ["ZELEN", "ŽÍT BRNO", "ZIT BRNO"]],
      ["SOCDEM", ["SOCDEM", "SOCIÁLNÍ DEM", "SOCIALNI DEM"]],
      ["KSCM", ["KSČM", "KSCM", "STAČILO", "STACILO", "RESTART"]],
      ["SVOBODNI", ["SVOBODN", "NAPLNO", "TRIKOLOR"]],
      ["PRISAHA", ["PŘÍSAH", "PRISAH"]],
      ["SEN21", ["SEN 21", "SEN PRO", "SENPROCESKO"]],
      ["LUZANKY", ["LUŽÁNK", "LUZANK"]],
      ["KLIDEM", ["BRNOKLID", "KLIDEM"]],
      ["NOVEBRNO", ["NOVÉ BRNO", "NOVE BRNO"]],
      ["PROG_PCE", ["PROGRESIVNÍ PARDUBICE", "PROGRESIVNI PARDUBICE"]],
      ["ZIJEME", ["ŽIJEME PARDUBICE", "ZIJEME PARDUBICE"]],
      ["SRDCEM", ["SRDCEM PRO PARDUBICE"]],
      ["NASE_PCE", ["NAŠE PARDUBICE", "NASE PARDUBICE"]],
      ["LEVICE", ["LEVICE"]],
      ["DSZ", ["PRÁVA ZVÍŘAT", "PRAVA ZVIRAT", "DSZ"]],
      ["GEN", ["GEN ", "GEN S PODPOROU"]],
      ["TEAM", ["JSME PRAHA", "TEAM"]],
      ["LITACKA", ["LÍTAČK", "LITACK"]],
      ["URZA", ["URZA"]],
      ["CIBULKA", ["PRAVÝ BLOK", "PRAVY BLOK", "CIBULKA"]],
      ["LZPL", ["LEPŠÍ ŽIVOT", "LEPSI ZIVOT"]],
      ["VOLUNTIA", ["VOLUNTIA"]],
    ];
    for (const [key, needles] of rules) {
      if (needles.some((x) => n.includes(x))) return key;
    }
    return "LOKAL";
  }

  const LIKERT = [
    { id: "yes2", label: "Rozhodně ano", value: 2 },
    { id: "yes1", label: "Spíše ano", value: 1 },
    { id: "skip", label: "Nevím", value: null },
    { id: "no1", label: "Spíše ne", value: -1 },
    { id: "no2", label: "Rozhodně ne", value: -2 },
  ];

  function L(id, text, positions) {
    return { id, type: "likert", text, positions };
  }
  function C(id, text, options) {
    return { id, type: "choice", text, options };
  }
  function opt(id, label, families) {
    return { id, label, families };
  }

  const PRAHA = [
    L("p-byty", "Praha má stavět víc městských nájemních bytů, i když to zatíží rozpočet.", {
      PIRATI: 2, SOBE: 2, ZELENI: 2, LEVICE: 2, STAN: 1, SEN21: 1, SPOLU: 1, ODS: 1, TOP09: 1,
      KDU: 1, TEAM: 1, LITACKA: 1, ANO: 0, KSCM: 1, SOCDEM: 1, AUTO: -1, SPD: -1, SVOBODNI: -1,
    }),
    L("p-park", "U nové výstavby u metra by se mělo vyžadovat méně povinných parkovacích míst.", {
      PIRATI: 2, ZELENI: 2, SOBE: 1, LEVICE: 1, STAN: 0, SEN21: 0, SPOLU: -1, ODS: -1, TOP09: -1,
      ANO: -1, AUTO: -2, SPD: -2, SVOBODNI: -2, TEAM: 0,
    }),
    L("p-airbnb", "Krátkodobé pronájmy typu Airbnb v centru se mají výrazně omezit.", {
      PIRATI: 2, SOBE: 2, ZELENI: 2, LEVICE: 2, SEN21: 1, STAN: 1, KDU: 1, TEAM: 1, SPOLU: 0,
      ODS: 0, ANO: 0, AUTO: -1, SPD: 0, SVOBODNI: -1,
    }),
    L("p-uzavirky", "Uzavírky a dopravní omezení se mají spíš omezit, i za cenu pomalejší cyklostezky nebo tramvaje.", {
      SPOLU: 2, ODS: 2, TOP09: 1, ANO: 1, AUTO: 2, SPD: 2, SVOBODNI: 2, STAN: 1, SEN21: 0,
      PIRATI: -2, SOBE: -2, ZELENI: -2, LEVICE: -1, TEAM: 0,
    }),
    L("p-prodej", "Městské části by neměly smět rozprodávat byty, které spravují.", {
      PIRATI: 2, LEVICE: 2, SOBE: 1, ZELENI: 1, STAN: 1, KSCM: 1, SEN21: 1, SPOLU: 0, ODS: 0,
      ANO: 0, AUTO: -1, SPD: -1, TEAM: 0,
    }),
    L("p-klima", "Do stromů, stínu a péče o duševní zdraví má jít víc peněz než do silnic.", {
      PIRATI: 2, SOBE: 2, ZELENI: 2, LEVICE: 2, DSZ: 2, STAN: 0, SEN21: 1, KDU: 0, SPOLU: -1,
      ODS: -1, ANO: -1, AUTO: -2, SPD: -1, SVOBODNI: -2, TEAM: 0,
    }),
    L("p-tempo", "Nová výstavba bytů je důležitější než klid existujících sídlišť.", {
      SPOLU: 2, ODS: 2, ANO: 1, PIRATI: 1, STAN: 1, TOP09: 1, SOBE: 0, TEAM: 0, SEN21: -1,
      AUTO: 0, SPD: -1, LEVICE: 0, ZELENI: -1,
    }),
    C("p-bydleni", "Co má Praha dělat s bydlením především?", [
      opt("fond", "Velký městský fond a Pražská developerská společnost", {
        PIRATI: 1, SEN21: 0.9, LEVICE: 0.9, STAN: 0.65, SOBE: 0.7, ZELENI: 0.7, TEAM: 0.5, LITACKA: 0.55,
      }),
      opt("povol", "Hlavně zrychlit povolování soukromé výstavby", {
        SPOLU: 1, ODS: 1, TOP09: 1, ANO: 0.9, AUTO: 0.5, STAN: 0.4,
      }),
      opt("klid", "Bránit sídliště a čtvrti před další hustou zástavbou", {
        SEN21: 0.75, LOKAL: 0.7, AUTO: 0.45, SPD: 0.4, SOBE: 0.25,
      }),
      opt("skip", "Nevím", {}),
    ]),
    C("p-doprava", "Doprava v Praze má mít přednost", [
      opt("mhd", "Koleje, MHD a méně aut v ulicích", {
        PIRATI: 1, SOBE: 1, ZELENI: 1, LEVICE: 0.8, LITACKA: 0.7, TEAM: 0.4,
      }),
      opt("okruh", "Dokončit okruhy a zklidnit uzavírky", {
        SPOLU: 1, ODS: 0.95, TOP09: 0.9, STAN: 0.85, ANO: 0.8, SEN21: 0.4, KDU: 0.55,
      }),
      opt("auta", "Míň zákazů a pruhů proti autům", {
        AUTO: 1, SPD: 0.95, SVOBODNI: 0.9,
      }),
      opt("skip", "Nevím", {}),
    ]),
    C("p-mc", "Když se městská část neshodne s magistrátem", [
      opt("konflikt", "Část má jít do konfliktu a bránit čtvrť", {
        SEN21: 0.9, LOKAL: 0.8, SOBE: 0.45, AUTO: 0.4, SPD: 0.35,
      }),
      opt("mesto", "Město má mít poslední slovo kvůli bytům a MHD", {
        PIRATI: 1, SPOLU: 0.85, STAN: 0.8, ODS: 0.7, ANO: 0.55, TEAM: 0.5,
      }),
      opt("skip", "Nevím", {}),
    ]),
  ];

  const PRAHA1 = [
    L("p1-obyvatele", "Centrum má sloužit hlavně lidem, co tu bydlí, i když ubude restaurací a Airbnb.", {
      SOBE: 2, PIRATI: 1, SEN21: 1, STAN: 1, LEVICE: 2, SPOLU: 0, ODS: -1, ANO: 0, AUTO: -1, SPD: 0, LOKAL: 1,
    }),
    L("p1-prostor", "Veřejný prostor (nábřeží, Malá Strana, parky) se má spíš chránit než oživovat akcemi a turisty.", {
      SOBE: 1, PIRATI: 1, ZELENI: 2, SEN21: 1, LOKAL: 1, SPOLU: -1, ODS: -1, ANO: 0, AUTO: -1, STAN: 0,
    }),
    C("p1-turismus", "Cestovní ruch na Praze 1", [
      opt("regulace", "Přísnější pravidla, míň party turismu", {
        PIRATI: 1, SOBE: 0.95, ZELENI: 0.9, LEVICE: 0.8, SEN21: 0.7, STAN: 0.55, LOKAL: 0.6,
      }),
      opt("sluzby", "Turisté živí centrum, spíš služby a pořádek", {
        ODS: 1, SPOLU: 0.9, TOP09: 0.9, ANO: 0.7, AUTO: 0.4,
      }),
      opt("trh", "Nechat to na trhu, radnice ať se do toho nemíchá", {
        AUTO: 0.9, SVOBODNI: 1, SPD: 0.5,
      }),
      opt("skip", "Nevím", {}),
    ]),
  ];

  const BRNO = [
    L("b-salinkarta", "Roční šalinkarta se nemá zdražovat, i kdyby chyběly peníze jinde.", {
      PIRATI: 2, ZELENI: 2, SOCDEM: 2, KSCM: 1, ANO: 1, KDU: 0, STAN: 0, ODS: -1, AUTO: -1, SPD: 0, KLIDEM: 0,
    }),
    L("b-byty", "Město má stavět družstevní a městské byty na svých pozemcích, ne je prodávat.", {
      PIRATI: 2, ZELENI: 2, SOCDEM: 2, KSCM: 2, KDU: 1, STAN: 1, ANO: 0, ODS: -1, NOVEBRNO: -1, AUTO: -1, SPD: -1,
    }),
    L("b-cyklo", "Víc cyklostezek a pěších zón, i když to ubere autům v centru.", {
      PIRATI: 2, ZELENI: 2, SOCDEM: 1, KDU: 0, STAN: 0, ODS: -1, ANO: -1, AUTO: -2, SPD: -2, SVOBODNI: -2, KLIDEM: -1,
    }),
    L("b-audit", "Radnice má zveřejňovat smlouvy a audity, i když to zdrží rozhodování.", {
      PIRATI: 2, ZELENI: 2, PRISAHA: 2, NOVEBRNO: 1, ODS: 1, KDU: 1, STAN: 1, ANO: 0, SPD: 0, AUTO: 0,
    }),
    L("b-prodej", "Městský majetek se nemá prodávat, i kdyby to přineslo jednorázové peníze.", {
      PIRATI: 2, ZELENI: 2, KSCM: 2, SOCDEM: 1, KLIDEM: 1, KDU: 0, ODS: -1, ANO: -1, NOVEBRNO: -1, AUTO: -1,
    }),
    L("b-mhd", "MHD má mít přednost před auty v širším centru.", {
      PIRATI: 2, ZELENI: 2, SOCDEM: 1, KDU: 0, STAN: 0, ODS: -1, ANO: 0, AUTO: -2, SPD: -2, KLIDEM: -1,
    }),
    L("b-kontinuita", "Lepší je kontinuita současné koalice než výměna radnice za každou cenu.", {
      ODS: 2, KDU: 2, STAN: 2, PIRATI: 1, ZELENI: 0, ANO: -2, KLIDEM: -1, SPD: -2, NOVEBRNO: -1, AUTO: -1,
    }),
    C("b-stadion", "Stadion Za Lužánkami", [
      opt("mesto", "Městská priorita — tlačit stavbu", {
        LUZANKY: 1, ODS: 0.45, ANO: 0.4, KDU: 0.35,
      }),
      opt("soukrome", "Soukromý investor, město jen podmínky", {
        NOVEBRNO: 1, ODS: 0.55, AUTO: 0.5, SVOBODNI: 0.45,
      }),
      opt("jinde", "Nejdřív byty, MHD a školy, stadion počká", {
        PIRATI: 1, ZELENI: 0.95, SOCDEM: 0.7, KLIDEM: 0.6, KSCM: 0.55, PRISAHA: 0.5,
      }),
      opt("skip", "Nevím", {}),
    ]),
    C("b-nadrazi", "Nádraží a jih města", [
      opt("poloha", "Dotáhnout současnou polohu a napojit MHD", {
        PIRATI: 1, ZELENI: 0.7, KDU: 0.55, STAN: 0.5, ODS: 0.4,
      }),
      opt("vrt", "Hlavně zrychlit velké stavby a VRT", {
        NOVEBRNO: 1, ANO: 0.85, ODS: 0.6, AUTO: 0.4,
      }),
      opt("klid", "Nejsem ochoten kvůli tomu obětovat jiné čtvrti", {
        KLIDEM: 1, LOKAL: 0.7, SPD: 0.4, SOCDEM: 0.35,
      }),
      opt("skip", "Nevím", {}),
    ]),
    C("b-smer", "Brno má jít spíš", [
      opt("zelene", "Městské byty, MHD, zeleň a kontrola radnice", {
        PIRATI: 1, ZELENI: 1, SOCDEM: 0.75, PRISAHA: 0.55, KSCM: 0.5,
      }),
      opt("stavby", "Rychlejší stavby, podnikání a dokončené projekty", {
        ODS: 1, NOVEBRNO: 0.9, ANO: 0.8, KDU: 0.55, STAN: 0.55, AUTO: 0.45,
      }),
      opt("klid", "Klid čtvrtí, méně experimentů v dopravě", {
        KLIDEM: 1, AUTO: 0.7, SPD: 0.65, LOKAL: 0.55, SVOBODNI: 0.5,
      }),
      opt("skip", "Nevím", {}),
    ]),
  ];

  const PARDUBICE = [
    L("c-kasarna", "Masarykova kasárna mají jít na družstevní a městské byty, ne na komerční development.", {
      PROG_PCE: 2, PIRATI: 2, ZELENI: 2, TOP09: 1, STAN: 1, KDU: 1, ZIJEME: 0, ANO: 0, ODS: -1, AUTO: -1, SPD: -1, NASE_PCE: 0,
    }),
    L("c-cyklo", "Trolejbus a cyklostezky mají přednost před volnými auty v širším centru.", {
      PROG_PCE: 2, PIRATI: 2, ZELENI: 2, STAN: 0, KDU: 0, ZIJEME: 0, ANO: -1, ODS: -1, AUTO: -2, SPD: -2, SRDCEM: 0,
    }),
    L("c-parkovani", "Rezidentní parkování se má rozšířit, i když to naštve dojíždějící.", {
      PROG_PCE: 1, ZIJEME: 1, ANO: 1, STAN: 1, ODS: 0, AUTO: -2, SPD: -1, NASE_PCE: 1, SRDCEM: 0, KDU: 0,
    }),
    L("c-zele", "Do zeleně a klimatu má jít víc než do nových silnic a parkovišť.", {
      PROG_PCE: 2, PIRATI: 2, ZELENI: 2, STAN: 0, KDU: 0, ZIJEME: 0, ANO: -1, ODS: -1, AUTO: -2, SPD: -1, SRDCEM: 0,
    }),
    L("c-kontinuita", "Lepší je nechat na radnici kontinuitu ANO než měnit vedení města.", {
      ANO: 2, ZIJEME: 1, SPD: -1, PROG_PCE: -2, ODS: -1, STAN: -1, KDU: 0, NASE_PCE: -1, SRDCEM: 0, AUTO: -1,
    }),
    L("c-most", "Velké stavby (most, dopravní stavby) mají jít dopředu, i když omezí život ve čtvrti.", {
      ANO: 1, ODS: 1, AUTO: 1, ZIJEME: 1, PROG_PCE: 0, STAN: 0, KDU: 0, SPD: 0, NASE_PCE: -1, SRDCEM: 0,
    }),
    L("c-kontrola", "Kontrola smluv a střetu zájmů je důležitější než rychlost rozhodnutí.", {
      PROG_PCE: 2, PIRATI: 2, STAN: 1, KDU: 1, ODS: 1, NASE_PCE: 1, SRDCEM: 1, ANO: 0, ZIJEME: 0, SPD: 0, AUTO: 0,
    }),
    C("c-obvody", "Osm městských obvodů v Pardubicích", [
      opt("zrusit", "Zrušit je, ušetřit a posílit komise", {
        PROG_PCE: 1, PIRATI: 0.9, TOP09: 0.7, ZELENI: 0.7,
      }),
      opt("nechat", "Nechat obvody — jsou blíž lidem", {
        ANO: 0.7, ODS: 0.65, STAN: 0.8, KDU: 0.75, ZIJEME: 0.55, NASE_PCE: 0.85, SRDCEM: 0.8, LOKAL: 0.7, SPD: 0.4,
      }),
      opt("skip", "Nevím", {}),
    ]),
    C("c-bydleni", "Byty ve městě mají vznikat hlavně", [
      opt("mesto", "Městské a družstevní na obecních pozemcích", {
        PROG_PCE: 1, PIRATI: 1, ZELENI: 0.9, STAN: 0.5, KDU: 0.45,
      }),
      opt("soukrom", "Soukromou výstavbou a rychlejším povolením", {
        ANO: 0.85, ODS: 1, AUTO: 0.7, ZIJEME: 0.55, SPD: 0.4,
      }),
      opt("skip", "Nevím", {}),
    ]),
    C("c-priorita", "Nejdůležitější téma Pardubic teď je", [
      opt("sprava", "Jak se město spravuje (obvody, kontrola, otevřenost)", {
        PROG_PCE: 1, NASE_PCE: 0.7, SRDCEM: 0.55, STAN: 0.5,
      }),
      opt("provoz", "Doprava, parkování a dokončit rozjeté stavby", {
        ANO: 1, ZIJEME: 0.75, ODS: 0.7, AUTO: 0.8, SPD: 0.55,
      }),
      opt("zivot", "Byty, zeleň, školy a obvody jako sousedská radnice", {
        PROG_PCE: 0.7, KDU: 0.65, STAN: 0.6, SRDCEM: 0.6, NASE_PCE: 0.55, ZELENI: 0.7,
      }),
      opt("skip", "Nevím", {}),
    ]),
  ];

  const BANKS = { Praha: PRAHA, Brno: BRNO, Pardubice: PARDUBICE };

  const MC_EXTRA = [
    L("mc-park", "V mé městské části / obvodu má mít parkování pro rezidenty přednost před volnými auty zvenčí.", {
      STAN: 1, LOKAL: 1, ANO: 1, SOBE: 1, ODS: 0, SPOLU: 0, AUTO: -2, SPD: -1, PIRATI: 0, PROG_PCE: 1,
    }),
    L("mc-zele", "Místní park, stromořadí a hřiště jsou důležitější než další parkoviště nebo obchodní dům.", {
      PIRATI: 2, ZELENI: 2, SOBE: 1, PROG_PCE: 2, LOKAL: 1, STAN: 1, KDU: 1, ODS: 0, ANO: 0, AUTO: -2, SPD: -1,
    }),
  ];

  function questionsFor(city, districtId) {
    const base = (BANKS[city] || []).map((q) => ({ ...q }));
    const name = districtName(districtId);
    if (city === "Praha" && name === "Praha 1") {
      return base.slice(0, 7).concat(PRAHA1);
    }
    if (districtId && districtId !== city.toLowerCase()) {
      return base.slice(0, 8).concat(MC_EXTRA);
    }
    return base;
  }

  function districtName(districtId) {
    const data = window.VOLBY;
    return data?.bodies.find((b) => b.id === districtId)?.name || "";
  }

  const SENATE_FULL = {
    Praha: {
      "Praha 5": "sen-21",
      "Praha 13": "sen-21",
      "Praha-Řeporyje": "sen-21",
      "Praha 9": "sen-24",
      "Praha 14": "sen-24",
      "Praha 19": "sen-24",
      "Praha 20": "sen-24",
      "Praha 21": "sen-24",
      "Praha-Běchovice": "sen-24",
      "Praha-Dolní Počernice": "sen-24",
      "Praha-Klánovice": "sen-24",
      "Praha-Koloděje": "sen-24",
      "Praha-Satalice": "sen-24",
      "Praha-Vinoř": "sen-24",
      "Praha 1": "sen-27",
      "Praha 7": "sen-27",
      "Praha-Suchdol": "sen-27",
      "Praha-Troja": "sen-27",
    },
    Brno: {
      "Brno-Ivanovice": "sen-60",
      "Brno-Jehnice": "sen-60",
      "Brno-Jundrov": "sen-60",
      "Brno-Komín": "sen-60",
      "Brno-Královo Pole": "sen-60",
      "Brno-Medlánky": "sen-60",
      "Brno-Ořešín": "sen-60",
      "Brno-Řečkovice a Mokrá Hora": "sen-60",
      "Brno-sever": "sen-60",
      "Brno-Útěchov": "sen-60",
      "Brno-Žabovřesky": "sen-60",
    },
    Pardubice: {},
  };

  const SENATE_PARTIAL = {
    "Praha 2": {
      id: "sen-27",
      note: "Senát č. 27 jen v částech Nové Město a Vyšehrad. Zbytek Prahy 2 letos senátora nevolí.",
    },
    "Praha 6": {
      id: "sen-27",
      note: "Senát č. 27 jen ve Střešovicích a částech Hradčan, Bubenče a Sedlce. Zbytek Prahy 6 letos senátora nevolí.",
    },
    "Praha 5": {
      id: "sen-21",
      note: "Většina Prahy 5 volí senátora v obvodu 21. Část Malé Strany na území Prahy 5 spadá do obvodu 27.",
    },
    "Praha 9": {
      id: "sen-24",
      note: "Bez katastrů Hrdlořezy, Hloubětín a části Malešic — ty letos v obvodu 24 nevolí.",
    },
  };

  function senateFor(city, districtId) {
    const name = districtName(districtId);
    if (city === "Pardubice") {
      return {
        none: true,
        title: "V Pardubicích se letos senátor nevolí",
        note: "Senátní obvod č. 43 (Pardubice) není v třetině, která se obměňuje 9.–10. 10. 2026. Volit senátora tu budete až v jiném roce.",
      };
    }
    const partial = SENATE_PARTIAL[name];
    const fullId = SENATE_FULL[city]?.[name];
    if (partial) {
      return { id: partial.id, partial: true, note: partial.note };
    }
    if (fullId) return { id: fullId, partial: false, note: "" };
    if (city === "Praha") {
      return {
        none: true,
        title: "V této městské části se letos senátor nevolí",
        note: "V Praze se v roce 2026 volí jen obvody 21 (Praha 5), 24 (Praha 9) a 27 (Praha 1). Ostatní třetiny Senátu se obměňují jindy.",
      };
    }
    if (city === "Brno") {
      return {
        none: true,
        title: "Tato městská část letos senátora nevolí",
        note: "V Brně se v roce 2026 volí jen obvod č. 60 (mimo jiné Žabovřesky, Královo Pole, Komín, Brno-sever, Řečkovice). Obvody 58 a 59 se letos neobměňují.",
      };
    }
    return { none: true, title: "Senát se tu letos nevolí", note: "" };
  }

  function stance(question, fam) {
    if (question.type === "likert") {
      if (Object.prototype.hasOwnProperty.call(question.positions, fam)) {
        return question.positions[fam];
      }
      return null;
    }
    return question.options;
  }

  function scoreQuestion(question, answer, fam) {
    if (answer == null || answer === "" || answer === "skip") return null;
    if (question.type === "likert") {
      const party = question.positions[fam];
      if (party == null) return null;
      const voter = Number(answer);
      if (Number.isNaN(voter)) return null;
      return 1 - Math.abs(voter - party) / 4;
    }
    const option = question.options.find((o) => o.id === answer);
    if (!option || option.id === "skip") return null;
    if (option.families && Object.prototype.hasOwnProperty.call(option.families, fam)) {
      return option.families[fam];
    }
    const any = question.options.some((o) => o.families && o.families[fam] != null);
    if (!any) return null;
    return 0;
  }

  function whyMatches(questions, answers, fam) {
    const why = [];
    for (const q of questions) {
      const s = scoreQuestion(q, answers[q.id], fam);
      if (s != null && s >= 0.7) why.push(q.text);
    }
    return why.slice(0, 3);
  }

  function scoreLists(lists, questions, answers) {
    return lists
      .map((item) => {
        const fam = family(item.party);
        const parts = [];
        for (const q of questions) {
          const s = scoreQuestion(q, answers[q.id], fam);
          if (s != null) parts.push(s);
        }
        const pct = parts.length ? Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100) : null;
        return {
          item,
          family: fam,
          percent: pct,
          answered: parts.length,
          why: whyMatches(questions, answers, fam),
        };
      })
      .filter((x) => x.percent != null)
      .sort((a, b) => b.percent - a.percent || a.item.party.localeCompare(b.item.party, "cs"));
  }

  window.GUIDE = {
    LIKERT,
    family,
    questionsFor,
    senateFor,
    scoreLists,
  };
})();
