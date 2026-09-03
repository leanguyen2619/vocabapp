/** The landing page's hero mascot — a friendly reindeer presenting 5 wooden blocks that spell
 * "VOCAB", front-facing and built from simple flat shapes (the same hand-authored-SVG approach as
 * NatureHeroIllustration, just a character instead of a landscape). Palette is deliberately
 * reindeer-led: warm caramel/cream fur with a coral nose, set against a warm autumn sky and mossy
 * ground so the blocks' muted accent colors (one per letter) have something calm to sit against
 * rather than competing with a bright background. The blocks sit on their own row well below the
 * reindeer's (deliberately narrow, short-legged) body, and are drawn last so all 5 letters stay
 * fully readable even if the body's silhouette drifts during future tweaks. */
export function WelcomeReindeerIllustration({ className }: { className?: string }) {
  const letters: { char: string; x: number; color: string }[] = [
    { char: "V", x: 136, color: "#6f8f52" },
    { char: "O", x: 198, color: "#c4674a" },
    { char: "C", x: 260, color: "#5b84a3" },
    { char: "A", x: 322, color: "#d1963f" },
    { char: "B", x: 384, color: "#c07a86" },
  ];
  const blockY = 315;

  return (
    <svg viewBox="0 0 520 380" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="wri-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdf3df" />
          <stop offset="100%" stopColor="#f6dfae" />
        </linearGradient>
        <linearGradient id="wri-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9bb87c" />
          <stop offset="100%" stopColor="#7c9f5e" />
        </linearGradient>
        <linearGradient id="wri-block" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0dbae" />
          <stop offset="100%" stopColor="#e2c691" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="520" height="380" fill="url(#wri-sky)" />

      {/* Background fir trees */}
      <g opacity="0.55" fill="#5b7a4c">
        <path d="M56,190 L80,190 L68,168 L78,168 L64,146 L73,146 L58,122 L43,146 L52,146 L38,168 L48,168 Z" />
        <path d="M464,190 L486,190 L475,170 L484,170 L471,150 L479,150 L466,128 L453,150 L461,150 L448,170 L457,170 Z" />
      </g>

      {/* Ground */}
      <path d="M0,246 Q260,214 520,246 L520,380 L0,380 Z" fill="url(#wri-ground)" />
      <ellipse cx="260" cy="345" rx="190" ry="14" fill="#3d2b1f" opacity="0.12" />

      {/* Reindeer, front-facing — narrow body + short legs, kept well clear of the block row below */}
      <g>
        {/* Antlers */}
        <g stroke="#7a5232" strokeWidth="6" fill="none" strokeLinecap="round">
          <path d="M228,112 Q215,80 205,55 M215,90 Q195,75 180,65 M212,75 Q198,55 190,40" />
          <path d="M292,112 Q305,80 315,55 M305,90 Q325,75 340,65 M308,75 Q322,55 330,40" />
        </g>

        {/* Ears */}
        <ellipse cx="203" cy="126" rx="15" ry="25" fill="#a9713f" transform="rotate(-25 203 126)" />
        <ellipse cx="317" cy="126" rx="15" ry="25" fill="#a9713f" transform="rotate(25 317 126)" />
        <ellipse cx="203" cy="126" rx="7" ry="15" fill="#f3e3cb" transform="rotate(-25 203 126)" />
        <ellipse cx="317" cy="126" rx="7" ry="15" fill="#f3e3cb" transform="rotate(25 317 126)" />

        {/* Body — narrow, so it never spans the outer letter blocks */}
        <path d="M216,272 Q212,204 260,199 Q308,204 304,272 Z" fill="#b5794a" />
        <ellipse cx="260" cy="236" rx="30" ry="27" fill="#f3e3cb" />

        {/* Short legs, tucked under the body */}
        <rect x="224" y="256" width="20" height="26" rx="9" fill="#a9713f" />
        <rect x="276" y="256" width="20" height="26" rx="9" fill="#a9713f" />
        <ellipse cx="234" cy="282" rx="12" ry="7" fill="#3d2b1f" />
        <ellipse cx="286" cy="282" rx="12" ry="7" fill="#3d2b1f" />

        {/* Head */}
        <ellipse cx="260" cy="150" rx="68" ry="60" fill="#b5794a" />

        {/* Cheeks */}
        <ellipse cx="205" cy="168" rx="14" ry="9" fill="#e2574c" opacity="0.35" />
        <ellipse cx="315" cy="168" rx="14" ry="9" fill="#e2574c" opacity="0.35" />

        {/* Muzzle */}
        <ellipse cx="260" cy="195" rx="36" ry="27" fill="#f3e3cb" />

        {/* Eyes */}
        <ellipse cx="230" cy="140" rx="8" ry="10" fill="#3d2b1f" />
        <ellipse cx="290" cy="140" rx="8" ry="10" fill="#3d2b1f" />
        <circle cx="233" cy="136" r="2.5" fill="#fff" />
        <circle cx="293" cy="136" r="2.5" fill="#fff" />

        {/* Nose */}
        <circle cx="260" cy="190" r="11" fill="#e2574c" />
        <circle cx="256" cy="186" r="3" fill="#f39187" />
      </g>

      {/* Letter blocks — drawn last, always on top and fully readable */}
      {letters.map((l, i) => {
        const rotation = [-4, 3, -2, 4, -3][i];
        return (
          <g key={l.char} transform={`rotate(${rotation} ${l.x} ${blockY})`}>
            <rect
              x={l.x - 28}
              y={blockY - 28}
              width="56"
              height="56"
              rx="10"
              fill="url(#wri-block)"
              stroke="#b99457"
              strokeWidth="2"
            />
            <text
              x={l.x}
              y={blockY}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-heading"
              fontWeight="700"
              fontSize="30"
              fill={l.color}
            >
              {l.char}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
