import type { Lang } from "@/lib/i18n/languages";

/**
 * A small flag for each language.
 *
 * Drawn as inline SVG rather than emoji on purpose: Windows ships no glyphs for
 * the regional-indicator pairs, so 🇦🇪 renders there as the bare letters "AE".
 * An owner on a laptop would see a row of letter pairs where the flags should
 * be, which is worse than no flags at all.
 *
 * A flag is a country and a language is not, so these are a visual aid for
 * finding your row quickly — the name written in its own script next to it is
 * what actually identifies the language. Arabic gets the UAE flag because this
 * is a UAE product, and English the UK one because the spelling is British
 * ("Colours", "Organise").
 */

const TITLES: Record<Lang, string> = {
  en: "United Kingdom",
  ar: "United Arab Emirates",
  de: "Germany",
  es: "Spain",
  hi: "India",
  ru: "Russia",
  tr: "Türkiye",
  zh: "China",
};

function Frame({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <svg
      viewBox="0 0 60 40"
      role="img"
      aria-label={title}
      className="h-7 w-[42px] shrink-0 rounded-sm ring-1 ring-black/10"
      preserveAspectRatio="xMidYMid slice"
    >
      {children}
    </svg>
  );
}

function Stripes({ colors }: { colors: string[] }) {
  const h = 40 / colors.length;
  return (
    <>
      {colors.map((c, i) => (
        <rect key={c + i} x="0" y={i * h} width="60" height={h} fill={c} />
      ))}
    </>
  );
}

export function Flag({ lang }: { lang: Lang }) {
  const title = TITLES[lang];

  if (lang === "de") {
    return (
      <Frame title={title}>
        <Stripes colors={["#000000", "#DD0000", "#FFCE00"]} />
      </Frame>
    );
  }

  if (lang === "ru") {
    return (
      <Frame title={title}>
        <Stripes colors={["#FFFFFF", "#0039A6", "#D52B1E"]} />
      </Frame>
    );
  }

  if (lang === "es") {
    // The middle band is half the flag, not a third.
    return (
      <Frame title={title}>
        <rect x="0" y="0" width="60" height="40" fill="#AA151B" />
        <rect x="0" y="10" width="60" height="20" fill="#F1BF00" />
      </Frame>
    );
  }

  if (lang === "hi") {
    return (
      <Frame title={title}>
        <Stripes colors={["#FF9933", "#FFFFFF", "#138808"]} />
        <circle
          cx="30"
          cy="20"
          r="5.2"
          fill="none"
          stroke="#000088"
          strokeWidth="1.4"
        />
        <circle cx="30" cy="20" r="1.1" fill="#000088" />
      </Frame>
    );
  }

  if (lang === "ar") {
    // UAE: a red hoist bar, then green, white and black across.
    return (
      <Frame title={title}>
        <rect x="0" y="0" width="60" height="40" fill="#FFFFFF" />
        <rect x="15" y="0" width="45" height="13.33" fill="#00732F" />
        <rect x="15" y="26.67" width="45" height="13.33" fill="#000000" />
        <rect x="0" y="0" width="15" height="40" fill="#FF0000" />
      </Frame>
    );
  }

  if (lang === "tr") {
    return (
      <Frame title={title}>
        <rect x="0" y="0" width="60" height="40" fill="#E30A17" />
        {/* The crescent is one white disc with a red one biting into it. */}
        <circle cx="24" cy="20" r="9" fill="#FFFFFF" />
        <circle cx="27.5" cy="20" r="7.2" fill="#E30A17" />
        <Star cx={38.5} cy={20} r={4.6} fill="#FFFFFF" />
      </Frame>
    );
  }

  if (lang === "zh") {
    return (
      <Frame title={title}>
        <rect x="0" y="0" width="60" height="40" fill="#EE1C25" />
        <Star cx={11} cy={10} r={6.4} fill="#FFDE00" />
        <Star cx={22} cy={4.5} r={2.2} fill="#FFDE00" />
        <Star cx={26.5} cy={9} r={2.2} fill="#FFDE00" />
        <Star cx={26.5} cy={15} r={2.2} fill="#FFDE00" />
        <Star cx={22} cy={19.5} r={2.2} fill="#FFDE00" />
      </Frame>
    );
  }

  // English — the Union Flag, simplified to its crosses.
  return (
    <Frame title={title}>
      <rect x="0" y="0" width="60" height="40" fill="#012169" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="8" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3.5" />
      <path d="M30,0 V40 M0,20 H60" stroke="#FFFFFF" strokeWidth="13" />
      <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="7.5" />
    </Frame>
  );
}

/** A five-pointed star, because writing the ten points by hand is unreadable. */
function Star({
  cx,
  cy,
  r,
  fill,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
}) {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.382;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return <polygon points={points.join(" ")} fill={fill} />;
}
