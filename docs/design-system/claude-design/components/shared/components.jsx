// components.jsx — Shared UI primitives for the Re:store redesign.
// All consume CSS vars from tokens.css. Mobile-first; React Native–portable
// patterns (flexbox, no float / no grid-template-areas).

// ── Status bar context (small text-only iOS-style status bar inside frames) ──
// Already provided by ios-frame.jsx via <IOSStatusBar/>; we reuse there.

// ─────────────────────────────────────────────────────────────────────
// ScreenHeader  — back button + title + optional trailing actions
// Variants: 'plain' | 'large' | 'transparent'
// ─────────────────────────────────────────────────────────────────────
function ScreenHeader({ title, back = true, onBack, right, subtitle, variant = 'plain' }) {
  const trans = variant === 'transparent';
  return (
    <header style={{
      display: 'flex', alignItems: 'center',
      padding: '8px var(--screen-h)',
      height: 52, gap: 8, flex: '0 0 auto',
      background: trans ? 'transparent' : 'var(--surface)',
      borderBottom: trans ? 'none' : '1px solid var(--line)',
    }}>
      {back && (
        <button onClick={onBack} aria-label="Back" style={iconBtnStyle(trans)}>
          {Icon.Back({ size: 22 })}
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{
          margin: 0, fontSize: 'var(--text-md)', fontWeight: 600,
          letterSpacing: 'var(--tracking-tight)',
          color: 'var(--ink-1)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textAlign: back ? 'left' : 'left',
        }}>{title}</h1>
        {subtitle && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-3)', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {right && <div style={{ display: 'flex', gap: 4 }}>{right}</div>}
    </header>
  );
}

function iconBtnStyle(transparent = false) {
  return {
    width: 36, height: 36, borderRadius: 'var(--radius-pill)',
    border: 'none', cursor: 'pointer', padding: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: transparent ? 'rgba(255,255,255,0.92)' : 'transparent',
    color: 'var(--ink-1)',
    boxShadow: transparent ? 'var(--shadow-sm)' : 'none',
  };
}

// ─────────────────────────────────────────────────────────────────────
// BottomNavBar — single canonical implementation
// items: [{key, label, icon, fillIcon?}]
// ─────────────────────────────────────────────────────────────────────
function BottomNavBar({ active = 'home', onChange, items, badges = {} }) {
  const defs = items || [
    { key: 'home',     label: 'Home',     Icon: Icon.Home,  FillIcon: Icon.HomeFill },
    { key: 'shop',     label: 'Shop',     Icon: Icon.Menu },
    { key: 'orders',   label: 'Orders',   Icon: Icon.Box  },
    { key: 'cart',     label: 'Cart',     Icon: Icon.Cart },
    { key: 'profile',  label: 'You',      Icon: Icon.User },
  ];
  return (
    <nav style={{
      flex: '0 0 auto',
      display: 'flex',
      borderTop: '1px solid var(--line)',
      background: 'var(--surface)',
      paddingBottom: 18, // home indicator space
    }}>
      {defs.map(item => {
        const on = item.key === active;
        const IC = on && item.FillIcon ? item.FillIcon : item.Icon;
        return (
          <button key={item.key} onClick={() => onChange?.(item.key)} style={{
            flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
            padding: '10px 0 6px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: on ? 'var(--accent)' : 'var(--ink-3)',
            position: 'relative',
          }}>
            <span style={{ position: 'relative' }}>
              <IC size={22} sw={on ? 2 : 1.6} />
              {badges[item.key] ? (
                <span style={{
                  position: 'absolute', top: -2, right: -8,
                  minWidth: 16, height: 16, padding: '0 4px',
                  borderRadius: 999, background: 'var(--danger)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{badges[item.key]}</span>
              ) : null}
            </span>
            <span style={{ fontSize: 11, fontWeight: on ? 600 : 500, letterSpacing: '-0.005em' }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Buttons — Primary, Secondary, Ghost, Destructive
// Sizes: sm | md | lg | block
// ─────────────────────────────────────────────────────────────────────
function Button({
  variant = 'primary', size = 'md', children, onClick,
  full = false, disabled = false, leading, trailing, style = {},
}) {
  const padY = { sm: 8, md: 12, lg: 16 }[size];
  const padX = { sm: 14, md: 18, lg: 22 }[size];
  const fs   = { sm: 13, md: 15, lg: 16 }[size];

  const visual = {
    primary:     { bg: 'var(--accent)',       fg: 'var(--accent-ink)',     bd: 'transparent' },
    secondary:   { bg: 'var(--surface)',      fg: 'var(--ink-1)',          bd: 'var(--line-strong)' },
    ghost:       { bg: 'transparent',         fg: 'var(--ink-1)',          bd: 'transparent' },
    destructive: { bg: 'var(--danger)',       fg: '#fff',                  bd: 'transparent' },
    inverse:     { bg: 'var(--surface)',      fg: 'var(--accent)',         bd: 'transparent' },
  }[variant];

  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: `${padY}px ${padX}px`,
      width: full ? '100%' : 'auto',
      border: `1px solid ${visual.bd}`, borderRadius: 'var(--radius-md)',
      background: visual.bg, color: visual.fg,
      fontSize: fs, fontWeight: 600, letterSpacing: '-0.01em',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1, fontFamily: 'inherit',
      ...style,
    }}>
      {leading}{children}{trailing}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Quantity stepper
// ─────────────────────────────────────────────────────────────────────
function QuantityStepper({ value = 1, onChange, min = 1, max = 99, size = 'md' }) {
  const h = size === 'sm' ? 28 : 36;
  const w = size === 'sm' ? 28 : 36;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-pill)',
      background: 'var(--surface)', height: h,
    }}>
      <button onClick={() => onChange?.(Math.max(min, value - 1))}
        disabled={value <= min}
        style={stepBtn(w, h, value <= min)}>
        {Icon.Minus({ size: 14 })}
      </button>
      <div className="tnum" style={{
        minWidth: 28, textAlign: 'center', fontSize: 14,
        fontWeight: 600, color: 'var(--ink-1)',
      }}>{value}</div>
      <button onClick={() => onChange?.(Math.min(max, value + 1))}
        disabled={value >= max}
        style={stepBtn(w, h, value >= max)}>
        {Icon.Plus({ size: 14 })}
      </button>
    </div>
  );
}
function stepBtn(w, h, disabled) {
  return {
    width: w, height: h, border: 'none', background: 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? 'var(--ink-5)' : 'var(--ink-1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}

// ─────────────────────────────────────────────────────────────────────
// Status badge — order states; tonal pill
// ─────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    'Confirmed': { fg: 'var(--warning)', bg: 'var(--warning-tint)' },
    'Shipped':   { fg: 'var(--info)',    bg: 'var(--info-tint)' },
    'Delivered': { fg: 'var(--success)', bg: 'var(--success-tint)' },
    'Cancelled': { fg: 'var(--danger)',  bg: 'var(--danger-tint)' },
    'In transit':{ fg: 'var(--info)',    bg: 'var(--info-tint)' },
  };
  const c = map[status] || map['Confirmed'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 'var(--radius-pill)',
      background: c.bg, color: c.fg,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.01em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c.fg }}/>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Product glyph placeholder tile — colored card with abstract silhouette.
// Used everywhere a product image would go (no real photos in mock).
// ─────────────────────────────────────────────────────────────────────
const TONE = {
  cream:  { bg: '#F1ECE2', fg: '#3B2F1E' },
  steel:  { bg: '#E4E7EB', fg: '#1E2530' },
  navy:   { bg: '#D9DFEA', fg: '#1A2238' },
  sand:   { bg: '#EFE6D6', fg: '#3A2E18' },
  olive:  { bg: '#E5E8DA', fg: '#2C3318' },
  tan:    { bg: '#ECDFCB', fg: '#3B2A14' },
  lemon:  { bg: '#F1ECC6', fg: '#3D360D' },
  paper:  { bg: '#EFEAE0', fg: '#36302A' },
  indigo: { bg: '#D9DDEC', fg: '#212A4A' },
  bone:   { bg: '#ECE7DE', fg: '#3A2E20' },
  ice:    { bg: '#E2E8EE', fg: '#1F2A34' },
  khaki:  { bg: '#E2DFCE', fg: '#2D2A18' },
};
function ProductTile({ tone = 'cream', glyph = 'shoe', size = 120, radius, children, style = {} }) {
  const c = TONE[tone] || TONE.cream;
  return (
    <div style={{
      width: size === '100%' ? '100%' : size, aspectRatio: '1 / 1',
      borderRadius: radius || 'var(--radius-md)',
      background: c.bg, color: c.fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative',
      ...style,
    }}>
      <div style={{ width: '54%', height: '54%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {Glyph[glyph]}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Price — tabular, with optional strike + discount chip
// ─────────────────────────────────────────────────────────────────────
function Price({ value, was, size = 'base', currency = '\u20B9' }) {
  const fs = { sm: 14, base: 16, lg: 20, xl: 26 }[size];
  const discount = was ? Math.round((1 - value / was) * 100) : 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
      <span className="tnum" style={{
        fontSize: fs, fontWeight: 700, color: 'var(--ink-1)',
        letterSpacing: '-0.02em',
      }}>{currency}{value.toLocaleString('en-IN')}</span>
      {was && (
        <span className="tnum" style={{
          fontSize: Math.max(11, fs - 4), color: 'var(--ink-4)', textDecoration: 'line-through',
        }}>{currency}{was.toLocaleString('en-IN')}</span>
      )}
      {discount > 0 && (
        <span className="tnum" style={{
          fontSize: 11, fontWeight: 700, color: 'var(--success)',
          letterSpacing: '0.01em',
        }}>{discount}% off</span>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Star rating
// ─────────────────────────────────────────────────────────────────────
function Rating({ value = 4.5, count, size = 12, compact = false }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-3)' }}>
      <Icon.Star size={size} style={{ color: '#F5A623' }} />
      <span className="tnum" style={{ color: 'var(--ink-1)', fontWeight: 600 }}>{value.toFixed(1)}</span>
      {count != null && !compact && <span className="tnum">({count.toLocaleString('en-IN')})</span>}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Product card — vertical, two variants
// variant: 'grid' (square tile + meta below) | 'shelf' (horizontal carousel)
// ─────────────────────────────────────────────────────────────────────
function ProductCard({ product, variant = 'grid', width, onLike, liked = false }) {
  const w = width || (variant === 'shelf' ? 144 : '100%');
  return (
    <article style={{
      width: w, display: 'flex', flexDirection: 'column', gap: 8,
      flex: '0 0 auto',
    }}>
      <div style={{ position: 'relative' }}>
        <ProductTile tone={product.tone} glyph={product.glyph} size="100%" />
        <button onClick={onLike} aria-label="Save" style={{
          position: 'absolute', top: 8, right: 8,
          width: 30, height: 30, borderRadius: 999,
          background: 'rgba(255,255,255,0.92)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: liked ? 'var(--danger)' : 'var(--ink-2)',
          cursor: 'pointer',
        }}>
          {liked ? Icon.HeartFill({ size: 15 }) : Icon.Heart({ size: 15 })}
        </button>
        {product.was && (
          <span style={{
            position: 'absolute', left: 8, top: 8,
            fontSize: 10, fontWeight: 700, padding: '3px 7px',
            background: 'var(--ink-1)', color: '#fff',
            borderRadius: 999, letterSpacing: '0.02em',
          }}>{Math.round((1 - product.price / product.was) * 100)}% off</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{product.brand}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</div>
        <Price value={product.price} was={product.was} size="sm" />
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Cart line item
// ─────────────────────────────────────────────────────────────────────
function CartLine({ product, qty, variant, onQty, onRemove }) {
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '14px 0',
      borderBottom: '1px solid var(--line)',
    }}>
      <ProductTile tone={product.tone} glyph={product.glyph} size={76} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{product.brand}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{variant}</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <QuantityStepper value={qty} onChange={onQty} size="sm" />
          <span className="tnum" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-1)' }}>
            \u20B9{(product.price * qty).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────
function EmptyState({ icon, title, body, action }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: 'var(--space-8) var(--space-6)', gap: 12,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 999,
        background: 'var(--surface-alt)', color: 'var(--ink-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', maxWidth: 280, lineHeight: 1.4 }}>{body}</p>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Skeleton primitives — for loading shimmer.
// Inject keyframes once.
// ─────────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('rs-skel-style')) {
  const s = document.createElement('style');
  s.id = 'rs-skel-style';
  s.textContent = `
    @keyframes rs-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    .rs-skel { background: linear-gradient(90deg, var(--surface-alt) 0%, #EFEEEA 50%, var(--surface-alt) 100%);
      background-size: 200% 100%; animation: rs-shimmer 1.4s linear infinite; border-radius: 6px; }
    .rs-pill { border-radius: var(--radius-pill); }
  `;
  document.head.appendChild(s);
}
function Skel({ w = '100%', h = 12, r, style = {} }) {
  return <div className="rs-skel" style={{ width: w, height: h, borderRadius: r || 6, ...style }} />;
}

// ─────────────────────────────────────────────────────────────────────
// Inline error banner (for the audit's "errors silently swallow" gap)
// ─────────────────────────────────────────────────────────────────────
function ErrorBanner({ title = "Couldn\u2019t load", body, onRetry }) {
  return (
    <div style={{
      margin: 'var(--screen-h)', padding: 14,
      borderRadius: 'var(--radius-md)',
      background: 'var(--danger-tint)',
      border: '1px solid #F4C5CC',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <span style={{ color: 'var(--danger)', flex: '0 0 auto', paddingTop: 2 }}>
        {Icon.AlertC({ size: 20 })}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-1)' }}>{title}</div>
        {body && <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>{body}</div>}
      </div>
      {onRetry && (
        <button onClick={onRetry} style={{
          border: '1px solid var(--ink-1)', background: 'transparent',
          padding: '6px 12px', borderRadius: 'var(--radius-pill)',
          fontSize: 12, fontWeight: 600, color: 'var(--ink-1)', cursor: 'pointer',
          fontFamily: 'inherit',
        }}>Retry</button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Section label
// ─────────────────────────────────────────────────────────────────────
function SectionLabel({ children, action, kicker }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      padding: '0 var(--screen-h)', marginBottom: 12,
    }}>
      <div>
        {kicker && <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{kicker}</div>}
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink-1)' }}>{children}</h2>
      </div>
      {action && (
        <button onClick={action.onClick} style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          fontSize: 13, fontWeight: 500, color: 'var(--accent)',
          display: 'inline-flex', alignItems: 'center', gap: 2,
          fontFamily: 'inherit',
        }}>{action.label}{Icon.ChevR({ size: 16 })}</button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Search bar
// ─────────────────────────────────────────────────────────────────────
function SearchBar({ placeholder = 'Search', value, onChange, trailing }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'var(--surface-alt)', borderRadius: 'var(--radius-pill)',
      padding: '10px 14px', color: 'var(--ink-3)',
      fontSize: 14,
    }}>
      <Icon.Search size={18} />
      <input value={value || ''} onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder} style={{
          flex: 1, border: 'none', background: 'transparent', outline: 'none',
          fontSize: 14, fontFamily: 'inherit', color: 'var(--ink-1)',
        }} />
      {trailing}
    </div>
  );
}

// Export to globals (each Babel script has its own scope — see CLAUDE.md note)
Object.assign(window, {
  ScreenHeader, BottomNavBar, Button, QuantityStepper, StatusBadge,
  ProductTile, ProductCard, CartLine, EmptyState, Skel, ErrorBanner,
  SectionLabel, SearchBar, Price, Rating, iconBtnStyle, TONE,
});
