// loading-patterns.jsx — Loading-state vocabulary for the redesign.
// Built from the three reference images (anti-patterns) → production-grade
// skeleton patterns that preserve layout, animate subtly, and reveal content
// progressively.

const { useState: useStateLP, useEffect: useEffectLP } = React;

// ── Building blocks ─────────────────────────────────────────
// Block — shape-of-content rectangle, no shimmer (used for grouping)
function Block({ w = '100%', h = 12, r = 6, style = {} }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'var(--surface-alt)', ...style }} />;
}

// Shimmer — content-shaped placeholder w/ subtle shimmer
// (uses the rs-skel class already injected by components.jsx)
function Shimmer({ w = '100%', h = 12, r = 6, style = {} }) {
  return <div className="rs-skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

// ImagePlaceholder — preserves aspect ratio of final image
function ImagePlaceholder({ ratio = 1, r = 12, style = {} }) {
  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: `${100/ratio}%`, ...style }}>
      <div className="rs-skel" style={{ position: 'absolute', inset: 0, borderRadius: r }}/>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink-5)',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="16" rx="2"/>
          <circle cx="9" cy="10" r="2"/>
          <path d="M3 17l4-4 5 5 3-3 6 6"/>
        </svg>
      </div>
    </div>
  );
}

// ── Connection banner (inline, not full-screen) ─────────────
function ConnectionBanner({ tone = 'danger', children }) {
  const palette = tone === 'danger'
    ? { bg: 'var(--ink-1)', fg: '#fff', dot: '#FF6B6B' }
    : { bg: 'var(--surface-alt)', fg: 'var(--ink-1)', dot: 'var(--warning)' };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', background: palette.bg, color: palette.fg,
      fontSize: 13, fontWeight: 500,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: palette.dot, flex: '0 0 auto', boxShadow: `0 0 0 4px ${palette.dot}40` }}/>
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}

// ── Button loading states ───────────────────────────────────
function LoadingButton({ label = 'Place order', variant = 'primary', stage = 'idle' }) {
  // stage: idle | loading | success
  const isLoading = stage === 'loading';
  const isSuccess = stage === 'success';
  const styleByVariant = {
    primary: { bg: 'var(--accent)', fg: 'var(--accent-ink)' },
    secondary: { bg: 'var(--surface)', fg: 'var(--ink-1)', border: '1px solid var(--line-strong)' },
  };
  const s = styleByVariant[variant] || styleByVariant.primary;
  return (
    <div style={{
      height: 52, borderRadius: 'var(--radius-md)', background: s.bg, color: s.fg,
      border: s.border || 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      fontWeight: 600, fontSize: 15, position: 'relative', overflow: 'hidden',
    }}>
      {isLoading && (
        <span style={{
          width: 16, height: 16, borderRadius: 999,
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: s.fg,
          animation: 'lp-spin 0.8s linear infinite',
        }}/>
      )}
      {isSuccess && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
      <span>{isLoading ? 'Placing order…' : isSuccess ? 'Order placed' : label}</span>
      {/* progress bar */}
      {isLoading && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: 'rgba(255,255,255,0.2)' }}>
          <div style={{
            width: '40%', height: '100%', background: 'rgba(255,255,255,0.7)',
            animation: 'lp-prog 1.4s ease-in-out infinite',
          }}/>
        </div>
      )}
    </div>
  );
}

// Add keyframes once
if (typeof document !== 'undefined' && !document.getElementById('lp-keyframes')) {
  const s = document.createElement('style');
  s.id = 'lp-keyframes';
  s.textContent = `
    @keyframes lp-spin { to { transform: rotate(360deg); } }
    @keyframes lp-prog { 0%{transform:translateX(-100%)} 100%{transform:translateX(250%)} }
    @keyframes lp-fade-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
    .lp-reveal > * { animation: lp-fade-in 0.5s both; }
    .lp-reveal > *:nth-child(1){animation-delay:0s}
    .lp-reveal > *:nth-child(2){animation-delay:0.08s}
    .lp-reveal > *:nth-child(3){animation-delay:0.16s}
    .lp-reveal > *:nth-child(4){animation-delay:0.24s}
    .lp-reveal > *:nth-child(5){animation-delay:0.32s}
    .lp-reveal > *:nth-child(6){animation-delay:0.40s}
  `;
  document.head.appendChild(s);
}

// ─── 1. Anti-patterns gallery (from the three references) ───
function AntiPatterns() {
  return (
    <div style={{ padding: 24, background: '#fff', height: '100%', fontFamily: 'var(--font-sans)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        Anti-patterns to avoid
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 18, lineHeight: 1.45 }}>
        Three loading states pulled from production apps. Each one breaks layout, hides chrome, or replaces real content with a mascot. None of them survive past the first ~200ms before feeling broken.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { title: 'Mascot splash', body: 'Full-screen branding hides app chrome and tells the user nothing about what is coming. The error banner at the bottom is the only useful signal.' },
          { title: 'Colored block', body: 'Chrome is preserved but the hero is a solid pink slab — no shape-of-content, no shimmer, no useful preview. Feels like a broken image.' },
          { title: 'Empty + doodle', body: 'A whitespace canvas with a floating mascot. The user cannot tell whether content is loading, failed, or simply empty.' },
        ].map((p, i) => (
          <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 700, marginBottom: 6 }}>× Avoid</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{p.title}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>{p.body}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, padding: 14, background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', marginBottom: 6 }}>✓ Our rules</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.7 }}>
          <li>Chrome (header + nav) renders instantly — never replaced by a splash.</li>
          <li>Every skeleton matches the shape and rhythm of the real content.</li>
          <li>Shimmer is one direction, 1.4s, never on more than ~6 elements at once.</li>
          <li>Content reveals top-to-bottom with a 60–80ms stagger, not all at once.</li>
          <li>Connection issues are inline banners, never full-page replacements.</li>
        </ul>
      </div>
    </div>
  );
}

// ─── 2. Layout-preserving skeleton (Home) ───
function LoadingHomePerfect() {
  return (
    <div className="rs-app">
      {/* chrome renders immediately */}
      <div style={{ padding: '8px var(--screen-h) 12px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <Shimmer h={10} w="35%" style={{ marginBottom: 8 }}/>
          <Shimmer h={16} w="65%"/>
        </div>
        <Shimmer w={36} h={36} r={999}/>
        <Shimmer w={36} h={36} r={999}/>
      </div>
      <div style={{ padding: '0 var(--screen-h) 14px' }}>
        <Shimmer h={44} r={999}/>
      </div>
      <div className="rs-scroll" style={{ padding: '0 var(--screen-h)' }}>
        <ImagePlaceholder ratio={1.85} r={18} style={{ marginBottom: 24 }}/>
        <Shimmer h={16} w="42%" style={{ marginBottom: 14 }}/>
        <div style={{ display: 'flex', gap: 14, marginBottom: 26 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Shimmer w={56} h={56} r={999}/>
              <Shimmer h={9} w="70%"/>
            </div>
          ))}
        </div>
        <Shimmer h={16} w="55%" style={{ marginBottom: 12 }}/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[1,2,3,4].map(i => (
            <div key={i}>
              <ImagePlaceholder ratio={0.92} r={12} style={{ marginBottom: 10 }}/>
              <Shimmer h={9} w="40%" style={{ marginBottom: 6 }}/>
              <Shimmer h={11} w="85%" style={{ marginBottom: 8 }}/>
              <Shimmer h={13} w="50%"/>
            </div>
          ))}
        </div>
        <div style={{ height: 24 }}/>
      </div>
      <BottomNavBar active="home"/>
    </div>
  );
}

// ─── 3. Progressive reveal (chrome → text → images → cards) ───
function ProgressiveReveal() {
  const [stage, setStage] = useStateLP(0);
  // 0: chrome only, 1: + text, 2: + images, 3: full
  useEffectLP(() => {
    const t = [setTimeout(() => setStage(1), 600), setTimeout(() => setStage(2), 1300), setTimeout(() => setStage(3), 2100)];
    const loop = setInterval(() => setStage(s => (s + 1) % 4), 4200);
    return () => { t.forEach(clearTimeout); clearInterval(loop); };
  }, []);
  return (
    <div className="rs-app">
      <div style={{ padding: '8px var(--screen-h) 12px' }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>Deliver to</div>
        {stage >= 1 ? <div className="lp-reveal" style={{ fontSize: 16, fontWeight: 600 }}>Hitech City, Hyderabad</div>
          : <Shimmer h={16} w="65%" style={{ marginTop: 4 }}/>}
      </div>
      <div style={{ padding: '0 var(--screen-h) 14px' }}>
        <SearchBar placeholder="Search Re:store"/>
      </div>
      <div className="rs-scroll" style={{ padding: '0 var(--screen-h)' }}>
        {/* hero */}
        {stage >= 2 ? (
          <div className="lp-reveal" style={{ marginBottom: 24 }}>
            <div style={{
              height: 170, borderRadius: 18, background: 'linear-gradient(135deg, var(--ink-1) 0%, #2E2E2E 100%)',
              color: '#fff', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', opacity: 0.8 }}>NEW SEASON</div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15 }}>Quiet luxury for everyday wear</div>
            </div>
          </div>
        ) : <ImagePlaceholder ratio={2.05} r={18} style={{ marginBottom: 24 }}/>}

        {/* section title */}
        {stage >= 1 ? <div className="lp-reveal" style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Shop by category</div>
          : <Shimmer h={16} w="50%" style={{ marginBottom: 14 }}/>}

        <div style={{ display: 'flex', gap: 14, marginBottom: 26 }}>
          {['Audio','Apparel','Home','Beauty'].map((n, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {stage >= 2 ? (
                <div className="lp-reveal" style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-2)' }}>{n.slice(0,2).toUpperCase()}</span>
                </div>
              ) : <Shimmer w={56} h={56} r={999}/>}
              {stage >= 1 ? <span style={{ fontSize: 11, fontWeight: 500 }}>{n}</span> : <Shimmer h={9} w="70%"/>}
            </div>
          ))}
        </div>

        {stage >= 1 ? <div className="lp-reveal" style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Top of the week</div>
          : <Shimmer h={16} w="55%" style={{ marginBottom: 12 }}/>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[0,1,2,3].map(i => (
            <div key={i}>
              {stage >= 3 ? (
                <div className="lp-reveal">
                  <div style={{ paddingTop: '108%', position: 'relative', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', marginBottom: 10 }}/>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Studio Re</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Linen overshirt</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>₹4,200</div>
                </div>
              ) : (
                <>
                  <ImagePlaceholder ratio={0.92} r={12} style={{ marginBottom: 10 }}/>
                  <Shimmer h={9} w="40%" style={{ marginBottom: 6 }}/>
                  <Shimmer h={11} w="85%" style={{ marginBottom: 8 }}/>
                  <Shimmer h={13} w="50%"/>
                </>
              )}
            </div>
          ))}
        </div>
        <div style={{ height: 24 }}/>
      </div>
      <BottomNavBar active="home"/>
      <div style={{ position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'var(--ink-4)', background: 'var(--surface-alt)', padding: '3px 8px', borderRadius: 999, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
        Stage {stage + 1} / 4 · auto
      </div>
    </div>
  );
}

// ─── 4. Search results — list skeleton matches final density ───
function LoadingResults() {
  return (
    <div className="rs-app">
      <ScreenHeader title="Headphones"/>
      <div style={{ padding: '8px var(--screen-h)', display: 'flex', gap: 8, overflow: 'hidden' }}>
        {[60, 90, 70, 80].map((w, i) => <Shimmer key={i} h={32} w={w} r={999}/>)}
      </div>
      <div className="rs-scroll" style={{ padding: '0 var(--screen-h)' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
            <Shimmer w={84} h={84} r={'var(--radius-md)'}/>
            <div style={{ flex: 1 }}>
              <Shimmer h={9} w="30%" style={{ marginBottom: 8 }}/>
              <Shimmer h={13} w="85%" style={{ marginBottom: 6 }}/>
              <Shimmer h={13} w="60%" style={{ marginBottom: 12 }}/>
              <Shimmer h={14} w="40%"/>
            </div>
          </div>
        ))}
      </div>
      <BottomNavBar active="search"/>
    </div>
  );
}

// ─── 5. Product detail — sticky chrome + content shimmer ───
function LoadingProductPerfect() {
  return (
    <div className="rs-app">
      <div style={{ position: 'absolute', top: 60, left: 16, zIndex: 5, width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <Icon.ChevL size={18}/>
      </div>
      <div style={{ position: 'absolute', top: 60, right: 16, zIndex: 5, width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <Icon.Heart size={16}/>
      </div>
      <div className="rs-scroll">
        <ImagePlaceholder ratio={0.95} r={0}/>
        <div style={{ display: 'flex', gap: 8, padding: '14px var(--screen-h)', overflow: 'hidden' }}>
          {[1,2,3,4].map(i => <Shimmer key={i} w={56} h={56} r={'var(--radius-sm)'}/>)}
        </div>
        <div style={{ padding: '0 var(--screen-h) 20px' }}>
          <Shimmer h={10} w="25%" style={{ marginBottom: 10 }}/>
          <Shimmer h={20} w="80%" style={{ marginBottom: 8 }}/>
          <Shimmer h={20} w="50%" style={{ marginBottom: 18 }}/>
          <Shimmer h={11} w="40%" style={{ marginBottom: 22 }}/>
          <Shimmer h={24} w="40%" style={{ marginBottom: 22 }}/>
          <Shimmer h={11} w="20%" style={{ marginBottom: 10 }}/>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,2,3,4,5].map(i => <Shimmer key={i} w={46} h={42} r={'var(--radius-sm)'}/>)}
          </div>
        </div>
      </div>
      <div style={{ padding: '12px var(--screen-h) 20px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
        <LoadingButton label="Add to bag" stage="idle"/>
      </div>
    </div>
  );
}

// ─── 6. Button loading states gallery ───
function ButtonLoadingStates() {
  return (
    <div className="rs-app" style={{ padding: '20px var(--screen-h)' }}>
      <ScreenHeader title="Button states" subtitle="Idle → Loading → Success"/>
      <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Primary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <LoadingButton stage="idle"/>
            <LoadingButton stage="loading"/>
            <LoadingButton stage="success"/>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Secondary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <LoadingButton variant="secondary" label="Continue" stage="idle"/>
            <LoadingButton variant="secondary" label="Continue" stage="loading"/>
          </div>
        </div>
        <div style={{ padding: 14, background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
          <b style={{ fontWeight: 600 }}>Rules.</b> The button never disappears or resizes during loading — only the inner label + spinner swaps. After ~6s a "Taking longer than usual" hint appears below; after ~12s the action falls back to an error state with retry.
        </div>
      </div>
    </div>
  );
}

// ─── 7. Connection banner patterns ───
function ConnectionBanners() {
  return (
    <div className="rs-app">
      <ConnectionBanner tone="danger">You&rsquo;re offline. Some items may not be up to date.</ConnectionBanner>
      <ScreenHeader title="Bag"/>
      <div className="rs-scroll" style={{ padding: '12px var(--screen-h) 0' }}>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 14 }}>3 items · cached 4 minutes ago</div>
        {[0, 1].map(i => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
            <div style={{ width: 80, height: 80, background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)' }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Studio Re</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>Linen overshirt</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>Stone · L</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 10 }}>₹4,200</div>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 22, padding: 14, background: 'var(--warning-tint)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 12 }}>
          <span style={{ color: 'var(--warning)', paddingTop: 1 }}><Icon.AlertC size={18}/></span>
          <div style={{ flex: 1, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            <b style={{ fontWeight: 600, color: 'var(--ink-1)' }}>Slow network.</b> Showing cached prices. Checkout will retry automatically when the connection returns.
          </div>
        </div>
      </div>
      <div style={{ padding: '12px var(--screen-h) 20px', borderTop: '1px solid var(--line)' }}>
        <LoadingButton label="Retry checkout" variant="secondary"/>
      </div>
    </div>
  );
}

// ─── 8. Hierarchy reference ───
function LoadingHierarchy() {
  const rows = [
    ['0–80ms',   'Chrome only',         'Header, tabs, bottom nav, search bar render from cached UI state. No skeleton yet — the eye is still parsing layout.'],
    ['80–300ms', 'Text skeleton',       'Headings and labels appear as shimmer bars. Image regions remain solid (no shimmer) — they\u2019re shape-of-content only.'],
    ['300–800ms','Image skeleton',      'Image cells start to shimmer once we know the network is still active. Cards lock to their final aspect ratio.'],
    ['800ms+',   'Progressive content', 'Real content swaps in top-to-bottom with a 60–80ms stagger. Cached/above-fold content first.'],
    ['Error',    'Inline banner',       'Connection issues surface as a 36px banner above the header — never a full-screen replacement.'],
  ];
  return (
    <div style={{ padding: 24, background: '#fff', height: '100%', fontFamily: 'var(--font-sans)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        Loading hierarchy
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 18, lineHeight: 1.45 }}>
        The same screen passes through these stages. The user should never see a moment where the app feels &ldquo;blank&rdquo; or &ldquo;broken.&rdquo;
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '110px 160px 1fr', rowGap: 14, columnGap: 18 }}>
        {rows.map((r, i) => (
          <React.Fragment key={i}>
            <div className="tnum" style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>{r[0]}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{r[1]}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>{r[2]}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  Block, Shimmer, ImagePlaceholder, ConnectionBanner, LoadingButton,
  AntiPatterns, LoadingHomePerfect, ProgressiveReveal, LoadingResults,
  LoadingProductPerfect, ButtonLoadingStates, ConnectionBanners, LoadingHierarchy,
});
