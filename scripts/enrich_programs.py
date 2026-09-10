#!/usr/bin/env python3
"""Doplní rozbor programů a lustraci kompetencí do data/volby.json + data.js."""
from __future__ import annotations

import json
import re
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def family(name: str) -> str:
    n = (name or "").upper()
    rules = [
        ("AUTO", ("MOTORIST", " AUTO")),
        ("PIRATI", ("PIRÁT", "PIRAT", "TU!", "FAKT BRNO")),
        ("SOBE", ("SOBĚ", "SOBE")),
        ("SPOLU", ("SPOLU",)),
        ("STAN", ("STAN", "STAROST")),
        ("KDU", ("KDU", "LIDOVC")),
        ("ODS", ("ODS", "OBČANSKÁ DEMOKRATICK", "OBCANSKA DEMOKRATICK", "NEJLEPŠÍ ADRESA", "NEJLEPSI ADRESA")),
        ("TOP09", ("TOP 09", "TOP09")),
        ("ANO", ("ANO",)),
        ("SPD", ("SPD",)),
        ("ZELENI", ("ZELEN", "ŽÍT BRNO", "ZIT BRNO")),
        ("SOCDEM", ("SOCDEM", "SOCIÁLNÍ DEM", "SOCIALNI DEM")),
        ("KSCM", ("KSČM", "KSCM", "STAČILO", "STACILO", "RESTART")),
        ("SVOBODNI", ("SVOBODN", "NAPLNO", "TRIKOLOR")),
        ("PRISAHA", ("PŘÍSAH", "PRISAH")),
        ("SEN21", ("SEN 21", "SEN PRO", "SENPROCESKO")),
        ("LUZANKY", ("LUŽÁNK", "LUZANK")),
        ("KLIDEM", ("BRNOKLID", "KLIDEM")),
        ("NOVEBRNO", ("NOVÉ BRNO", "NOVE BRNO")),
        ("PROG_PCE", ("PROGRESIVNÍ PARDUBICE", "PROGRESIVNI PARDUBICE")),
        ("ZIJEME", ("ŽIJEME PARDUBICE", "ZIJEME PARDUBICE")),
        ("SRDCEM", ("SRDCEM PRO PARDUBICE",)),
        ("NASE_PCE", ("NAŠE PARDUBICE", "NASE PARDUBICE")),
        ("LEVICE", ("LEVICE",)),
        ("DSZ", ("PRÁVA ZVÍŘAT", "PRAVA ZVIRAT", "DSZ")),
        ("GEN", ("GEN ", "GEN S PODPOROU")),
        ("TEAM", ("JSME PRAHA", "TEAM")),
        ("LITACKA", ("LÍTAČK", "LITACK")),
        ("URZA", ("URZA",)),
        ("CIBULKA", ("PRAVÝ BLOK", "PRAVY BLOK", "CIBULKA")),
        ("LZPL", ("LEPŠÍ ŽIVOT", "LEPSI ZIVOT")),
        ("VOLUNTIA", ("VOLUNTIA",)),
    ]
    for key, needles in range_rules(rules):
        if any(x in n for x in needles):
            return key
    return "LOKAL"


def range_rules(rules):
    return rules


def P(summary, topics, promises, can, no, up, sources, depth="full"):
    return {
        "summary": summary,
        "topics": topics,
        "promises": promises,
        "lustration": {"canInfluence": can, "cannotDecide": no, "canAdvocate": up},
        "sources": sources,
        "programDepth": depth,
    }


# --- Magistrát: rozbor podle zveřejněných programů 2026 ---
CITY = {
    "praha:SPOLU": P(
        "SPOLU slibuje tempo: rychlejší byty, méně chaosu v uzavírkách, dopravní stavby, střední školy a duševní zdraví. Část toho Praha fakt řídí (byty, DPP, SŠ jako kraj), okruh a stavební zákon ale ne.",
        ["Rychlejší bytová výstavba", "Koordinace uzavírek", "Dopravní infrastruktura", "Kapacity SŠ", "Duševní zdraví"],
        [
            "Zrychlit povolování a výstavbu bytů i veřejné infrastruktury",
            "Lépe koordinovat dopravní omezení",
            "Rozvíjet dopravní stavby",
            "Navýšit kapacity středních škol",
            "Dostupnější péče o duševní zdraví od dětí po seniory",
        ],
        [
            "Pražská developerská společnost, městské byty, územní plán / metropolitní plán",
            "Organizace MHD (DPP) a koordinace uzavírek na komunikacích města",
            "Střední školy — Praha je kraj, SŠ zřizuje",
            "Příspěvkové organizace ve zdravotnictví a sociální oblasti, které Praha zřizuje",
        ],
        [
            "Státní stavební zákon a akcelerační zóny, které musí schválit Sněmovna",
            "Dálniční Pražský okruh (ŘSD / stát) — město jen spolufinancuje a územně připravuje",
            "Úhrady zdravotních pojišťoven u duševního zdraví",
        ],
        [
            "Jednat se státem o okruhu, metru a penězích na SŠ nad rámec běžného rozpočtu",
            "Tlak na změnu stavebního práva, aby šlo stavět rychleji",
        ],
        ["iDNES/Novinky 6/2026 — priority SPOLU pro Prahu", "ČSÚ listina 2026"],
    ),
    "praha:PIRATI": P(
        "Piráti mají nejkonkrétnější bytový plán: tisíce městských bytů, PDS, investiční fond, tři nové čtvrti u metra. Sami přiznávají, že akcelerační zóny a podíl obcí na DPH musí zařídit Sněmovna. Airbnb daň z nemovitosti Praha částečně umí (koeficienty), 68násobek pro cizí rezidenty už je státní daňové právo.",
        ["Městské byty a PDS", "Akcelerační zóny (zákon)", "Čtvrti u kolejí", "Méně povinných parkovacích stání", "Regulace Airbnb / prázdných domů", "Stín a stromy v horku"],
        [
            "Několik tisíc městských nájemních bytů, posílení PDS, pražský investiční fond splácený z nájmů",
            "Nové Kolovraty, Východní a Západní město — bydlení pro až 200 tisíc lidí u prodloužení metra",
            "Dohody s developery: podíl dostupných bytů + vyšší příspěvky na školy a parky",
            "Stop prodeji městských bytů i na úrovni MČ",
            "Vyšší daň z nemovitosti na dlouhodobě prázdné domy a Airbnb",
            "Méně povinných parkovacích míst u nové výstavby u MHD",
            "Stromy, stín na zastávkách, klimatizace v MHD",
        ],
        [
            "Městský bytový fond, PDS, územní plán, Pražské stavební předpisy, dohody s developery",
            "Zákaz privatizace magistrátních bytů; pravidla vůči MČ v majetkové politice města",
            "Tarify a vozidla DPP, stínění zastávek, výsadba na městských pozemcích",
            "Koeficienty daně z nemovitých věcí v Praze",
        ],
        [
            "Akcelerační zóny ve stavebním zákoně — to musí Sněmovna",
            "Podíl obcí na DPH z nové výstavby — státní rozpočet",
            "Sazby daně z nemovitosti vůči zahraničním rezidentům nad rámec obecních koeficientů",
        ],
        [
            "Prosazovat akcelerační zóny a sdílení DPH ve Sněmovně (pirátská vládní/opoziční stopa)",
            "Jednat se státem o prodloužení metra A/B/C do nových čtvrtí",
        ],
        ["praha.pirati.cz — Akční plán bydlení 6/2026", "Plán k vlnám veder 7/2026"],
    ),
    "praha:SOBE": P(
        "Praha sobě + Zelení + lidovci točí kampaň kolem dopravy, kterou Scheinherr už tahal: metro D, okruh O, tramvaje, městské byty, školy, regulace Airbnb a klima. Přímá volba primátora je ústavní změna — zastupitelstvo ji neschválí.",
        ["Metro D a příprava metra O", "Tramvaje do rozvojových oblastí", "Městské byty a školy", "Regulace Airbnb", "Klima"],
        [
            "Dokončit metro D, připravovat okružní metro O, tramvaje do nových čtvrtí",
            "Dostavba Pražského i Městského okruhu",
            "Výstavba městských bytů a kapacit škol kvůli růstu obyvatel",
            "Regulace krátkodobých pronájmů typu Airbnb",
            "Odpovědná klimatická politika města",
            "Debata o přímé volbě primátora",
        ],
        [
            "Investorství u metra D a tramvají (DPP, rozpočet Prahy)",
            "Městské byty, MŠ/ZŠ, které Praha zřizuje",
            "Místní poplatky a pravidla krátkodobého ubytování v kompetenci obce",
            "Klimatický plán města, zeleň, energetika městských budov",
        ],
        [
            "Přímá volba primátora — změna ústavy / zákona o hl. m. Praze v Parlamentu",
            "Pražský okruh jako dálnice — stát",
        ],
        [
            "Tlačit stát u okruhu a spolufinancování metra",
            "Usnesení k posílení pravomocí obcí (Airbnb, stavební právo)",
        ],
        ["ČTK 1. 6. 2026 — zahájení kampaně", "prahasobe.cz"],
    ),
    "praha:STAN": P(
        "Hlaváček sází na metropolitní plán, 2000 městských bytů na začátek, brownfieldy a „komplexy čtvrtě“. Metro D a okruh slibuje dál táhnout, železniční uzel a metro S jsou ale hlavně stát. Nábor 270 strážníků je městská policie — to Praha umí, pokud zaplatí.",
        ["Metropolitní plán", "2000 městských bytů", "Brownfieldy", "Metro D a okruhy", "Městská policie", "Portál Pražana"],
        [
            "Zahájit výstavbu 2000 městských bytů, rozvíjet PDS",
            "Komplexní čtvrti s byty, školami a parky podle metropolitního plánu",
            "Pokračovat v metru D, okruzích a železničních spojeních / metro S",
            "Nabrat strážníky, posílit IZS",
            "Rozšířit Portál Pražana",
        ],
        [
            "Územní plán a jeho naplňování, PDS, městské byty",
            "Městská policie a digitalizace magistrátu",
            "Spoluúčast na metru D",
        ],
        [
            "Železniční uzel Praha a „metro S“ — Správa železnic / stát",
            "Celostátní IZS nad rámec městské policie a hasičů města",
        ],
        ["Jednat se státem o železnici, okruhu a penězích na dopravu"],
        ["ČTK/Centrum — priority STAN Hlaváček 2026"],
    ),
    "praha:ANO": P(
        "ANO v Praze kampaní útočí na koalici a slibuje méně zákazů a víc „selského rozumu“ v dopravě a bydlení. Po kauze Prokopa vedou s Hušbauerem. Konkrétní bytová čísla jako Piráti/STAN ve veřejných zdrojích spíš nemají — síla je v protestu proti restrikcím.",
        ["Kritika koalice", "Doprava bez restrikcí", "Bydlení", "Úspory"],
        [
            "Méně dopravních zákazů v centru",
            "Tlak na rychlejší výstavbu",
            "Úspornější chod magistrátu",
        ],
        [
            "Zóny, parkování, organizace dopravy a MHD v gesci Prahy",
            "Územní plán a městské investice",
        ],
        ["Celostátní ceny stavebních materiálů, hypotéky, ČNB"],
        ["Prosazovat změny stavebního práva ve Sněmovně (klub ANO)"],
        ["Mediální kampaň ANO Praha 2026", "ČSÚ 2022"],
    ),
    "praha:AUTO": P(
        "Motoristé chtějí víc aut a míň restrikcí. Parkování a zóny Praha opravdu řídí. Emisní povolenky, Green Deal a „válku proti autům“ na unijní úrovni zastupitelstvo neschválí.",
        ["Parkování", "Odpor k zónám a zákazům", "Auta ve městě"],
        ["Víc respektu k řidičům", "Méně zón a restrikcí", "Pragmatická doprava"],
        ["Parkovací zóny, organizace provozu, kapacity garáží města"],
        ["Emisní povolenky, unijní klimatická legislativa, spotřební daň z paliv"],
        ["Tlak na vládu proti celostátním restrikcím"],
        ["Seznam Zprávy — programová linka Motoristů", "Kandidátka 2026"],
    ),
    "praha:SEN21": P(
        "SEN 21 slibuje městský bytový fond na 10 %, ochranu sídlišť před zástavbou, masivní stavbu SŠ (chybí až 18 tis. míst), čistotu, seniory a pravidla pro turisty. Bytový fond a SŠ Praha umí. Koleje ČVUT/UK a energetická bezpečnost sítě jsou spíš stát a distributoři.",
        ["Městské byty na 10 % trhu", "Sídliště nejsou parcela", "Střední školy", "Úklid a bezpečí", "Turismus vs. rezidenti", "Senioři"],
        [
            "Rozšířit městský nájemní a družstevní fond směrem k 10 %",
            "Bránit sídliště před necitlivou dostavbou",
            "Investovat do kapacit SŠ",
            "Čistší veřejný prostor, městská policie jako služba",
            "Férová pravidla turismu v centru",
            "Terénní služby pro seniory a lůžka v zařízeních města",
        ],
        [
            "Městský bytový fond a územní plán sídlišť",
            "SŠ a sociální služby, které Praha zřizuje",
            "Úklid, zeleň, městská policie, místní poplatky z ubytování",
        ],
        ["Kapacity vysokoškolských kolejí (mimo městské)", "Přenosová soustava a energetický trh"],
        ["Jednat s vládou o školství a o pravidlech krátkodobého ubytování"],
        ["praha.senprocesko.cz/program"],
    ),
    "praha:SPD": P(
        "SPD+ koalice nese do magistrátu celostátní témata (migrace, EU). Reálně v Praze ovlivní městskou policii, granty a symboliku. Azyl a cizinecký zákon neschválí.",
        ["Bezpečnost", "Odpor k klimatickým restrikcím", "Migrace (stát)"],
        ["Tvrdší pořádek ve veřejném prostoru", "Méně „ideologie“ v MHD a školách"],
        ["Městská policie, grantová politika, organizace MHD"],
        ["Azyl, pobyt cizinců, členství v EU"],
        ["Usnesení a tlak na vládu"],
        ["Kandidátka SPD Praha 2026"],
    ),
    "praha:LEVICE": P(
        "Levice tlačí městské byty a regulaci Airbnb — to je komunál. Celostátní regulace nájmů a daně z prázdných bytů nad koeficienty obce už spadají do Parlamentu.",
        ["Městské byty", "Regulace Airbnb", "Sociální politika města"],
        ["Víc obecních bytů", "Přísnější pravidla krátkodobého ubytování"],
        ["Bytový fond, územní plán, místní poplatky"],
        ["Celostátní regulace nájmů, daňový zákon"],
        ["Tlak na Sněmovnu v bytovém zákoně"],
        ["Kandidátka Levice Praha 2026"],
    ),
    "praha:KSCM": P(
        "Spojená levice slibuje levnější MHD a obecní bydlení. MHD tarify Praha umí. „Stop válce“ a státní znárodňování ne.",
        ["Sociální jistota", "MHD", "Obecní bydlení"],
        ["Levnější MHD", "Obecní byty", "Odpor k privatizaci"],
        ["Tarify PID/DPP, městský majetek"],
        ["Zahraniční politika, znárodnění soukromého majetku bez zákona"],
        ["Tlak na vládu u sociálních dávek"],
        ["spojenalevice.cz — odkaz na program PDF (PDV)"],
    ),
    "praha:TEAM": P(
        "JSME PRAHA je personální projekt z rady (Komrsková). Veřejný program je tenčí než u Pirátů, od nichž odešla — čekej kontinuitu digitalizace a pragmatické rady, ne novou doktrínu.",
        ["Kontinuita rady", "Pragmatické řízení"],
        ["Jiné tóny než mateřští Piráti", "Zkušenost z náměstkování"],
        ["Gese, které už náměstkyně v radě má"],
        ["Celostátní agenda Volt/TEAM mimo Prahu"],
        ["Koaliční vyjednávání na magistrátu"],
        ["Mediální pokrytí odchodu z Pirátů 2026"],
    ),
    "praha:LITACKA": P(
        "Jediné téma: jízdné. Tarify PID schvaluje Praha se Středočeským krajem — kačku za lítačku tedy teoreticky navrhnout lze, zaplatit z rozpočtu musí zastupitelstvo.",
        ["Jízdné MHD"],
        ["Lítačka za symbolickou cenu"],
        ["Návrh tarifu MHD v orgánech PID / rady Prahy"],
        ["Ceny elektřiny pro DPP, státní dotace dopravcům"],
        ["Jednat se Středočeským krajem v PID"],
        ["Název listiny ČSÚ 2026"],
    ),
    "praha:LZPL": P(
        "V názvu slibují mzdy 50 tis., důchody 30 tis. a ceny energií z roku 2019. Z toho magistrát umí skoro jen koeficient daně z nemovitosti. Zbytek je klamavé očekávání u komunálu.",
        ["Mzdy, důchody, energie (stát)", "Daň z nemovitosti"],
        ["Zrušení daně z nemovitostí", "Min. mzda 50 000 Kč", "Min. důchod 30 000 Kč", "Ceny energií 2019"],
        ["Koeficient daně z nemovitých věcí v Praze"],
        ["Minimální mzda, státní důchody, cenová regulace energií, daňový zákon"],
        ["Petice a tlak na Sněmovnu — bez záruky"],
        ["Plný název listiny ČSÚ", "lzpl.cz"],
    ),
    "praha:URZA": P(
        "Program je odmítnout funkce. Lustrace: kdyby náhodou někdo z listiny mandát vzal, spadaly by na něj běžné kompetence zastupitele. Sami říkají, že je nechtějí.",
        ["Odmítnutí politické moci"],
        ["Odmítnout každou politickou funkci"],
        ["Žádné — kandidují s tím, že spravovat město nebudou"],
        ["Všechny běžné kompetence obce, pokud by funkci přijali proti slibu"],
        [],
        ["Název listiny Urza.cz ČSÚ"],
    ),
    "praha:CIBULKA": P(
        "Přímá demokracie a odvolatelnost politiků. Místní referendum Praha umí. Odvolat poslance přímo občany ne.",
        ["Referenda", "Odvolatelnost"],
        ["Místní referenda", "Odvolatelnost politiků a úředníků"],
        ["Místní referendum podle zákona o obcích"],
        ["Odvolatelnost poslanců, ústavní přímá demokracie"],
        ["Tlak na ústavní změnu"],
        ["Název listiny Pravý Blok"],
    ),
    "praha:VOLUNTIA": P(
        "Libertariánský minimalismus: škrtat regulace a poplatky města. Poplatky a PSP Praha ovlivní, DPH ne.",
        ["Méně regulace", "Nižší městské poplatky"],
        ["Škrtat výdaje a nařízení"],
        ["Místní poplatky, Pražské stavební předpisy, vyhlášky"],
        ["DPH, daň z příjmu, ČNB"],
        [],
        ["magistrat.voluntia.cz"],
    ),
    "praha:DSZ": P(
        "Útulky a vyhlášky k zvířatům — úzké, ale reálně v gesci města.",
        ["Práva zvířat", "Útulky"],
        ["Lepší útulky a vyhlášky k chovu"],
        ["Městské útulky, vyhlášky k volnému pobíhání"],
        ["Trestní právo týrání zvířat (stát už má zákon)"],
        ["Tlak na přísnější celostátní normy"],
        ["Kandidátka DSZ 2026"],
    ),
    "brno:ODS": P(
        "ODS+TOP navazují na éru Vaňkové: Brno pro 500 tisíc obyvatel, dostupné bydlení jako priorita, méně kolon. Je to program kontinuity s novou tváří Zlatuškové, ne otáčení města.",
        ["Kontinuita správy", "Dostupné bydlení", "Plynulejší doprava", "Růst města"],
        [
            "Brno jako město pro až půl milionu obyvatel",
            "Dostupné bydlení, ať mladí neodcházejí",
            "Méně času v kolonách, investice do průjezdnosti i MHD",
        ],
        ["Územní plán, městské investice, DPMB, parkování"],
        ["VRT a hlavní nádraží staví stát", "Krajské SŠ a FN Brno"],
        ["Jednat se SŽ a vládou o uzlu a VRT"],
        ["brnonejlepsiadresa.cz"],
    ),
    "brno:KDU": P(
        "Lidovci a STAN: byty (i PPP), MHD, parkování, školy, čisté ulice, trvalý pobyt vs. služby pro 100 tisíc neregistrovaných. PPP školky město sjednat může. Vyrovnání rozpočtového určení daní za neregistrované obyvatele je stát.",
        ["Bydlení a PPP", "MHD a parkování", "Školy", "Brno blíž lidem"],
        [
            "Zrychlit výstavbu bytů, PPP u školek a startovacích bytů kde se vyplatí",
            "Lepší MHD a promyšlené parkování",
            "Kvalitní školy a čistší ulice",
            "Aby se vyplatilo mít v Brně trvalý pobyt",
        ],
        ["Městské pozemky, PPP smlouvy města, DPMB, MŠ/ZŠ města, úklid"],
        ["Rozpočtové určení daní za lidi bez trvalého pobytu", "Krajské školství SŠ"],
        ["Tlak na vládu kvůli RUD a na kraj kvůli SŠ"],
        ["brnoblizlidem.cz/plan-pro-brno"],
    ),
    "brno:PIRATI": P(
        "TU! má velmi konkrétní dopravní program: nezvyšovat šalinkartu, +5 % objemu MHD za 4 roky, klimatizace, tratě, diametr, cyklo, pěší zóna. Šalinkarta a DPMB jsou město. Letecké linky, VRT a nádraží jsou stát — oni to sami píšou.",
        ["Šalinkarta bez zdražení", "Víc spojů MHD", "Tramvaje a diametr", "Cyklo a pěší", "Trnitá / nádraží"],
        [
            "Nezvyšovat cenu roční šalinkarty pro Brňáky, rodinné slevy",
            "Navýšit objednávku MHD o 5 % za čtyři roky, maxišaliny, klimatizace",
            "Nové tramvajové tratě, bateriové trolejbusy, nezprivatizovat dílny DPMB",
            "Páteřní cyklostezky, pěší zóna k nádraží, méně vjezdů do centra",
            "Napojit nové nádraží MHD v den otevření, připravovat kolejový diametr",
        ],
        [
            "Tarify a objednávka DPMB, vozidla, tratě na území města",
            "Ulice, cyklo, pěší zóny, Fond mobility",
            "Územní příprava čtvrti Trnitá",
        ],
        [
            "Nové hlavní nádraží staví stát",
            "Letecké linky a letiště (kraj/stát/operátor)",
            "VeloCity konferenci město může chtít, ne si ji odhlasovat ve Vídni",
        ],
        ["Se SŽ o termínu nádraží", "S krajem o IDS JMK a letišti", "Diametr jako dlouhá stavba se státem"],
        ["tubrno.cz — Plán, jak posunout Brno"],
    ),
    "brno:ANO": P(
        "Trojanovo ANO: pořádek, P+R, okruh, tramvaje, lanovka, železniční uzel, letiště. Městský okruh a DPMB ano. Uzel a letiště neřídí zastupitelstvo. Lanovka je městský projekt, ale drahý a sporný.",
        ["Bezpečnost a pořádek", "P+R a okruh", "Tramvaje / lanovka", "Nádraží a letiště"],
        [
            "Rychlé hlášení nepořádku, prevence podvodů",
            "Dostavba městského okruhu, P+R, méně aut v centru",
            "Modernizace tramvají, lanovka",
            "Modernizace železničního uzlu, víc linek z letiště",
        ],
        ["Městská policie, DPMB, parkování P+R, podíl města na VMO"],
        ["Řízení letiště a státních železnic", "Kyberkriminalita jako trestní agenda státu"],
        ["Tlak na SŽ a vládu u uzlu", "Kraj u letiště"],
        ["tymbrno.cz/program"],
    ),
    "brno:ZELENI": P(
        "Zelené Brno skládá eko program: veřejný prostor, klima, město krátkých vzdáleností. Kompetence je územní plán, stromy, MHD — ne unijní Green Deal.",
        ["Veřejný prostor", "Klima", "Město pro lidi"],
        ["Kvalita ulic", "Méně aut v centru", "Komunitní politika"],
        ["Územní plán, zeleň, DPMB, vyhlášky"],
        ["Unijní klimatické cíle, daňový mix státu"],
        ["Kraj a stát u velkých staveb"],
        ["Kampaň Zelené Brno 2026"],
    ),
    "brno:KLIDEM": P(
        "Bývalí anováci z rady: družstevní bydlení na městských pozemcích, nevyprodávat majetek, startovací byty, vybavenost u nových čtvrtí. To je čistý komunál — a mají na to úřední zkušenost.",
        ["Družstevní bydlení", "Městský majetek", "Vybavenost čtvrtí", "Bezpečí a čistota"],
        [
            "Rozvíjet družstevní bydlení na městských pozemcích",
            "Neprodávat, využívat městské budovy",
            "Startovací byty a bydlení pro seniory",
            "Školy a hřiště spolu s novou výstavbou",
        ],
        ["Majetková politika města, družstevní projekty, územní plán, MŠ"],
        ["Hypoteční trh, stavební zákon"],
        ["Státní podpora družstevní výstavby"],
        ["brnoklidem.cz/program"],
    ),
    "brno:LUZANKY": P(
        "Jádro je stadion Za Lužánkami a sport. Pozemky a městská sportoviště Brno ovlivní. Peníze soukromého investora a fotbalovou ligu ne. Sportovní vouchery z městského rozpočtu ano.",
        ["Stadion Za Lužánkami", "Sportoviště v čtvrtích", "Byty", "Transparentní dotace klubům"],
        [
            "Nový stadion Za Lužánkami, dočasně modernizovat Srbskou",
            "Hřiště, pumptracky, školní liga, vouchery dětem",
            "Urychlit městské i družstevní byty",
        ],
        ["Městské pozemky a investice do sportu, dotační pravidla, územní plán"],
        ["UEFA/LFA, soukromý cash-flow klubu", "Stavební povolení podle státního zákona"],
        ["Jednat s investorem a státem o financování stadionu"],
        ["za-luzanky.cz/program"],
    ),
    "brno:AUTO": P(
        "Bystrcký starosta Kratochvíl: auta a okraje města. Parkování a komunikace MČ/město. Dálnice ne.",
        ["Auta", "Okrajové čtvrti", "Méně restrikcí"],
        ["Méně šikany řidičů", "Hlas okrajových MČ"],
        ["Parkování, místní komunikace, vyhlášky"],
        ["Dálnice, spotřební daň"],
        ["Tlak na magistrát z Bystrce / okrajů"],
        ["Kandidátka Motoristé Brno 2026"],
    ),
    "brno:KSCM": P(
        "Restart: audit magistrátu, bydlení, doprava, bezpečnost, životní prostředí. Audit a městské byty ano. Celostátní Stačilo (EU, NATO) v komunálu ne.",
        ["Audit úřadu", "Dostupné bydlení", "Doprava a bezpečnost"],
        ["Personální a ekonomický audit magistrátu", "Dostupné bydlení", "Pořádek"],
        ["Kontrola městských firem a rozpočtu, DPMB, městská policie"],
        ["Zahraniční politika Stačilo!", "Krajská zdravotnictví"],
        ["Usnesení vůči vládě"],
        ["restartprobrno.cz"],
    ),
    "brno:SPD": P(
        "SPD Brno: bezpečnost a protest. Městská policie ano, migrace ne.",
        ["Bezpečnost", "Opozice"],
        ["Tvrdší pořádek", "Národní agenda v Brně"],
        ["Městská policie, granty"],
        ["Azyl, EU"],
        ["Tlak na vládu"],
        ["PDV — program SPD Brno"],
    ),
    "brno:SVOBODNI": P(
        "Brno naplno: méně poplatků, pravice mimo ODS. Místní poplatky město umí.",
        ["Méně poplatků", "Pravice"],
        ["Rozumné Brno bez zbytečných poplatků"],
        ["Místní poplatky, vyhlášky, parkování"],
        ["DPH, daň z příjmu"],
        [],
        ["brnonaplno.cz/program"],
    ),
    "brno:NOVEBRNO": P(
        "Sedláček: zrychlit VRT, nádraží/Trnitá, byty, stadion soukromým investorem. VRT a nádraží jsou stát — program to přiznává. Územní plán a podmínky pro investora jsou město.",
        ["VRT", "Nádraží a Trnitá", "Bytová krize", "Stadion soukromě"],
        [
            "Urychlit VRT (Praha 55 min)",
            "Dotáhnout nádraží a Trnitou",
            "Městské koleje a bydlení pro seniory, méně bariér ve výstavbě",
            "Podmínky pro stadion soukromým investorem",
        ],
        ["Územní plán Trnité, městská bytová výstavba, smlouvy s investorem stadionu"],
        ["VRT a nádraží staví stát / SŽ"],
        ["Maximalizovat tlak na ministerstvo dopravy a SŽ"],
        ["nove-brno.cz"],
    ),
    "brno:PRISAHA": P(
        "Vokřál se vrací se značkou protikorupce. Kompetence je kontrola zakázek města, ne policejní spisy.",
        ["Kontrola radnice", "Zkušenost exprimátora"],
        ["Transparentnější zakázky", "Pragmatismus"],
        ["Zadávání zakázek města, městské firmy"],
        ["Trestní stíhání (stát)"],
        [],
        ["Kandidátka Přísaha Brno 2026"],
    ),
    "brno:SOCDEM": P(
        "SOCDEM po rozpadu klubu: sociální agenda a městské firmy. Slavík je z Brněnských komunikací — střet i znalost.",
        ["Sociální služby", "Městské firmy"],
        ["Návrat značky", "Sociální program"],
        ["Sociální služby města, dozor v městských firmách"],
        ["Státní dávky"],
        [],
        ["Kandidátka SOCDEM Brno 2026"],
    ),
    "pce:ANO": P(
        "Obhajoba primátora Nadrchala: dotahovat investice. Kompetence je městský rozpočet a firmy, ne krajská nemocnice.",
        ["Kontinuita", "Investice"],
        ["Dokončit rozjeté stavby", "Stabilita vedení"],
        ["Rozpočet města, městské investice, organizace MHD"],
        ["Krajská nemocnice, státní daně"],
        ["Kraj a stát u velkých staveb"],
        ["Kampaň ANO Pardubice 2026"],
    ),
    "pce:ZIJEME": P(
        "Koaliční partner ANO, místní značka. Program je správa města, ne ideologie.",
        ["Místní správa", "Koaliční kontinuita"],
        ["Pokračovat ve vedení", "Služby ve čtvrtích"],
        ["Gese náměstka, městské služby"],
        ["Celostátní agenda"],
        [],
        ["Kandidátka Žijeme Pardubice 2026"],
    ),
    "pce:PROG_PCE": P(
        "Nejčitelnější pardubický program: družstevní byty na kasárnách, zrušit 8 obvodů, trolejbusy, klima, náplavka, školy. Zrušení obvodů je organizace statutárního města — teoreticky ano, politicky konflikt se starosty MO. Nemocnice je kraj — sami píšou, že nabídnou byty zdravotníkům.",
        ["Družstevní bydlení na kasárnách", "Zrušení městských obvodů", "Trolejbusy a cyklo", "Klima a náplavka"],
        [
            "Z Masarykových kasáren čtvrť, část pozemků družstvům",
            "Zrušit osm obvodních úřadů, posílit místní komise",
            "Trolejbus mimo kolony, páteřní cyklo, smysluplné parkování",
            "Modrozelená infrastruktura, náplavka u Automatických mlýnů",
        ],
        [
            "Městské pozemky kasáren, MHD/trolejbusy, zeleň, organizace města včetně slučování obvodů",
            "ZŠ/MŠ města",
        ],
        ["Krajská nemocnice", "Stavební zákon"],
        ["Kraj u zdravotnictví a SŠ"],
        ["progresivni-pardubice.cz/program"],
    ),
    "pce:ODS": P(
        "Samostatná ODS po rozpadu Společně. Klasická pravice: investice s rozvahou, podnikání.",
        ["Pravice", "Investice"],
        ["Občanskodemokratická správa", "Rozumné investice"],
        ["Rozpočet, územní plán, MHD"],
        ["Státní daně"],
        [],
        ["Kandidátka ODS Pardubice 2026"],
    ),
    "pce:KDU": P(
        "Lidovci s nestraníky: školy, sport, uměřenost. ZŠ město, SŠ kraj.",
        ["Školství a sport", "Konzervativní střed"],
        ["Služby, kluby, uměřenost"],
        ["MŠ/ZŠ, sportovní granty města"],
        ["SŠ (kraj)"],
        ["Kraj u středních škol"],
        ["Kandidátka Noví lidovci Pardubice"],
    ),
    "pce:STAN": P(
        "Vondra: otevřenější město. Manželství pro všechny je zákon — v lustraci nesmí skončit jako slib primátora.",
        ["Otevřenost", "Projektový management"],
        ["Otevřenější úřad"],
        ["Transparentnost magistrátu, participace"],
        ["Občanský zákoník / manželství"],
        ["Tlak na Sněmovnu u celostátních práv"],
        ["Kandidátka STAN Pardubice"],
    ),
    "pce:SPD": P(
        "SPD+Trikolora: protestní opozice. Městská policie ano.",
        ["Protest", "Pořádek"],
        ["Tvrdší opozice"],
        ["Kontrola rady, městská policie"],
        ["Migrace, EU"],
        ["Tlak na vládu"],
        ["Kandidátka SPD Pardubice"],
    ),
    "pce:NASE_PCE": P(
        "Sedlák: protikorupce a zeleň. Interpelace a kontrolní výbor jsou reálná páka menšího klubu.",
        ["Protikorupce", "Zeleň"],
        ["Hlídání zakázek", "Otevřenost"],
        ["Kontrolní mechanismy zastupitelstva, městská zeleň"],
        ["Policie ČR"],
        [],
        ["Kandidátka Naše Pardubice"],
    ),
    "pce:SRDCEM": P(
        "Velmi konkrétní místní sliby: most 2028, rezidentní zóny, parkovací dům, Červeňák, školka, byty pro zdravotníky. Most a parkování město. Nemocnice kraj — byty lékařům město nabídnout může.",
        ["Most 2028", "Rezidentní parkování", "Park Červeňák", "Školka", "Byty pro zdravotníky"],
        [
            "Pohlídat termín nového mostu 2028",
            "Rezidentní zóny na Dubině, Polabinách, Studánce",
            "Parkovací dům, parkovací aplikace",
            "Park Červeňák, workout zdarma",
            "Školka, která 6 let leží na papíře",
            "Byty pro mladé lékaře a sestry",
        ],
        [
            "Městské investice (most ve spolufinancování), parkovací zóny, parky, MŠ, městské byty",
        ],
        ["Řízení krajské nemocnice"],
        ["Kraj u termínu mostu, pokud je dotační, a u nemocnice"],
        ["srdcempropardubice.cz/program"],
    ),
}

DEFAULT_CITY = P(
    "Kandidátka do zastupitelstva města. Níže je obecná lustrace komunálních slibů — konkrétní program se veřejně nepodařilo stáhnout nebo je velmi krátký.",
    ["Správa města"],
    ["Lokální agenda dle kampaně"],
    [
        "Rozpočet obce, územní plán, MHD, MŠ/ZŠ, městské byty, zeleň, odpady, městská policie, místní poplatky",
    ],
    ["Státní daně, důchody, armáda, azyl, trestní právo"],
    ["Kraj, Sněmovna, vláda, SŽ, ŘSD"],
    ["ČSÚ kandidátka 2026"],
    "generic",
)

DEFAULT_MC = P(
    "Listina do zastupitelstva městské části / obvodu. MČ umí parky, školky, místní komunikace a svůj rozpočet. Metro, tarify MHD celého města a územní plán metropole neschválí — může je jen tlačit na magistrát.",
    ["Lokální správa MČ/obvodu"],
    ["Údržba čtvrti, školky, parkování, zeleň"],
    [
        "Rozpočet MČ, místní komunikace, parky, MŠ a ZŠ zřizované MČ, bytový fond MČ, místní poplatky v její gesci",
        "Vyhlášky MČ v mezích zákona a statutu města",
    ],
    [
        "Celoměstský územní plán, metro, tarify MHD celého města",
        "Daně, důchody, armáda, cizinecké právo",
        "Krajské nemocnice a SŠ (mimo Prahu-kraj u SŠ na magistrátu)",
    ],
    [
        "Tlak na magistrát u velkých staveb, MHD a bytů",
        "Tlak na kraj a stát tam, kde MČ naráží na cizí kompetenci",
    ],
    ["ČSÚ KV 2026"],
    "family",
)

SENATE = P(
    "Senátor píše zákony a kontroluje vládu. Nenařídí parkovací zónu ani územní plán. Může ale zvedat městská témata ve Sněmovně a u vlády.",
    ["Zákonodárství", "Kontrola vlády", "Regionální hlas"],
    ["Prosazovat zákony a personálie Senátu", "Hlásit problémy obvodu ve vládě"],
    [
        "Hlasování o zákonech, vracení norem Sněmovně",
        "Personálie podle ústavy (ÚS, ombudsman, rady médií v mezích zákona)",
        "Interpelace a vyšetřovací komise Senátu",
    ],
    [
        "Sami neschválí MHD, územní plán, rozpočet MČ ani výši důchodu bez Sněmovny a vlády",
        "Neřídí stavební úřad ani ředitele fakultní nemocnice",
    ],
    [
        "Tlak na vládu a Sněmovnu",
        "Spolupráce s magistrátem u konkrétních staveb",
    ],
    ["Ústava, jednací řád Senátu"],
    "full",
)


def city_key(city: str, fam: str) -> str:
    c = {"Praha": "praha", "Brno": "brno", "Pardubice": "pce"}[city]
    mapping = {
        "Praha": {
            "SPOLU": "SPOLU", "ODS": "SPOLU", "TOP09": "SPOLU",
            "PIRATI": "PIRATI", "SOBE": "SOBE", "KDU": "SOBE", "ZELENI": "SOBE",
            "STAN": "STAN", "ANO": "ANO", "AUTO": "AUTO", "SEN21": "SEN21",
            "SPD": "SPD", "LEVICE": "LEVICE", "KSCM": "KSCM", "SOCDEM": "KSCM",
            "TEAM": "TEAM", "LITACKA": "LITACKA", "LZPL": "LZPL", "URZA": "URZA",
            "CIBULKA": "CIBULKA", "VOLUNTIA": "VOLUNTIA", "DSZ": "DSZ",
        },
        "Brno": {
            "ODS": "ODS", "TOP09": "ODS", "SPOLU": "ODS",
            "KDU": "KDU", "STAN": "KDU",
            "PIRATI": "PIRATI", "ZELENI": "ZELENI", "ANO": "ANO",
            "KLIDEM": "KLIDEM", "LUZANKY": "LUZANKY", "AUTO": "AUTO",
            "KSCM": "KSCM", "SPD": "SPD", "SVOBODNI": "SVOBODNI",
            "NOVEBRNO": "NOVEBRNO", "PRISAHA": "PRISAHA", "SOCDEM": "SOCDEM", "DSZ": "DSZ",
        },
        "Pardubice": {
            "ANO": "ANO", "ZIJEME": "ZIJEME", "PROG_PCE": "PROG_PCE", "PIRATI": "PROG_PCE",
            "TOP09": "PROG_PCE", "ZELENI": "PROG_PCE",
            "ODS": "ODS", "KDU": "KDU", "STAN": "STAN", "SPD": "SPD",
            "NASE_PCE": "NASE_PCE", "SRDCEM": "SRDCEM", "AUTO": "AUTO",
        },
    }
    fam2 = mapping.get(city, {}).get(fam, fam)
    return f"{c}:{fam2}"


def mc_from_city(prog: dict) -> dict:
    """Z magistrátního programu udělej MČ verzi — velké stavby jdou do 'prosazovat výš'."""
    p = deepcopy(prog)
    p["programDepth"] = "family"
    p["summary"] = (
        "Místní listina příbuzná magistrátní značce. "
        + p["summary"]
        + " V MČ ale platí užší kompetence: školky, parky, místní ulice ano; metro a tarify celého města ne."
    )
    p["lustration"] = deepcopy(DEFAULT_MC["lustration"])
    # keep a few city promises as advocacy
    extra = [f"Tlačit na magistrát: {x}" for x in (prog.get("promises") or [])[:4]]
    p["lustration"]["canAdvocate"] = extra + p["lustration"]["canAdvocate"]
    p["sources"] = (prog.get("sources") or []) + ["Lustrace upravena na kompetenci MČ/obvodu"]
    return p


def apply_prog(item, prog):
    item["summary"] = prog["summary"]
    item["topics"] = prog["topics"]
    item["promises"] = prog["promises"]
    item["lustration"] = deepcopy(prog["lustration"])
    src = list(item.get("sources") or [])
    for s in prog.get("sources") or []:
        if s not in src:
            src.append(s)
    item["sources"] = src
    item["programDepth"] = prog.get("programDepth", "full")
    return item


def main():
    data = json.loads((ROOT / "data/volby.json").read_text(encoding="utf-8"))
    bodies = {b["id"]: b for b in data["bodies"]}
    counts = {"city": 0, "district": 0, "senate": 0}
    for item in data["lists"]:
        body = bodies[item["bodyId"]]
        fam = family(item.get("party") or "")
        if body["kind"] == "senate":
            apply_prog(item, SENATE)
            # keep existing summary if richer? mix
            item["summary"] = (
                f"{item['leader']} ({item['party']}) v {body['name']}. "
                + SENATE["summary"]
            )
            counts["senate"] += 1
            continue
        if body["kind"] == "city":
            key = city_key(body["city"], fam)
            prog = CITY.get(key, DEFAULT_CITY)
            apply_prog(item, prog)
            counts["city"] += 1
            continue
        # district
        key = city_key(body["city"], fam)
        base = CITY.get(key)
        if base and base.get("programDepth") == "full":
            apply_prog(item, mc_from_city(base))
        else:
            apply_prog(item, DEFAULT_MC)
            item["summary"] = (
                f"{item['party']} v {body['name']}, lídr {item.get('leader')}. "
                + DEFAULT_MC["summary"]
            )
        counts["district"] += 1

    data["meta"]["programEnrichment"] = {
        "updated": "2026-09-09",
        "counts": counts,
        "note": "Magistráty z veřejných programů 2026. MČ: stejné sliby převedené na kompetenci části. Senát: zákonodárná lustrace.",
    }
    (ROOT / "data/volby.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "data.js").write_text("window.VOLBY = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    print(counts, "total", len(data["lists"]))


if __name__ == "__main__":
    main()
