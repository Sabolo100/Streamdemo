import Link from "next/link";
import type { Metadata } from "next";
import {
  BUILDER_CONFIG_CANDIDATES,
  BUILDER_RULE_SECTIONS,
} from "@/lib/builderRulesCatalog";

export const metadata: Metadata = {
  title: "Streamfit szabályok",
  description:
    "A Streamfit session builder működési szabályai, edzői review-hoz strukturált formában.",
};

export default function BuilderRulesPage() {
  return (
    <main className="app-shell">
      <section className="glass-panel overflow-hidden">
        <div className="border-b border-[rgba(23,33,30,0.08)] px-6 py-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="section-kicker">Builder szabálykatalógus</p>
              <h1 className="display-title mt-2">Így áll össze a Streamfit edzésterv.</h1>
              <p className="subtle-copy mt-4 max-w-3xl text-base leading-7">
                Ez az oldal a jelenlegi programkód alapján, közérthető magyar nyelven
                dokumentálja a kiválasztási, pontozási, sorrendezési és prescription
                szabályokat. A célja az, hogy egy edző gyorsan át tudja nézni, mi alapján
                dolgozik a builder, és könnyen rá tudjon mutatni a hiányzó vagy túl erős
                logikákra.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className="chip font-semibold text-[var(--accent-strong)]" href="/">
                Vissza a generátorhoz
              </Link>
              <span className="status-pill">{BUILDER_RULE_SECTIONS.length} fő szabályblokk</span>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-4 lg:gap-6 lg:p-6">
          <section className="glass-panel border border-[rgba(23,33,30,0.08)] bg-[rgba(255,255,255,0.55)] p-5">
            <p className="section-kicker">Olvasási sorrend</p>
            <ol className="mt-4 grid gap-3 text-sm leading-6 text-[var(--text-muted)] lg:grid-cols-2">
              {BUILDER_RULE_SECTIONS.map((section) => (
                <li
                  className="rounded-[18px] border border-[rgba(23,33,30,0.08)] bg-[rgba(255,252,247,0.85)] px-4 py-3"
                  key={section.order}
                >
                  <span className="font-semibold text-[var(--text)]">
                    {section.order}. {section.title}
                  </span>
                  <span className="mt-1 block">{section.purpose}</span>
                </li>
              ))}
            </ol>
          </section>

          {BUILDER_RULE_SECTIONS.map((section) => (
            <section
              className="glass-panel border border-[rgba(23,33,30,0.08)] bg-[rgba(255,255,255,0.52)] p-5 lg:p-6"
              id={`section-${section.order}`}
              key={section.order}
            >
              <div className="flex flex-col gap-2">
                <p className="section-kicker">Lépés {section.order}</p>
                <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-[var(--text)]">
                  {section.title}
                </h2>
                <p className="subtle-copy max-w-4xl text-base leading-7">{section.purpose}</p>
              </div>

              <div className="mt-5 grid gap-4">
                {section.items.map((item) => (
                  <article
                    className="rounded-[22px] border border-[rgba(23,33,30,0.08)] bg-[rgba(255,252,247,0.88)] p-5"
                    key={item.id}
                  >
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-3xl">
                        <p className="section-kicker">{item.id}</p>
                        <h3 className="mt-2 text-2xl font-semibold text-[var(--text)]">
                          {item.title}
                        </h3>
                        <p className="subtle-copy mt-3 text-base leading-7">{item.summary}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.95fr]">
                      <div className="rounded-[18px] border border-[rgba(23,33,30,0.08)] bg-[rgba(244,239,229,0.56)] p-4">
                        <p className="section-kicker">Mit csinál</p>
                        <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--text-muted)]">
                          {item.logic.map((entry) => (
                            <li key={entry}>- {entry}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid gap-4">
                        <div className="rounded-[18px] border border-[rgba(23,33,30,0.08)] bg-[rgba(255,255,255,0.84)] p-4">
                          <p className="section-kicker">Edzői review kérdések</p>
                          <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--text-muted)]">
                            {item.coachReview.map((entry) => (
                              <li key={entry}>- {entry}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-[18px] border border-[rgba(23,33,30,0.08)] bg-[rgba(255,255,255,0.84)] p-4">
                          <p className="section-kicker">Kódhelyek</p>
                          <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--text-muted)]">
                            {item.codeRefs.map((entry) => (
                              <li key={entry}>
                                <code>{entry}</code>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {item.parameters && item.parameters.length > 0 ? (
                          <div className="rounded-[18px] border border-[rgba(23,33,30,0.08)] bg-[rgba(255,255,255,0.84)] p-4">
                            <p className="section-kicker">Fő paraméterek</p>
                            <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--text-muted)]">
                              {item.parameters.map((parameter) => (
                                <li key={`${item.id}-${parameter.name}`}>
                                  <span className="font-semibold text-[var(--text)]">
                                    {parameter.name}
                                  </span>
                                  : {parameter.value}
                                  {parameter.note ? ` - ${parameter.note}` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}

          <section className="glass-panel border border-[rgba(23,33,30,0.08)] bg-[rgba(255,255,255,0.52)] p-5 lg:p-6">
            <div className="max-w-4xl">
              <p className="section-kicker">Jövőbeli fejlesztési alap</p>
              <h2 className="mt-2 font-serif text-3xl leading-tight tracking-[-0.03em] text-[var(--text)]">
                Előkészített, később dinamikusan állítható szabálypontok
              </h2>
              <p className="subtle-copy mt-3 text-base leading-7">
                Ezeket a szabályterületeket külön azonosítottuk és eltároltuk, mert később
                jó alapjai lehetnek egy adminból állítható szabályrendszernek. Jelenleg ez
                még csak dokumentációs és fejlesztői referencia, tehát most nem vezérelnek
                külön konfigurációs felületet.
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              {BUILDER_CONFIG_CANDIDATES.map((item) => (
                <article
                  className="rounded-[22px] border border-[rgba(23,33,30,0.08)] bg-[rgba(255,252,247,0.88)] p-5"
                  key={item.id}
                >
                  <p className="section-kicker">{item.id}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[var(--text)]">{item.title}</h3>
                  <p className="subtle-copy mt-3 text-base leading-7">{item.reason}</p>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
                    <div className="rounded-[18px] border border-[rgba(23,33,30,0.08)] bg-[rgba(255,255,255,0.84)] p-4">
                      <p className="section-kicker">Kódhelyek</p>
                      <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--text-muted)]">
                        {item.codeRefs.map((entry) => (
                          <li key={entry}>
                            <code>{entry}</code>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-[18px] border border-[rgba(23,33,30,0.08)] bg-[rgba(255,255,255,0.84)] p-4">
                      <p className="section-kicker">Jelenlegi paraméterek</p>
                      <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--text-muted)]">
                        {item.parameters.map((parameter) => (
                          <li key={`${item.id}-${parameter.name}`}>
                            <span className="font-semibold text-[var(--text)]">
                              {parameter.name}
                            </span>
                            : {parameter.value}
                            {parameter.note ? ` - ${parameter.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
