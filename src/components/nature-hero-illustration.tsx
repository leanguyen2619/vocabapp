/** A calm, hand-drawn-style landscape (sky, mountains, lake, foliage) used as the dashboard hero
 * background — purely decorative (aria-hidden). The viewBox is deliberately wide/short (matching
 * the banner shape it's actually rendered at) so `preserveAspectRatio="...slice"` crops the sides
 * on very wide screens rather than the sun/foliage sliding out the top, which is what happened
 * with an earlier, more square-shaped viewBox. Colors are muted enough to still read reasonably
 * in dark mode without a fully separate dark palette; the small brightness/opacity dip applied by
 * the caller (see DashboardOverviewCard) handles the rest. */
export function NatureHeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 170"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="nhi-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cdeee0" />
          <stop offset="55%" stopColor="#e7f3d8" />
          <stop offset="100%" stopColor="#fbeecb" />
        </linearGradient>
        <radialGradient id="nhi-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8e1" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#ffe9a8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffe9a8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nhi-mtn-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9fc2c4" />
          <stop offset="100%" stopColor="#89b3ae" />
        </linearGradient>
        <linearGradient id="nhi-mtn-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5c8f6e" />
          <stop offset="100%" stopColor="#436b52" />
        </linearGradient>
        <linearGradient id="nhi-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfe0d9" />
          <stop offset="100%" stopColor="#a3cfd0" />
        </linearGradient>
        <linearGradient id="nhi-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3f6b46" />
          <stop offset="100%" stopColor="#2c4f34" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="480" height="170" fill="url(#nhi-sky)" />
      <circle cx="380" cy="34" r="46" fill="url(#nhi-sun)" />
      <circle cx="380" cy="34" r="14" fill="#fffbe9" opacity="0.9" />

      {/* far mountain range */}
      <path
        d="M0,95 L60,60 L120,90 L180,52 L240,92 L300,64 L360,95 L420,70 L480,95 L480,170 L0,170 Z"
        fill="url(#nhi-mtn-far)"
        opacity="0.75"
      />

      {/* near hill range */}
      <path
        d="M0,120 L70,88 L140,118 L210,80 L280,120 L350,96 L420,122 L480,105 L480,170 L0,170 Z"
        fill="url(#nhi-mtn-near)"
      />

      {/* lake */}
      <rect x="0" y="132" width="480" height="38" fill="url(#nhi-lake)" />
      <path d="M40,142 Q140,138 240,142 T440,142" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" fill="none" />
      <path d="M20,154 Q140,150 260,154 T460,154" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" fill="none" />

      {/* overhanging foliage, top-left corner — fully inside the frame so it doesn't get an odd
       * clipped edge when the SVG is scaled/cropped to cover a wider container. */
      }
      <g>
        <path d="M0,4 C22,10 34,22 38,42" stroke="#2c4f34" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="10" cy="8" rx="16" ry="10" fill="url(#nhi-leaf)" transform="rotate(-20 10 8)" />
        <ellipse cx="26" cy="18" rx="17" ry="10" fill="url(#nhi-leaf)" transform="rotate(-5 26 18)" />
        <ellipse cx="35" cy="34" rx="14" ry="8" fill="url(#nhi-leaf)" transform="rotate(20 35 34)" />
        <ellipse cx="6" cy="26" rx="12" ry="7" fill="url(#nhi-leaf)" transform="rotate(-40 6 26)" />
      </g>
    </svg>
  );
}
