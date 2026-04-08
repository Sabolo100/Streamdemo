# Streamfit edzésterv-generátor szabályai

Ez a leírás a jelenlegi programkód alapján foglalja össze, hogy a rendszer milyen sorrendben, milyen szűrők és döntési szabályok mentén választ gyakorlatokat, és hogyan rakja őket blokkba, majd sorrendbe.

A célja az, hogy egy edző szakmai szemmel át tudja nézni:

- milyen elvek szerint dolgozik a builder,
- van-e benne felesleges vagy túl gyenge szabály,
- hiányzik-e olyan szakmai kontroll, ami fontos lenne.

## 1. A rendszer először session-vázat készít

A builder nem rögtön gyakorlatokat válogat, hanem először felosztja a teljes időt blokkokra.

Az alap blokkok:

- bemelegítés,
- opcionális aktiválás,
- fő blokk,
- opcionális kiegészítő blokk,
- opcionális finisher,
- levezetés.

A blokkidők eltérnek attól függően, hogy a session 30, 45 vagy 60 perces.

Jelenlegi alap-időkeretek:

- 30 perc: warmup 4, activation 2, main 19, accessory 3, finisher 4, cooldown 2 perc
- 45 perc: warmup 4, activation 3, main 28, accessory 6, finisher 4, cooldown 4 perc
- 60 perc: warmup 5, activation 4, main 39, accessory 7, finisher 4, cooldown 5 perc

Mit érdemes edzőként ellenőrizni:

- elég nagy-e a fő blokk a session céljához,
- nincs-e túl sok warmup vagy cooldown,
- simple mode esetén nem lesz-e túl kevés a hasznos terhelés.

## 2. A rendszer nem megjelenítési sorrendben épít

A builder belső építési sorrendje:

1. fő blokk
2. kiegészítő blokk
3. aktiválás
4. bemelegítés
5. finisher
6. levezetés

Ez azért fontos, mert a warmup és a cooldown nem vakon készül, hanem a már kiválasztott fő terheléshez próbál igazodni.

A user felé a rendszer ettől függetlenül normál edzéssorrendben jeleníti meg a blokkokat:

1. bemelegítés
2. aktiválás
3. fő blokk
4. kiegészítő blokk
5. finisher
6. levezetés

Mit érdemes edzőként ellenőrizni:

- jó-e, hogy a warmup a ténylegesen kiválasztott fő munkához igazodik,
- nincs-e olyan programtípus, ahol jobb lenne részben fix warmup-sablon.

## 3. A teljes videókönyvtárból először globális szűrés készül

Mielőtt bármelyik blokk gyakorlatokat kapna, a builder elkészíti a globális jelöltlistát.

Ezen a szinten kiesik minden olyan elem, ami:

- a user által kézzel ki lett zárva,
- nem valódi gyakorlat, hanem tutorial,
- nem önálló gyakorlat, hanem sequence vagy follow-along jellegű asset,
- a `builderStatus` alapján nem használható,
- nem fér bele a választott eszközparkba,
- nem home safe,
- túl sok helyet vagy partnert igényel,
- nem fér bele a választott impact szintbe,
- nem megfelelő a kiválasztott szinthez,
- alapvetően nem releváns a célhoz.

Mit érdemes edzőként ellenőrizni:

- a globális kizárások nem túl szigorúak vagy túl lazák-e,
- a home-safe logika valóban azt engedi-e be, ami otthoni sessionbe való,
- a goal-level relevancia nem szűkíti-e túl agresszívan a készletet.

## 4. Ezután blokk-specifikus role-szűrés jön

Minden blokk csak bizonyos típusú gyakorlatokat fogad el.

### Warmup

Alapvetően:

- mobility,
- recovery,
- bizonyos accessory elemek.

Nem való ide:

- izoláció,
- specialist,
- túl intenzív vagy túl komplex gyakorlat.

### Activation

Alapvetően:

- accessory,
- korlátozott compound kontroll-elemek.

Nem való ide:

- izoláció,
- specialist,
- cardio-locomotion.

### Main

Alapvetően:

- compound elemek,
- conditioning cél esetén conditioning vagy power elemek is.

### Accessory

Alapvetően:

- accessory,
- isolation,
- bizonyos compound elemek.

### Cooldown

Alapvetően:

- mobility,
- recovery.

Mit érdemes edzőként ellenőrizni:

- elég jó-e a compound / accessory / isolation szétválasztás,
- az activation blokk valóban aktiválás marad-e,
- a cooldown tényleg levezetésnek hat-e és nem marad benne felesleges munka.

## 5. A fókuszterület minden blokknál külön számít

Nem ugyanaz a warmup és cooldown egy:

- upper body,
- lower body,
- core,
- full body sessionben.

A rendszer a `builderTags`, `slotDetails` és `balanceBucket` mezőket használja arra, hogy eldöntse:

- melyik gyakorlat előkészítés,
- melyik aktiválás,
- melyik recovery,
- és melyik testtájhoz kötődik.

Példák:

- upper body napnál a warmup és cooldown inkább felsőtesti prep/recovery tageket keres,
- lower body napnál inkább csípő, alsótest és törzs irányba keres,
- full body napnál lazább a szűrés, de a fő blokkban továbbra is fő mozgásmintákat keres.

Mit érdemes edzőként ellenőrizni:

- tényleg azt készíti-e elő a warmup, amit a main blokk dolgoztat,
- a cooldown valóban ugyanahhoz a fókuszhoz kapcsolódik-e.

## 6. A builder nem csak szűr, hanem pontoz

A blokkba beférő jelöltek pontszámot kapnak. A legfontosabb pozitív szempontok:

- role fit,
- goal fit,
- builder intent fit,
- focus fit,
- level fit,
- impact fit,
- limitation safety,
- beginner friendliness,
- energy fit,
- style fit,
- prescription fit,
- movement class fit,
- variation fit,
- home-safe bónusz,
- balanszhelyreállító bónusz.

Ez azt jelenti, hogy a builder nem csak azt nézi, hogy valami “belefér-e”, hanem azt is, hogy mennyire jó választás az adott sessionbe.

Mit érdemes edzőként ellenőrizni:

- jók-e a súlyok arányai,
- nem túl gyenge-e egy-egy fontos szakmai szempont,
- eléggé előnyt kapnak-e az alap, bevált mozgások a speciális variációkhoz képest.

## 7. A rendszer külön figyeli az egyensúlyt

### Upper body main blokk

Figyeli a push és pull arányt.

A cél:

- ne legyen csak nyomás,
- ne legyen egyoldalú vállterhelés,
- legyen húzó elem is.

### Lower body main blokk

Figyeli a knee-domináns és hip-domináns mintákat.

A cél:

- ne legyen csak squat/lunge,
- ne legyen csak hinge,
- legyen valamilyen alap alsótesti balansz.

### Full body main blokk

A rendszer megpróbál legalább ilyen irányokat lefedni:

- lower,
- upper push,
- upper pull,
- trunk.

Ez még nem teljes edzői programozás, de már nem engedi teljesen szétcsúszni a blokkot.

Mit érdemes edzőként ellenőrizni:

- ez a full body lefedettség elég-e,
- hiányzik-e belőle további kötelező balansztengely,
- kell-e külön szabály az abdukció / addukció vagy horizontális / vertikális bontásra.

## 8. A rendszer bünteti a redundanciát és a rossz átmeneteket

Pontlevonás jár, ha túl sokszor ismétlődik:

- ugyanaz az exercise family,
- ugyanaz a movement family,
- ugyanaz a primary pattern,
- ugyanaz a balance bucket,
- ugyanaz a body region.

Kezdőknél külön levonást kap:

- a túl sok helyzetváltás,
- a túl sok egymás utáni egyoldalas terhelés,
- a rángatott eszköz- vagy setupváltás.

Mit érdemes edzőként ellenőrizni:

- elég erős-e a duplikációbüntetés,
- tényleg kényelmes-e a flow kezdőknek,
- nem marad-e még mindig túl sok egymásra hasonlító gyakorlat egy blokkban.

## 9. A blokkokon belüli sorrend külön logikával áll össze

A builder a kiválasztott gyakorlatokat még nem a végső sorrendben tartja meg, hanem újrarendezi.

Fő elvek:

- warmupban a mobility kerül előre,
- cooldownban a mobility jön előbb, a recovery később,
- main blokkban a compound kerül előre,
- accessory blokkban az accessory megy előre, az isolation utána,
- progression és specialist elemek inkább hátrébb csúsznak,
- regression és standard elemek előnyt kapnak kezdőknél.

Mit érdemes edzőként ellenőrizni:

- teljesül-e a compound -> accessory -> isolation elv,
- a warmup és cooldown belső sorrendje funkcionálisan logikus-e,
- nincs-e túl sok korai specialist vagy túl technikás elem.

## 10. Az ismétlés- és időlogika már profilalapú

A builder nem ugyanazzal az ismétléstartománnyal kezeli:

- a compound strength,
- az accessory volume,
- az isolation volume,
- a core control,
- a conditioning,
- a mobility,
- a recovery elemeket.

### Formatum

A rendszer eldönti, hogy az adott elem:

- ismétléses,
- tartásos,
- időre végzett feladat legyen.

### Körszám

Role és blokkidő függvénye.

Általános elv:

- main blokk több kör,
- accessory kevesebb,
- cooldown rövidebb, nyugodtabb.

### Pihenőidő

A rendszer már nem csak a session céljától, hanem a blokk és a profil típusától is függően ad pihenőt.

Példák:

- beginner main strength compound: 45 mp pihenő,
- advanced main strength compound: 60 mp pihenő,
- activation: kb. 12-15 mp,
- accessory: kb. 20-25 mp.

### Rep range

Példák:

- beginner strength main compound: 6-8,
- beginner general main compound: 8-10,
- isolation volume: kb. 10-12 vagy 10-15,
- core control: általában alacsonyabb-közepes ismétléstartomány vagy idő.

Mit érdemes edzőként ellenőrizni:

- a pihenőidők valóban megfelelnek-e a kitűzött célnak,
- az ismétléstartományok reálisak-e az adott profilhoz,
- a blokk-szintű időbecslés elég hiteles-e a valóságban.

## 11. A taxonómia közvetlenül meghatározza a builder minőségét

A jelenlegi rendszer legerősebben ezekre a mezőkre támaszkodik:

- `movementClass`
- `variationTier`
- `prescriptionProfile`
- `balanceBucket`
- `movementFamilyDetailed`
- `slotDetails`
- `builderTags`
- `builderStatus`

Ha ezek hibásak, túl lazák vagy túl kevéssé részletesek, a builder sem fog jól dönteni.

Ezért a rendszer minősége nem csak a kódon múlik, hanem azon is, hogy a videó-taxonómia mennyire pontos.

## 12. Jelenlegi, ismert készletkorlátok

A jelenlegi audit alapján:

- a compound készlet erős,
- az accessory készlet is használható,
- az upper-body prep és recovery irány nem olyan gazdag, mint a lower/full-body,
- sok progression és specialist variáció van a könyvtárban, ezért fontos a jó gate-elés.

Ez azt jelenti, hogy a builder logikája már sokkal konzisztensbb lehet, de bizonyos sessionek minőségét továbbra is korlátozza a library szerkezete.

Mit érdemes edzőként ellenőrizni:

- kell-e több standard upper-body warmup és cooldown anyag,
- kell-e több kezdőbarát, egyszerű, full-body staple gyakorlat,
- kell-e még finomabb taxonómia bizonyos mozgásmintákhoz.

## 13. Mire érdemes különösen rákérdezni edzői review-ban

Ha egy edző ezt a rendszert auditálja, szerintem ezek a legfontosabb kérdések:

1. Elég jó-e a compound / accessory / isolation besorolás?
2. A full body minimális lefedettség elég-e, vagy további kötelező tengelyek kellenek?
3. A warmup és cooldown valóban a fő blokkhoz igazodik-e?
4. A current rep / rest logika valóban azt a training effectet adja-e, amit a címke ígér?
5. A specialist variációk elég jól vannak-e visszafogva kezdő és általános sessionekben?
6. A taxonomyban van-e még olyan hiányzó mező, ami nélkülözhetetlen lenne valódi edzői minőséghez?

## Kapcsolódó strukturált referencia

A szabályok gépileg azonosítható, fejlesztői katalógusa itt található:

- `lib/builderRulesCatalog.ts`

Ez a fájl már úgy van szervezve, hogy később alapja lehessen egy dinamikusan állítható szabályrendszernek vagy admin felületnek.
