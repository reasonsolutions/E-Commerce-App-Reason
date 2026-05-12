// screens-a.jsx — Variation A: "Editorial Mono"
// Bold display type, monochrome, full-bleed hero, generous whitespace.
// Each screen exports a function that returns a phone-sized React node.
// They DO NOT include the iOS frame — the canvas wraps them.

const SCREEN_W = 374;   // matches iPhone 14 frame inner width
const SCREEN_H = 760;   // visible content height inside frame

// ─── Helpers ────────────────────────────────────────────────
const heroBgA = '#0E0E0E';

function CategoryChip({ name, glyph, tone }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 68, flex: '0 0 auto' }}>
      <ProductTile tone={tone} glyph={glyph} size={68} style={{ borderRadius: 999 }} />
      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-2)', letterSpacing: '-0.005em' }}>{name}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. HOME — Variation A
// ─────────────────────────────────────────────────────────────
function HomeScreenA() {
  return (
    <div className="rs-app">
      {/* Top app bar */}
      <div style={{ padding: '8px var(--screen-h) 12px', display: 'flex', alignItems: 'center', gap: 12, flex: '0 0 auto' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, marginBottom: 2 }}>Deliver to</div>
          <div style={{ fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Banjara Hills, 500034 <Icon.ChevD size={14} />
          </div>
        </div>
        <button style={{ ...iconBtnStyle(false), background: 'var(--surface-alt)' }} aria-label="Saved">
          <Icon.Heart size={20} />
        </button>
        <button style={{ ...iconBtnStyle(false), background: 'var(--surface-alt)' }} aria-label="Cart">
          <span style={{ position: 'relative' }}>
            <Icon.Cart size={20} />
            <span style={{ position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
          </span>
        </button>
      </div>
      <div style={{ padding: '0 var(--screen-h) 12px', flex: '0 0 auto' }}>
        <SearchBar placeholder="Search products, brands, more" trailing={<Icon.Camera size={18} />} />
      </div>

      <div className="rs-scroll">
        {/* Editorial hero */}
        <div style={{ padding: '4px var(--screen-h) 20px' }}>
          <div style={{
            background: heroBgA, color: '#fff',
            borderRadius: 'var(--radius-lg)',
            padding: 20, position: 'relative', overflow: 'hidden',
            minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7 }}>New season · 26</div>
              <h2 style={{ margin: '6px 0 0', fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, fontFamily: 'var(--font-display)' }}>
                Quiet luxury,<br/>everyday wear.
              </h2>
            </div>
            <button style={{
              alignSelf: 'flex-start', marginTop: 16, padding: '10px 18px',
              background: '#fff', color: '#0E0E0E', border: 'none',
              borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Shop the edit →</button>
            {/* abstract product object */}
            <div style={{ position: 'absolute', right: -20, bottom: -30, width: 180, height: 180, opacity: 0.95, color: '#3a3a3a' }}>
              {Glyph.bag}
            </div>
            {/* page dots */}
            <div style={{ position: 'absolute', bottom: 14, right: 16, display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ width: i === 0 ? 14 : 4, height: 4, borderRadius: 2, background: i === 0 ? '#fff' : 'rgba(255,255,255,0.4)' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Category rail */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel action={{ label: 'See all' }}>Shop by category</SectionLabel>
          <div style={{ display: 'flex', gap: 10, padding: '0 var(--screen-h)', overflow: 'hidden' }}>
            <CategoryChip name="Tech"     glyph="phone"  tone="ice" />
            <CategoryChip name="Audio"    glyph="phones" tone="steel" />
            <CategoryChip name="Apparel"  glyph="tee"    tone="olive" />
            <CategoryChip name="Footwear" glyph="shoe"   tone="cream" />
            <CategoryChip name="Watches"  glyph="watch"  tone="khaki" />
          </div>
        </div>

        {/* Trending shelf */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel kicker="Trending" action={{ label: 'See all' }}>Top of the week</SectionLabel>
          <div style={{ display: 'flex', gap: 12, padding: '0 var(--screen-h)', overflowX: 'auto' }}>
            {MOCK.products.slice(0, 4).map(p => (
              <ProductCard key={p.id} product={p} variant="shelf" width={150} />
            ))}
          </div>
        </div>

        {/* Editorial collection card */}
        <div style={{ padding: '0 var(--screen-h) 24px' }}>
          <div style={{
            background: 'var(--surface-alt)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            display: 'flex', alignItems: 'stretch', minHeight: 140,
          }}>
            <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>The Sound Edit</div>
                <h3 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Headphones that disappear.</h3>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-1)' }}>Explore →</div>
            </div>
            <div style={{ width: 140, color: 'var(--ink-2)', padding: 12, display: 'flex', alignItems: 'center' }}>
              {Glyph.phones}
            </div>
          </div>
        </div>

        {/* Grid of products */}
        <div style={{ paddingBottom: 24 }}>
          <SectionLabel>Just for you</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '0 var(--screen-h)' }}>
            {MOCK.products.slice(4, 8).map(p => (
              <ProductCard key={p.id} product={p} variant="grid" />
            ))}
          </div>
        </div>
      </div>

      <BottomNavBar active="home" badges={{ cart: 3 }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. SEARCH RESULTS — Variation A
// ─────────────────────────────────────────────────────────────
function ResultScreenA() {
  return (
    <div className="rs-app">
      <ScreenHeader title="Headphones" right={
        <button style={iconBtnStyle(false)} aria-label="Search"><Icon.Search size={20} /></button>
      } />

      {/* Filters bar */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px var(--screen-h)', overflowX: 'auto',
        borderBottom: '1px solid var(--line)', flex: '0 0 auto',
      }}>
        {[
          { l: 'Sort', i: <Icon.Sort size={14} /> },
          { l: 'Filter', i: <Icon.Filter size={14} /> },
          { l: 'Brand' }, { l: 'Price' }, { l: 'Rating 4+' },
        ].map((f, i) => (
          <button key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-pill)',
            padding: '6px 12px', fontSize: 12, fontWeight: 500,
            background: 'var(--surface)', color: 'var(--ink-1)',
            flex: '0 0 auto', fontFamily: 'inherit', cursor: 'pointer',
          }}>{f.i}{f.l}</button>
        ))}
      </div>

      <div className="rs-scroll" style={{ padding: '12px var(--screen-h) 24px' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>284 results · Showing best matches</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {MOCK.products.slice(0, 8).map(p => (
            <ProductCard key={p.id} product={p} variant="grid" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. PRODUCT DETAIL — Variation A
// ─────────────────────────────────────────────────────────────
function ProductScreenA() {
  const p = MOCK.products[10]; // Air Jordan 40 PF
  return (
    <div className="rs-app">
      <ScreenHeader title="" variant="transparent" right={
        <>
          <button style={iconBtnStyle(true)} aria-label="Share"><Icon.Heart size={18}/></button>
          <button style={iconBtnStyle(true)} aria-label="Cart"><Icon.Cart size={18}/></button>
        </>
      } />
      <div className="rs-scroll" style={{ marginTop: -52, paddingTop: 0 }}>
        {/* Image area */}
        <div style={{ position: 'relative', background: TONE[p.tone].bg, height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 240, height: 240, color: TONE[p.tone].fg }}>{Glyph[p.glyph]}</div>
          <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', gap: 4, justifyContent: 'center' }}>
            {[0,1,2,3].map(i => <span key={i} style={{ width: i===0?16:5, height: 5, borderRadius: 3, background: i===0?'var(--ink-1)':'rgba(0,0,0,0.2)' }}/>)}
          </div>
          {/* thumbnails rail */}
          <div style={{ position: 'absolute', left: 12, top: 70, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 42, height: 42, borderRadius: 8, border: i===0?'2px solid var(--ink-1)':'1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TONE[p.tone].fg }}>
                <div style={{ width: 32, height: 32 }}>{Glyph[p.glyph]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '20px var(--screen-h) 130px' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.brand}</div>
          <h1 style={{ margin: '6px 0 8px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{p.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Rating value={p.rating} count={p.reviews} />
            <span style={{ width: 1, height: 12, background: 'var(--line)' }}/>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>In stock</span>
          </div>
          <Price value={p.price} was={p.was} size="xl" />

          {/* Size selector */}
          <div style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Size · UK</span>
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>Size guide</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['6','7','8','9','10','11','12'].map((s, i) => (
                <button key={s} style={{
                  width: 46, height: 42, borderRadius: 'var(--radius-md)',
                  border: i===2 ? '2px solid var(--ink-1)' : '1px solid var(--line-strong)',
                  background: 'var(--surface)', color: i===5 ? 'var(--ink-5)' : 'var(--ink-1)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  textDecoration: i===5 ? 'line-through' : 'none',
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>About this product</h3>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)' }}>
              Lightweight performance build with refined heritage cues. Full-length Air Sole, lockdown midfoot strap, and a tonal upper.
            </p>
          </div>

          {/* Delivery card */}
          <div style={{
            marginTop: 20, padding: 14, borderRadius: 'var(--radius-md)',
            background: 'var(--surface-alt)',
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <Icon.Truck size={20} />
            <div style={{ flex: 1, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.4 }}>
              Free delivery by <b style={{ color: 'var(--ink-1)' }}>Wed, May 13</b> · Returns within 7 days
            </div>
          </div>
        </div>
      </div>

      {/* Sticky action bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '12px var(--screen-h) 20px', background: 'var(--surface)',
        borderTop: '1px solid var(--line)',
        display: 'flex', gap: 10,
      }}>
        <Button variant="secondary" size="lg" leading={<Icon.Bag size={18}/>}>Bag</Button>
        <Button variant="primary" size="lg" full style={{ flex: 1 }}>Buy now · \u20B95,000</Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. CART — Variation A
// ─────────────────────────────────────────────────────────────
function CartScreenA() {
  const total = MOCK.cart.reduce((s, l) => {
    const p = MOCK.products.find(x => x.id === l.id);
    return s + (p?.price || 0) * l.qty;
  }, 0);
  return (
    <div className="rs-app">
      <ScreenHeader title="Your bag" subtitle="4 items" />
      <div className="rs-scroll">
        <div style={{ padding: '4px var(--screen-h) 0' }}>
          {MOCK.cart.map(l => {
            const p = MOCK.products.find(x => x.id === l.id);
            return <CartLine key={l.id} product={p} qty={l.qty} variant={l.variant} />;
          })}
        </div>

        {/* Coupon */}
        <div style={{ padding: '14px var(--screen-h)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 12, border: '1px dashed var(--line-strong)',
            borderRadius: 'var(--radius-md)',
          }}>
            <Icon.Tag size={18} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>Apply coupon or gift card</span>
            <Icon.ChevR size={16} />
          </div>
        </div>

        {/* Summary */}
        <div style={{ padding: '4px var(--screen-h) 24px' }}>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Subtotal', total],
              ['Delivery', 0, 'Free'],
              ['Estimated tax', Math.round(total * 0.05)],
            ].map(([l, v, suffix]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ink-3)' }}>{l}</span>
                <span className="tnum" style={{ color: 'var(--ink-1)', fontWeight: 500 }}>
                  {suffix || `\u20B9${v.toLocaleString('en-IN')}`}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Total</span>
              <span className="tnum" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
                \u20B9{(total + Math.round(total*0.05)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px var(--screen-h) 20px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
        <Button variant="primary" size="lg" full trailing={<Icon.ChevR size={18}/>}>
          Checkout
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. ADDRESS / CHECKOUT — Variation A
// ─────────────────────────────────────────────────────────────
function AddressScreenA() {
  return (
    <div className="rs-app">
      <ScreenHeader title="Checkout" subtitle="Step 2 of 3" />
      <div className="rs-scroll" style={{ padding: '12px var(--screen-h) 24px' }}>
        {/* stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
          {['Bag', 'Address', 'Pay'].map((l, i) => (
            <React.Fragment key={l}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 999,
                  background: i <= 1 ? 'var(--accent)' : 'var(--surface-alt)',
                  color: i <= 1 ? 'var(--accent-ink)' : 'var(--ink-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                }}>{i < 1 ? <Icon.Check size={12} /> : i+1}</span>
                <span style={{ fontSize: 12, fontWeight: i===1?600:500, color: i<=1?'var(--ink-1)':'var(--ink-3)' }}>{l}</span>
              </div>
              {i < 2 && <span style={{ flex: 1, height: 1, background: i < 1 ? 'var(--ink-1)' : 'var(--line-strong)' }}/>}
            </React.Fragment>
          ))}
        </div>

        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>Choose delivery address</h3>

        {MOCK.addresses.map(a => (
          <label key={a.id} style={{
            display: 'flex', gap: 12, padding: 14, marginBottom: 10,
            border: a.selected ? '2px solid var(--ink-1)' : '1px solid var(--line)',
            borderRadius: 'var(--radius-md)', background: 'var(--surface)',
            cursor: 'pointer',
          }}>
            <span style={{
              flex: '0 0 auto', width: 18, height: 18, borderRadius: 999,
              border: '1.5px solid var(--ink-3)', marginTop: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: a.selected ? 'var(--ink-1)' : 'transparent',
              borderColor: a.selected ? 'var(--ink-1)' : 'var(--ink-3)',
            }}>
              {a.selected && <span style={{ width: 7, height: 7, borderRadius: 999, background: '#fff' }}/>}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px',
                  background: 'var(--surface-alt)', color: 'var(--ink-2)',
                  borderRadius: 999, letterSpacing: '0.03em', textTransform: 'uppercase',
                }}>{a.label}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4 }}>{a.line1}<br/>{a.line2}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{a.phone}</div>
            </div>
          </label>
        ))}

        <button style={{
          width: '100%', padding: 14, marginTop: 4,
          background: 'transparent', border: '1px dashed var(--line-strong)',
          borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500,
          color: 'var(--ink-1)', cursor: 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}><Icon.Plus size={16}/> Add new address</button>
      </div>

      <div style={{ padding: '12px var(--screen-h) 20px', borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>To pay</span>
          <span className="tnum" style={{ fontSize: 18, fontWeight: 700 }}>\u20B97,802</span>
        </div>
        <Button variant="primary" size="lg" full>Continue to payment</Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. ORDER SUCCESS — Variation A
// ─────────────────────────────────────────────────────────────
function OrderSuccessA() {
  return (
    <div className="rs-app" style={{ background: 'var(--surface)' }}>
      <div style={{ padding: '8px var(--screen-h)', display: 'flex', justifyContent: 'flex-end' }}>
        <button style={iconBtnStyle(false)}><Icon.Close size={20}/></button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px var(--screen-h)' }}>
        <div style={{
          width: 88, height: 88, borderRadius: 999, alignSelf: 'center',
          background: 'var(--accent)', color: 'var(--accent-ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        }}>
          <Icon.Check size={44} sw={2.4} />
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', textAlign: 'center', fontFamily: 'var(--font-display)' }}>
          Order placed.
        </h1>
        <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          We sent a receipt to <b style={{ color: 'var(--ink-1)' }}>aarav@mail.com</b>.<br/>
          Track every step in your orders.
        </p>

        {/* Order summary card */}
        <div style={{
          marginTop: 32, padding: 16, borderRadius: 'var(--radius-md)',
          background: 'var(--surface-alt)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Order ID</span>
            <span style={{ fontSize: 13, fontWeight: 600 }} className="tnum">#A-10394</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Arrives by</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Wed, May 13</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Total paid</span>
            <span className="tnum" style={{ fontSize: 13, fontWeight: 600 }}>\u20B97,802</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px var(--screen-h) 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button variant="primary" size="lg" full>Track order</Button>
        <Button variant="ghost" size="lg" full>Continue shopping</Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. ORDER HISTORY — Variation A
// ─────────────────────────────────────────────────────────────
function OrderHistoryA() {
  return (
    <div className="rs-app">
      <ScreenHeader title="Orders" back={false} />
      <div style={{
        display: 'flex', gap: 6, padding: '6px var(--screen-h) 12px',
        borderBottom: '1px solid var(--line)', flex: '0 0 auto',
      }}>
        {['All', 'Active', 'Delivered', 'Cancelled'].map((t, i) => (
          <button key={t} style={{
            padding: '7px 14px', borderRadius: 999,
            border: 'none', fontSize: 12, fontWeight: 600,
            background: i===0 ? 'var(--ink-1)' : 'var(--surface-alt)',
            color: i===0 ? 'var(--accent-ink)' : 'var(--ink-2)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{t}</button>
        ))}
      </div>
      <div className="rs-scroll" style={{ padding: '12px var(--screen-h)' }}>
        {MOCK.orders.map((o, i) => (
          <div key={o.id} style={{
            padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--surface)',
            border: '1px solid var(--line)', marginBottom: 10,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="tnum" style={{ fontSize: 13, fontWeight: 600 }}>{o.id}</span>
              <StatusBadge status={o.status} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {o.thumbs.map((g, j) => (
                <ProductTile key={j} tone={['cream','steel','olive'][j%3]} glyph={g} size={48} />
              ))}
              {o.items > o.thumbs.length && (
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--surface-alt)', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>+{o.items - o.thumbs.length}</div>
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{o.date}</span>
                <span className="tnum" style={{ fontSize: 15, fontWeight: 700 }}>\u20B9{o.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNavBar active="orders" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. ORDER DETAIL — Variation A
// ─────────────────────────────────────────────────────────────
function OrderDetailA() {
  return (
    <div className="rs-app">
      <ScreenHeader title="Order #A-10394" right={
        <button style={iconBtnStyle(false)}><Icon.Help size={20}/></button>
      } />
      <div className="rs-scroll" style={{ padding: '16px var(--screen-h) 24px' }}>
        {/* Status hero */}
        <div style={{ marginBottom: 20 }}>
          <StatusBadge status="Shipped" />
          <h2 style={{ margin: '8px 0 4px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Arrives Wednesday
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)' }}>Order placed May 9 · 2 items</p>
        </div>

        {/* Timeline */}
        <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--surface-alt)', marginBottom: 20 }}>
          {MOCK.timeline.map((t, i) => (
            <div key={t.state} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minHeight: 36 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{
                  width: 12, height: 12, borderRadius: 999,
                  background: t.done ? 'var(--ink-1)' : 'var(--surface)',
                  border: t.done ? 'none' : '1.5px solid var(--ink-5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 4,
                }} />
                {i < MOCK.timeline.length - 1 && (
                  <span style={{ width: 1.5, flex: 1, background: t.done ? 'var(--ink-1)' : 'var(--ink-5)', minHeight: 18, opacity: t.done ? 1 : 0.4 }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: t.done ? 600 : 500, color: t.done ? 'var(--ink-1)' : 'var(--ink-3)' }}>{t.state}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.at || '—'}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Items */}
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Items in this order</h3>
        {[MOCK.products[10], MOCK.products[1]].map(p => (
          <div key={p.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
            <ProductTile tone={p.tone} glyph={p.glyph} size={56} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{p.brand}</div>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Qty 1</div>
            </div>
            <span className="tnum" style={{ fontSize: 13, fontWeight: 600 }}>\u20B9{p.price.toLocaleString('en-IN')}</span>
          </div>
        ))}

        {/* Address + payment */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Shipping</div>
            <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--ink-2)' }}>Tower B, Mindspace, Madhapur 500081</div>
          </div>
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Paid by</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon.Card size={14}/> •••• 4912</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '12px var(--screen-h) 20px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
        <Button variant="secondary" size="md" style={{ flex: 1 }}>Need help?</Button>
        <Button variant="primary" size="md" style={{ flex: 1 }}>Track package</Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. PROFILE — Variation A
// ─────────────────────────────────────────────────────────────
function ProfileScreenA() {
  return (
    <div className="rs-app">
      <ScreenHeader title="Profile" back={false} right={
        <button style={iconBtnStyle(false)}><Icon.Settings size={20}/></button>
      } />
      <div className="rs-scroll">
        {/* User card */}
        <div style={{ padding: '12px var(--screen-h) 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 999,
              background: 'var(--ink-1)', color: 'var(--accent-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em',
            }}>AM</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>Aarav Mehta</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>aarav@mail.com</div>
            </div>
            <button style={iconBtnStyle(false)}><Icon.ChevR size={18} /></button>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ padding: '0 var(--screen-h) 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { l: 'Orders', v: 12 },
              { l: 'Saved', v: 24 },
              { l: 'Reward pts', v: 1240 },
            ].map(s => (
              <div key={s.l} style={{
                padding: 14, borderRadius: 'var(--radius-md)',
                background: 'var(--surface-alt)', textAlign: 'center',
              }}>
                <div className="tnum" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div style={{ padding: '0 var(--screen-h)' }}>
          {[
            { i: Icon.Box,   l: 'Your orders' },
            { i: Icon.Heart, l: 'Wishlist' },
            { i: Icon.Pin,   l: 'Addresses' },
            { i: Icon.Card,  l: 'Payment methods' },
            { i: Icon.Help,  l: 'Help & support' },
            { i: Icon.Settings, l: 'Preferences' },
          ].map((it, i, arr) => {
            const IC = it.i;
            return (
              <button key={it.l} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 0', border: 'none', background: 'transparent', cursor: 'pointer',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                fontFamily: 'inherit', color: 'var(--ink-1)',
              }}>
                <IC size={20} sw={1.6} />
                <span style={{ flex: 1, textAlign: 'left', fontSize: 14, fontWeight: 500 }}>{it.l}</span>
                <Icon.ChevR size={16} />
              </button>
            );
          })}
        </div>

        <div style={{ padding: '16px var(--screen-h) 24px' }}>
          <Button variant="secondary" size="md" full leading={<Icon.Logout size={16}/>}>Log out</Button>
        </div>
      </div>
      <BottomNavBar active="profile" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 10. LOGIN — Variation A
// ─────────────────────────────────────────────────────────────
function LoginScreenA() {
  return (
    <div className="rs-app" style={{ background: 'var(--surface)' }}>
      <div style={{ padding: '12px var(--screen-h)', display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{ border: 'none', background: 'transparent', fontSize: 13, fontWeight: 500, color: 'var(--ink-3)', fontFamily: 'inherit', cursor: 'pointer' }}>Skip</button>
      </div>
      <div className="rs-scroll" style={{ padding: '12px var(--screen-h) 24px' }}>
        <div style={{ marginTop: 8, marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Welcome to Re:store</div>
          <h1 style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, fontFamily: 'var(--font-display)' }}>
            Sign in.<br/>Or join us today.
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.4 }}>
            A single account for every purchase, every order, every saved piece.
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FieldA label="Email" placeholder="you@mail.com" leading={<Icon.Mail size={18}/>} />
          <FieldA label="Password" placeholder="••••••••" leading={<Icon.Lock size={18}/>} trailing={<Icon.Eye size={18}/>} />
          <a style={{ alignSelf: 'flex-end', fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', textDecoration: 'underline' }}>Forgot password?</a>
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button variant="primary" size="lg" full>Sign in</Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>OR</span>
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
          </div>
          <Button variant="secondary" size="lg" full leading={<span style={{ fontWeight: 800 }}>G</span>}>Continue with Google</Button>
          <Button variant="secondary" size="lg" full leading={<span style={{ fontSize: 16 }}>{'\uF8FF'}</span>}>Continue with Apple</Button>
        </div>

        <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          By continuing you agree to our <u>Terms</u> and <u>Privacy Policy</u>.
        </p>
      </div>
    </div>
  );
}

function FieldA({ label, placeholder, leading, trailing }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</span>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 14px', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--line-strong)', background: 'var(--surface)',
      }}>
        {leading && <span style={{ color: 'var(--ink-3)' }}>{leading}</span>}
        <input placeholder={placeholder} style={{
          flex: 1, border: 'none', background: 'transparent', outline: 'none',
          fontSize: 15, fontFamily: 'inherit', color: 'var(--ink-1)',
        }} />
        {trailing && <span style={{ color: 'var(--ink-3)' }}>{trailing}</span>}
      </div>
    </label>
  );
}

Object.assign(window, {
  HomeScreenA, ResultScreenA, ProductScreenA, CartScreenA, AddressScreenA,
  OrderSuccessA, OrderHistoryA, OrderDetailA, ProfileScreenA, LoginScreenA,
  CategoryChip, FieldA, SCREEN_W, SCREEN_H,
});
