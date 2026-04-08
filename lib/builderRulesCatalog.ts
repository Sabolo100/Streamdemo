export interface RuleParameter {
  name: string;
  value: string;
  note?: string;
}

export interface RuleItem {
  id: string;
  title: string;
  summary: string;
  logic: string[];
  coachReview: string[];
  codeRefs: string[];
  parameters?: RuleParameter[];
}

export interface RuleSection {
  order: number;
  title: string;
  purpose: string;
  items: RuleItem[];
}

export interface ConfigurableRuleCandidate {
  id: string;
  title: string;
  reason: string;
  codeRefs: string[];
  parameters: RuleParameter[];
}

export const BUILDER_RULE_SECTIONS: RuleSection[] = [
  {
    order: 1,
    title: "Session-váz létrehozása",
    purpose:
      "A rendszer elosztja az adott 30 / 45 / 60 perces teljes időkeretet blokkokra, még azelőtt, hogy egyetlen gyakorlatot is kiválasztana.",
    items: [
      {
        id: "template.base_budgets",
        title: "Alap blokkidők és blokkdarabszámok",
        summary:
          "A session minden esetben blokk-szerkezetből indul: bemelegítés, opcionális aktiválás, fő blokk, opcionális kiegészítő, opcionális finisher, levezetés.",
        logic: [
          "A 30 / 45 / 60 perces sessionek külön alap-időkeretet kapnak blokkonként.",
          "Erő és formálás cél esetén mindig van fő blokk és kiegészítő blokk; finisher csak bizonyos feltételek mellett kerül be.",
          "Általános fitnesznél a 45 és 60 perces session már kaphat aktiválást is, de ez továbbra is opcionális.",
          "Simple mode esetén a rendszer visszaveszi a blokkban szereplő gyakorlatok számát, főleg a main, accessory és cooldown részekben.",
        ],
        coachReview: [
          "A fő blokk aránya elég nagy-e a teljes sessionön belül?",
          "A bemelegítés és levezetés időkerete elég-e, de nem túl sok-e?",
          "A simple mode valóban egyszerűsít, vagy inkább túlzottan leszűkíti a sessiont?",
        ],
        codeRefs: [
          "lib/templates.ts -> BASE_BUDGETS",
          "lib/templates.ts -> getSessionTemplate()",
          "lib/templates.ts -> shouldIncludeActivation()",
          "lib/templates.ts -> shouldIncludeFinisher()",
          "lib/templates.ts -> rebalanceSimpleMode()",
        ],
        parameters: [
          { name: "30_perc", value: "warmup 4, activation 2, main 19, accessory 3, finisher 4, cooldown 2" },
          { name: "45_perc", value: "warmup 4, activation 3, main 28, accessory 6, finisher 4, cooldown 4" },
          { name: "60_perc", value: "warmup 5, activation 4, main 39, accessory 7, finisher 4, cooldown 5" },
        ],
      },
      {
        id: "session.selection_order",
        title: "Belső kiválasztási sorrend",
        summary:
          "A rendszer nem megjelenítési sorrendben építi fel az edzést, hanem előbb a fő munkát választja ki, és csak utána igazítja ehhez a többi blokkot.",
        logic: [
          "A belső építési sorrend: main -> accessory -> activation -> warmup -> finisher -> cooldown.",
          "A végső megjelenítés viszont klasszikus edzéssorrendben történik: warmup -> activation -> main -> accessory -> finisher -> cooldown.",
          "Ennek az a célja, hogy a bemelegítés és a levezetés a ténylegesen kiválasztott fő munkához igazodjon.",
        ],
        coachReview: [
          "Valóban jó döntés-e, hogy a warmup utólag igazodik a main blokkhoz?",
          "Van-e olyan helyzet, amikor egy előre fixált warmup logikusabb lenne?",
        ],
        codeRefs: [
          "lib/sessionBuilder.ts -> getSelectionOrder()",
          "lib/sessionBuilder.ts -> renumberBlocks()",
        ],
        parameters: [
          { name: "priority.main", value: "0" },
          { name: "priority.accessory", value: "1" },
          { name: "priority.activation", value: "2" },
          { name: "priority.warmup", value: "3" },
          { name: "priority.finisher", value: "4" },
          { name: "priority.cooldown", value: "5" },
        ],
      },
    ],
  },
  {
    order: 2,
    title: "Globális előszűrés",
    purpose:
      "A teljes videókönyvtárból a builder először eltávolít minden olyan elemet, ami adatminőség, biztonság, felszerelés vagy szint miatt nem lehet releváns.",
    items: [
      {
        id: "filters.global_pool",
        title: "Mi kerülhet be egyáltalán a jelöltlistába",
        summary:
          "A sessionépítés csak a globális poolon átjutott elemekből dolgozik.",
        logic: [
          "A user által kizárt videók kiesnek.",
          "Csak valódi gyakorlat (`contentKind = exercise`) maradhat bent; tutorial és nem atomikus sequence nem.",
          "A `builderStatus = exclude` mindig kiesik; a `manual_review` csak előrehaladott környezetben maradhat bent.",
          "A gyakorlat felszerelésigénye teljes egészében kompatibilis kell legyen a user által engedett eszközökkel.",
          "A rendszer csak home safe, partner nélküli, túl nagy helyet nem igénylő tételekkel dolgozik.",
          "A sérülés- és érzékenységi szűrők, az impact tolerance, a szint és a cél szerinti alaprelevancia itt dől el.",
        ],
        coachReview: [
          "A home-safe logika nem túl szigorú vagy túl laza-e?",
          "A goal-level relevancia szűrése nem dob-e ki túl sok hasznos gyakorlatot?",
          "A manual review státusz megfelelően kezeli-e a technikás, rizikós vagy speciális setupot igénylő elemeket?",
        ],
        codeRefs: [
          "lib/filters.ts -> buildCandidatePool()",
          "lib/filters.ts -> matchesBuilderStatus()",
          "lib/filters.ts -> matchesEquipment()",
          "lib/filters.ts -> matchesHomeSafety()",
          "lib/filters.ts -> matchesRestrictions()",
          "lib/filters.ts -> matchesImpactTolerance()",
          "lib/filters.ts -> matchesLevel()",
          "lib/filters.ts -> matchesGoalBasicRelevance()",
        ],
      },
    ],
  },
  {
    order: 3,
    title: "Blokk-specifikus jogosultság",
    purpose:
      "A globális szűrés után a rendszer minden blokkhoz külön eldönti, hogy egy gyakorlat szerepileg tényleg odaillik-e.",
    items: [
      {
        id: "filters.role_classes",
        title: "Milyen mozgásosztály mehet melyik blokkba",
        summary:
          "A `movementClass` mező védi ki, hogy mobilitás vagy izoláció rossz blokkba kerüljön.",
        logic: [
          "Warmup: mobility, recovery vagy bizonyos accessory elemek, de izoláció és specialist nem.",
          "Activation: accessory vagy korlátozott compound, de izoláció és specialist nem.",
          "Main: alapvetően compound; conditioning/fat burn esetén conditioning és power is bekerülhet.",
          "Accessory: accessory, isolation vagy bizonyos compound elemek.",
          "Cooldown: csak mobility vagy recovery.",
        ],
        coachReview: [
          "A compound/accessory/isolation szétválasztás elég pontos-e a taxonomyban?",
          "Az activation blokkba engedett compound elemek még mindig valódi aktiválásnak számítanak-e?",
        ],
        codeRefs: [
          "lib/filters.ts -> matchesMovementClassForRole()",
          "types/workout.ts -> MovementClass",
          "scripts/import_videos.py -> derive_movement_class()",
        ],
      },
      {
        id: "filters.role_intent",
        title: "Fókuszterülethez kötött role-intent",
        summary:
          "A warmup, activation, main, accessory és cooldown blokkok nem ugyanazokat a tageket és slotokat keresik egy upper, lower, core vagy full body sessionben.",
        logic: [
          "A rendszer a `builderTags`, `slotDetails` és `balanceBucket` mezők alapján dönti el, hogy egy gyakorlat releváns-e az adott fókuszhoz.",
          "Upper body esetén a warmup és cooldown elsősorban felsőtesti prep/recovery tageket keres.",
          "Full body esetén több irányból elfogad jelölteket, de a main blokkban továbbra is a fő mozgásminták dominálnak.",
        ],
        coachReview: [
          "A warmup/cooldown valóban az adott nap fő régiójához igazodik-e?",
          "Nincs-e túl sok fallback, ami generikus mobilitás felé tolja a sessiont?",
        ],
        codeRefs: [
          "lib/filters.ts -> getWarmupIntentTags()",
          "lib/filters.ts -> getActivationIntentTags()",
          "lib/filters.ts -> getMainIntentTags()",
          "lib/filters.ts -> getAccessoryIntentTags()",
          "lib/filters.ts -> getCooldownIntentTags()",
          "lib/filters.ts -> matchesRoleIntent()",
        ],
      },
    ],
  },
  {
    order: 4,
    title: "Pontozás és egyensúlyozás",
    purpose:
      "A role-szűrésen átjutott jelöltek közül a builder súlyozott pontozással választ: nem csak azt nézi, hogy valami 'belefér-e', hanem azt is, hogy mennyire jó választás.",
    items: [
      {
        id: "scoring.weight_vector",
        title: "Pozitív pontszámok",
        summary:
          "A jelöltek több tényezőből kapnak pontot: role fit, goal fit, focus fit, szint, terhelés, technikai profil, prescription-fit és home safety.",
        logic: [
          "A legnagyobb fix súlyok a role fit, builder intent és goal match körül vannak.",
          "Külön pozitív faktor a movementClass-fit, variation-fit és a blokkhoz illeszkedő prescription-profile.",
          "Külön bónuszt kaphat egy gyakorlat, ha segít helyreállítani az upper/lower/core vagy push/pull egyensúlyt.",
        ],
        coachReview: [
          "Jó-e a súlyok aránya, vagy bizonyos szakmai szempontok túl gyengék/erősek?",
          "A rendszer kellően preferálja-e az alap, bevált mintákat a speciális variációkhoz képest?",
        ],
        codeRefs: [
          "lib/scoring.ts -> scoreVideo()",
          "lib/scoring.ts -> getGoalMatch()",
          "lib/scoring.ts -> getBuilderIntentMatch()",
          "lib/scoring.ts -> getMovementClassFit()",
          "lib/scoring.ts -> getVariationFit()",
          "lib/scoring.ts -> getPrescriptionFit()",
        ],
        parameters: [
          { name: "role_fit", value: "18x" },
          { name: "goal_match", value: "14x" },
          { name: "builder_intent", value: "16x" },
          { name: "focus_match", value: "10x" },
          { name: "impact_fit", value: "10x" },
          { name: "movement_class_fit", value: "10x" },
          { name: "variation_fit", value: "8x" },
          { name: "prescription_fit", value: "8x" },
        ],
      },
      {
        id: "scoring.balance_logic",
        title: "Fókusz-specifikus egyensúlylogika",
        summary:
          "A rendszer külön szabályokkal próbálja egyensúlyban tartani az upper-body, lower-body és full-body main blokkokat.",
        logic: [
          "Upper body main blokkban a rendszer push/pull arányt figyel, és bünteti az egyoldalú tolásdominanciát.",
          "Lower body main blokkban külön számolja a knee-domináns és hip-domináns elemeket.",
          "Full body esetén próbál legalább lower, upper push, upper pull és trunk típusú elemeket elérni, és bünteti a túlzott egyoldalúságot.",
          "Kisebb bónusz járhat a több síkú mozgásért is, ha addig minden sagittal volt.",
        ],
        coachReview: [
          "A full body minimális lefedettségi elve elég-e, vagy hiányzik belőle például horizontális/vertikális vagy abdukciós/addukciós kontroll?",
          "A push/pull egyensúlyozás felsőtestnél elég szigorú-e?",
        ],
        codeRefs: [
          "lib/scoring.ts -> getBalanceAdjustment()",
        ],
      },
    ],
  },
  {
    order: 5,
    title: "Redundancia, átmenetek, szakmai hibák kerülése",
    purpose:
      "A builder nem csak pontoz, hanem aktívan bünteti a túl hasonló, rosszul egymásra tett vagy szakmailag rossz blokkba kerülő elemeket.",
    items: [
      {
        id: "scoring.redundancy_transition",
        title: "Duplikáció és átmeneti büntetések",
        summary:
          "A túl sok hasonló exercise family, movement family, pattern vagy pozícióváltás pontlevonást kap.",
        logic: [
          "A warmup / activation / cooldown blokkokban erősebb a duplikációbüntetés, mint a main blokkban.",
          "A rendszer bünteti az azonos exercise family és detailed movement family ismétlését.",
          "Büntetett a kezdőknél a túl sok helyzetváltás és az egymás utáni unilateral terhelés.",
          "Külön büntetés van arra is, ha ugyanaz a body region vagy balance bucket túl gyakran ismétlődik a main blokkban.",
        ],
        coachReview: [
          "Elég erős-e a duplikációbüntetés a valóban változatos sessionhez?",
          "A kezdőknek szánt mozgásflow valóban elég sima-e?",
        ],
        codeRefs: [
          "lib/scoring.ts -> getRedundancyPenalty()",
          "lib/scoring.ts -> getTransitionPenalty()",
        ],
      },
      {
        id: "scoring.structural_mismatch",
        title: "Szerkezeti mismatch büntetés",
        summary:
          "A rendszer extra pontlevonással próbálja megelőzni a rossz blokkszerepeket: izoláció a fő blokkban, nem odaillő cooldown, rossz fókuszú accessory stb.",
        logic: [
          "Main blokkban a nem compound jelöltek erős levonást kapnak, kivéve bizonyos conditioning/core helyzeteket.",
          "Warmup blokkban a compound, isolation, power és conditioning jelöltek levonást kapnak.",
          "Cooldown blokkban minden nem mobility/recovery elem jelentős levonást kap.",
          "Upper-body accessory blokkban az alsótesti kiegészítők külön büntetést kapnak.",
        ],
        coachReview: [
          "A main blokk védelme elég erős-e az izolációs vagy túl speciális elemek ellen?",
          "A cooldown elég tisztán recovery-logikájú marad-e?",
        ],
        codeRefs: [
          "lib/scoring.ts -> getStructuralMismatchPenalty()",
        ],
      },
    ],
  },
  {
    order: 6,
    title: "Blokkon belüli sorrend",
    purpose:
      "A kiválasztott elemek blokkon belüli sorrendje külön algoritmus alapján áll össze; itt dől el, hogy mi kerül előre és mi későbbre.",
    items: [
      {
        id: "ordering.role_priorities",
        title: "Sorrendi prioritások blokk-típusonként",
        summary:
          "A sorrendezés a candidate score-ra épül rá, de külön logikával emeli előre vagy tolja hátra a compound, mobility, recovery, isolation és variation szinteket.",
        logic: [
          "Warmupban a mobility megy előre, recovery inkább később jön.",
          "Activationban az accessory jellegű kontroll-elemek előnyt kapnak.",
          "Main blokkban a compound elemek kapják a legerősebb prioritást; accessory vagy isolation hátrébb kerül.",
          "Accessory blokkban az accessory megy előre, az isolation csak utána.",
          "Cooldownban a mobility előbb, a recovery/downregulation utána jön.",
        ],
        coachReview: [
          "A sorrend valóban compound -> accessory -> isolation elvet követ-e, ahol ez releváns?",
          "A warmup és cooldown sorrend funkcionálisan logikus-e?",
        ],
        codeRefs: [
          "lib/ordering.ts -> orderBlockExercises()",
          "lib/ordering.ts -> getMovementClassPriority()",
          "lib/ordering.ts -> getVariationPriority()",
          "lib/ordering.ts -> getBucketPriority()",
        ],
      },
    ],
  },
  {
    order: 7,
    title: "Ismétlés-, idő- és pihenőlogika",
    purpose:
      "A builder nem minden gyakorlatnak ugyanazt a prescriptiont adja, hanem profile alapján dönt a reps / hold / time formátumról, a körszámról és a pihenőidőről.",
    items: [
      {
        id: "prescriptions.profile_logic",
        title: "Formatum kiválasztása gyakorlatprofil alapján",
        summary:
          "A `prescriptionProfile` és a `contractionStyle` mezők döntik el, hogy egy gyakorlat ismétléses, időre menő vagy tartásos feladatként jelenjen meg.",
        logic: [
          "Mobility prep elemek általában időre mennek, cooldownban inkább tartásként jelennek meg.",
          "Recovery reset elemek tartásként/légzéses elemként jelennek meg.",
          "Compound strength elemek alapvetően ismétlésesek.",
          "Conditioning és power profil időalapú munkát kap.",
          "Core control és accessory profil külön logikát követ role szerint.",
        ],
        coachReview: [
          "A tartásos, időalapú és ismétléses gyakorlatok elválasztása szakmailag helyes-e?",
          "A rendszer nem ír-e ismétlést olyan elemre, ami valójában tartás vagy fordítva?",
        ],
        codeRefs: [
          "lib/prescriptions.ts -> resolveFormatForRole()",
          "types/workout.ts -> PrescriptionProfile",
          "scripts/import_videos.py -> derive_prescription_profile()",
        ],
      },
      {
        id: "prescriptions.rounds_rest_reps",
        title: "Körszám, pihenő és ismétléstartomány",
        summary:
          "A block budgetből számolt per-set munkaidő és a profil-alapú rep bounds együtt adják a végső prescriptiont.",
        logic: [
          "Main compound blokkban a rendszer több kört és hosszabb pihenőt ad, mint accessory vagy activation esetén.",
          "Strength jellegű main blokkban a rep range alacsonyabb; tone/general esetén magasabb.",
          "Isolation volume elemek magasabb ismétléstartományba kerülnek, mint a compound strength elemek.",
          "A rest idők már nem csak cél alapján változnak, hanem a blokk és a profil alapján is.",
          "A teljes blokkidőből számolt becsült összidő a transition, round break és rest komponenseket is figyelembe veszi.",
        ],
        coachReview: [
          "A 45-60 másodperces main pihenők elegendők-e a jelenlegi strength logikához?",
          "A beginner main rep range nem túl alacsony vagy túl magas-e az adott profilokhoz?",
          "A blokk-szintű időbecslés elég hiteles-e a valós végrehajtáshoz képest?",
        ],
        codeRefs: [
          "lib/prescriptions.ts -> resolveRounds()",
          "lib/prescriptions.ts -> resolveRestSeconds()",
          "lib/prescriptions.ts -> getWorkBounds()",
          "lib/prescriptions.ts -> getRepBounds()",
          "lib/prescriptions.ts -> buildBlockPlan()",
        ],
        parameters: [
          { name: "main_compound_rest_beginner", value: "45 mp" },
          { name: "main_compound_rest_halado", value: "60 mp" },
          { name: "activation_rest", value: "12-15 mp" },
          { name: "accessory_rest", value: "20-25 mp" },
          { name: "strength_main_reps_beginner", value: "6-8" },
          { name: "general_main_reps_beginner", value: "8-10" },
          { name: "isolation_volume_reps", value: "10-12 / 10-15" },
        ],
      },
    ],
  },
  {
    order: 8,
    title: "Taxonómiai függőségek és jelenlegi készletkorlátok",
    purpose:
      "A builder minősége közvetlenül függ attól, hogy mennyire pontos a videók taxonómiája és mennyire gazdag az egyes kategóriák lefedettsége.",
    items: [
      {
        id: "taxonomy.core_fields",
        title: "Kulcsmezők, amikre a builder támaszkodik",
        summary:
          "A jelenlegi logika elsősorban a `movementClass`, `variationTier`, `prescriptionProfile`, `balanceBucket`, `movementFamilyDetailed`, `slotDetails`, `builderTags`, `builderStatus` mezőket használja.",
        logic: [
          "Ha ezek a mezők hibásak vagy túl tágak, a builder nem fog tudni jól dönteni.",
          "A compound vs accessory vs isolation különválasztás most már explicit mező.",
          "A specialist / progression / regression logika most már szintén explicit, nem csak szövegkövetkeztetés.",
        ],
        coachReview: [
          "A jelenlegi taxonómia elég mély-e az edzői döntésekhez?",
          "Van-e még olyan szakmailag fontos tengely, ami hiányzik a mezők közül?",
        ],
        codeRefs: [
          "types/workout.ts -> VideoItem",
          "scripts/import_videos.py -> derive_movement_class()",
          "scripts/import_videos.py -> derive_variation_tier()",
          "scripts/import_videos.py -> derive_prescription_profile()",
          "scripts/build_runtime_from_ssot.py -> validate_runtime_record()",
        ],
      },
      {
        id: "taxonomy.current_inventory_notes",
        title: "Jelenlegi inventory-megfigyelések",
        summary:
          "A jelenlegi audit szerint nem minden prep/recovery kategória egyformán erős a könyvtárban, ezért bizonyos sessionek konzervatívabbak maradhatnak.",
        logic: [
          "A teljes inventory nagy része compound vagy accessory, ami jó a main/accessory blokkokhoz.",
          "A full body és lower body mintákban több a választási lehetőség, mint upper-body prep és recovery irányban.",
          "A specialista vagy progressziós variációk száma magas, ezért a taxonomy minősége kulcskérdés a kezdőbarát outputhoz.",
        ],
        coachReview: [
          "A felsőtesti prep és cooldown készlet elég gazdag-e szakmailag?",
          "Kell-e célzottan több standard, kezdőbarát felsőtesti előkészítő és levezető anyag a librarybe?",
        ],
        codeRefs: [
          "data/video_taxonomy_builder_audit.json",
          "scripts/audit_builder_taxonomy.py",
        ],
        parameters: [
          { name: "compound_count", value: "1008" },
          { name: "accessory_count", value: "502" },
          { name: "isolation_count", value: "185" },
          { name: "standard_variations", value: "759" },
          { name: "progression_variations", value: "684" },
          { name: "specialist_variations", value: "420" },
        ],
      },
    ],
  },
];

export const BUILDER_CONFIG_CANDIDATES: ConfigurableRuleCandidate[] = [
  {
    id: "cfg.template.base_budgets",
    title: "Blokkidő-keretek",
    reason:
      "Később külön edzői profilok, programtípusok vagy customer segmentek alapján jól paraméterezhető lenne.",
    codeRefs: ["lib/templates.ts -> BASE_BUDGETS"],
    parameters: [
      { name: "warmup", value: "4 / 4 / 5 perc" },
      { name: "activation", value: "2 / 3 / 4 perc" },
      { name: "main", value: "19 / 28 / 39 perc" },
      { name: "accessory", value: "3 / 6 / 7 perc" },
      { name: "cooldown", value: "2 / 4 / 5 perc" },
    ],
  },
  {
    id: "cfg.template.block_inclusion",
    title: "Aktiválás és finisher bekerülési feltételei",
    reason:
      "Ezek a jelenlegi if-ágak üzletileg és szakmailag is könnyen hangolható szabállyá alakíthatók.",
    codeRefs: [
      "lib/templates.ts -> shouldIncludeActivation()",
      "lib/templates.ts -> shouldIncludeFinisher()",
    ],
    parameters: [
      { name: "activation_if", value: "goal in [strength, tone, core] vagy duration >= 45" },
      { name: "finisher_if", value: "duration >= 45, not simpleMode, high energy vagy conditioning/fat_burn" },
    ],
  },
  {
    id: "cfg.filters.global_pool",
    title: "Globális előszűrési szabályok",
    reason:
      "Későbbi admin felületen állíthatóvá tehetők a builderStatus, homeSafe, manual_review és environment szintű kapuk.",
    codeRefs: [
      "lib/filters.ts -> buildCandidatePool()",
      "lib/filters.ts -> matchesBuilderStatus()",
      "lib/filters.ts -> matchesHomeSafety()",
    ],
    parameters: [
      { name: "manual_review_policy", value: "csak advanced, nem simpleMode, nincs fizikai limitáció" },
      { name: "home_safe_policy", value: "homeSafe && !requiresLargeSpace && !requiresPartner" },
    ],
  },
  {
    id: "cfg.filters.role_classes",
    title: "Role -> movementClass hozzárendelések",
    reason:
      "Ez az egyik legjobb jövőbeli állítható réteg, mert szakmailag sokat számít, de technikailag jól izolálható.",
    codeRefs: ["lib/filters.ts -> matchesMovementClassForRole()"],
    parameters: [
      { name: "warmup_allowed", value: "mobility, recovery, accessory" },
      { name: "activation_allowed", value: "accessory, compound" },
      { name: "main_allowed", value: "compound / conditioning / power" },
      { name: "cooldown_allowed", value: "mobility, recovery" },
    ],
  },
  {
    id: "cfg.scoring.weights",
    title: "Pontozási súlyvektor",
    reason:
      "A builder döntésminőségét leggyorsabban ezek a súlyok tudják finomhangolni, ezért később érdemes lehet külön konfigurálni.",
    codeRefs: ["lib/scoring.ts -> scoreVideo()"],
    parameters: [
      { name: "role_fit", value: "18" },
      { name: "goal_match", value: "14" },
      { name: "builder_intent", value: "16" },
      { name: "movement_class_fit", value: "10" },
      { name: "variation_fit", value: "8" },
      { name: "prescription_fit", value: "8" },
    ],
  },
  {
    id: "cfg.scoring.balance",
    title: "Upper/lower/core egyensúlyszabályok",
    reason:
      "Később különféle coach presetekhez más egyensúlyelv lehet ideális, ezért ezt érdemes azonosítva tartani.",
    codeRefs: ["lib/scoring.ts -> getBalanceAdjustment()"],
    parameters: [
      { name: "upper_body_balance", value: "push/pull számlálás" },
      { name: "lower_body_balance", value: "knee/hip számlálás" },
      { name: "full_body_coverage", value: "lower + upper push + upper pull + trunk preferencia" },
    ],
  },
  {
    id: "cfg.ordering.priorities",
    title: "Blokkon belüli sorrendi prioritások",
    reason:
      "A compound->accessory->isolation és mobility->recovery sorrend később külön policyként is kezelhető.",
    codeRefs: [
      "lib/ordering.ts -> getMovementClassPriority()",
      "lib/ordering.ts -> getVariationPriority()",
      "lib/ordering.ts -> getBucketPriority()",
    ],
    parameters: [
      { name: "main_order", value: "compound előre" },
      { name: "accessory_order", value: "accessory előre, isolation utána" },
      { name: "cooldown_order", value: "mobility előre, recovery utána" },
    ],
  },
  {
    id: "cfg.prescriptions.rounds_rest_reps",
    title: "Körszám, pihenő és rep-range logika",
    reason:
      "Későbbi dinamikus coach control számára ez az egyik legfontosabb, mert közvetlenül befolyásolja az edzés karakterét.",
    codeRefs: [
      "lib/prescriptions.ts -> resolveRounds()",
      "lib/prescriptions.ts -> resolveRestSeconds()",
      "lib/prescriptions.ts -> getRepBounds()",
    ],
    parameters: [
      { name: "main_strength_rest_beginner", value: "45 mp" },
      { name: "main_strength_rest_advanced", value: "60 mp" },
      { name: "activation_rounds", value: "2-3 kör" },
      { name: "compound_strength_reps", value: "6-8 / 8-10 / 8-12 a céltól függően" },
    ],
  },
];
