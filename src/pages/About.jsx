import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import NationsGlobe from "../components/NationsGlobe";
import { NATIONS, CATEGORY_LABELS } from "../data/nations";
import usePageTitle from "../hooks/usePageTitle";

const CATEGORY_DOT = {
  home: "#0F172A",
  traveled: "#2596be",
  reached: "#7cc0db",
};

const LOVES = [
  { emoji: "✂️", label: "Crafts" },
  { emoji: "🏡", label: "Decorating" },
  { emoji: "🪴", label: "My garden" },
  { emoji: "🏊", label: "Pool days in summer" },
  { emoji: "🐈", label: "Jesse the cat" },
  { emoji: "💛", label: "People, always" },
];

export default function About() {
  usePageTitle("Meet Jewel");
  const [selected, setSelected] = useState(null);

  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-20">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-primary to-navy-soft p-8 text-white shadow-md md:p-12">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <p className="font-ui text-[14px] font-medium uppercase tracking-widest text-white/60">
              The heart behind the recipes
            </p>
            <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Hi, I'm Maureen Peck.
            </h1>
            <p className="font-heading mt-2 text-2xl text-accent-soft md:text-3xl">
              Around here, I go by Jewel.
            </p>
            <p className="mt-5 max-w-2xl font-sans text-[18px] leading-relaxed text-white/85 md:text-[20px]">
              I'm 77 years young, and this is my little corner of the
              internet, where my recipes and my story live side by side.
            </p>
          </div>
          <img
            src="/images/maureen-portrait.webp"
            alt="Maureen Peck, smiling in a red dress"
            width="800"
            height="1367"
            className="mx-auto h-auto w-48 shrink-0 rounded-xl border-2 border-white/20 shadow-lg md:mx-0 md:w-56"
          />
        </div>
      </section>

      {/* Globe */}
      <section className="space-y-6">
        <div className="space-y-3 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-primary md:text-4xl">
            From my living room to the nations
          </h2>
          <p className="mx-auto max-w-2xl font-sans text-[18px] leading-relaxed text-primary/70">
            Some nations I've traveled to, and some have traveled to me.
            Between the two, I've watched God touch lives across{" "}
            <span className="font-semibold text-accent">
              {NATIONS.length} nations... and counting.
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm md:p-8">
          <div className="grid items-center gap-6 lg:grid-cols-2">
            <NationsGlobe selected={selected} onSelect={setSelected} />

            <div className="min-w-0 space-y-5">
              {/* Legend */}
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {["traveled", "reached", "home"].map((category) => (
                  <span
                    key={category}
                    className="flex items-center gap-2 font-ui text-[14px] text-muted-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_DOT[category] }}
                    />
                    {CATEGORY_LABELS[category]}
                  </span>
                ))}
              </div>

              {/* Nation chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
                {NATIONS.map((nation) => {
                  const isActive = selected?.id === nation.id;
                  return (
                    <button
                      key={nation.id}
                      type="button"
                      onClick={() => setSelected(isActive ? null : nation)}
                      aria-pressed={isActive}
                      className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-4 font-ui text-[16px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isActive
                          ? "border-transparent bg-accent text-white"
                          : "border-border bg-white text-primary hover:bg-secondary"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: isActive
                            ? "#ffffff"
                            : CATEGORY_DOT[nation.category],
                        }}
                      />
                      {nation.name}
                    </button>
                  );
                })}
              </div>

              {/* Story card */}
              {selected ? (
                <div
                  key={selected.id}
                  className="reveal-card rounded-[8px] border border-border border-l-4 border-l-accent bg-secondary p-5"
                >
                  <p className="font-ui text-[14px] font-medium uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABELS[selected.category]}
                  </p>
                  <h3 className="font-heading mt-1 text-xl font-bold text-primary">
                    {selected.name}
                  </h3>
                  <p className="mt-2 font-sans text-[18px] leading-relaxed text-primary/85">
                    {selected.story}
                  </p>
                </div>
              ) : (
                <p className="font-sans text-[16px] italic text-muted-foreground">
                  Tap a nation to hear its part of the story.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* My story */}
      <section className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-primary">
            My story
          </h2>
          <p className="font-sans text-[18px] leading-relaxed text-primary/85">
            By day, I'm the accounts manager at Royse &amp; Brinkmeyer, where I
            keep the numbers in line. But my real life's work happens in my
            living room.
          </p>
          <p className="font-sans text-[18px] leading-relaxed text-primary/85">
            The Lord has taken me farther than I ever dreamed. I've had the joy
            of ministering in Russia and in China, and just as wonderfully, the
            nations have come to me. Between my travels and the people who have
            passed through my home and my life, I've watched God touch lives
            across ten nations... and counting.
          </p>
          <figure>
            <img
              src="/images/maureen-and-jesse.webp"
              alt="Maureen reading in her recliner while Jesse the cat naps on the couch behind her"
              width="900"
              height="1012"
              loading="lazy"
              className="h-auto w-full rounded-xl border border-border shadow-sm"
            />
            <figcaption className="mt-2 font-sans text-[14px] italic text-muted-foreground">
              A quiet evening with my book, and Jesse supervising.
            </figcaption>
          </figure>
        </div>

        {/* Small groups */}
        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-primary">
            Every week, my home fills up
          </h2>
          <figure>
            <img
              src="/images/maureen-small-group.webp"
              alt="Maureen with her small group gathered in her living room"
              width="1000"
              height="1333"
              loading="lazy"
              className="h-auto w-full rounded-xl border border-border shadow-sm"
            />
            <figcaption className="mt-2 font-sans text-[14px] italic text-muted-foreground">
              My living room, doing what it does best.
            </figcaption>
          </figure>
          <div className="rounded-[8px] border border-border border-l-4 border-l-accent bg-white p-5 shadow-sm">
            <h3 className="font-heading text-xl font-bold text-primary">
              The widows group
            </h3>
            <p className="mt-1 font-sans text-[18px] leading-relaxed text-primary/85">
              A small group for widows. Women learning to laugh again, around
              my table.
            </p>
          </div>
          <div className="rounded-[8px] border border-border border-l-4 border-l-primary bg-white p-5 shadow-sm">
            <h3 className="font-heading text-xl font-bold text-primary">
              The prophetic group
            </h3>
            <p className="mt-1 font-sans text-[18px] leading-relaxed text-primary/85">
              A prophetic small group where we pray, listen, and watch God
              move.
            </p>
          </div>
        </div>
      </section>

      {/* Things I love */}
      <section className="space-y-6">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-primary">
          The things I love
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {LOVES.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-[8px] border border-border bg-white p-4 shadow-sm"
            >
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-xl"
              >
                {item.emoji}
              </span>
              <span className="font-ui text-[16px] font-medium text-primary">
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <p className="font-sans text-[18px] leading-relaxed text-primary/85">
          When I'm not hosting, you'll find me crafting, decorating, or out in
          the garden with my plants (they're family too). Come summer, you'll
          find me in the pool. I share the house with my cat, Jesse, who
          supervises everything. And always, always: I love people.
        </p>
        <figure>
          <img
            src="/images/maureen-housemates.webp"
            alt="Maureen at dinner with her housemates"
            width="1008"
            height="756"
            loading="lazy"
            className="h-auto w-full rounded-xl border border-border shadow-sm"
          />
          <figcaption className="mt-2 font-sans text-[14px] italic text-muted-foreground">
            Dinner out with some of my favorite people.
          </figcaption>
        </figure>
      </section>

      {/* Closing CTA */}
      <section className="rounded-2xl border border-border bg-secondary p-8 text-center">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-primary md:text-3xl">
          And this whole site? It's my recipe box.
        </h2>
        <p className="mt-2 font-sans text-[18px] text-primary/70">
          My secret? I've never loved cooking. That's exactly why I collect
          recipes that keep it simple. Every one of them has fed someone I
          love.
        </p>
        <Button
          asChild
          className="mt-5 h-12 bg-accent px-8 font-ui text-[18px] font-bold text-white hover:bg-accent-hover"
        >
          <Link to="/">Browse the recipes</Link>
        </Button>
      </section>
    </div>
  );
}
