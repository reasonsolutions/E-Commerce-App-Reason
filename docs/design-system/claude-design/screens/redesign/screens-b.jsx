// screens-b.jsx — Variation B: "Soft Surface"
// Same component vocabulary, different visual rhythm:
//  - warm neutral background, rounded corners (radius-lg as default)
//  - tonal section cards instead of full-bleed hero
//  - "stacked label" navigation pattern
//  - product cards have white surface inside warm bg

// ── Local helpers ──────────────────────────────────────────────
function SoftSurface({ children, style = {} }) {
  return (
    <div className="rs-app" style={{ background: 'var(--surface-mute)', ...style }}>
      {children}
    </div>
  );
}

function PillTab({ label, active }) {
  return (
    <button style={{
      padding: '8px 14px', borderRadius: 999, border: 'none',
      background: active ? 'var(--surface)' : 'transparent',
      color: active ? 'var(--ink-1)' : 'var(--ink-3)',
      fontSize: 13, fontWeight: active ? 600 : 500,
      boxShadow: active ? 'var(--shadow-sm)' : 'none',
      cursor: 'pointer', fontFamily: 'inherit',
    }}>{label}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. HOME — Variation B
// ─────────────────────────────────────────────────────────────
function HomeScreenB() {
  return (
    <SoftSurface>
      {/* Top */}
      <div style={{ padding: '8px var(--screen-h) 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
          re:store
        </div>
        <button style={iconBtnStyle(false)}><Icon.Pin size={20}/></button>
        <button style={iconBtnStyle(false)}>
          <span style={{ position: 'relative' }}>
            <Icon.Bag size={20} />
            <span style={{ position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
          </span>
        </button>
      </div>

      <div style={{ padding: '0 var(--screen-h) 8px' }}>
        <SearchBar placeholder="Try \u2018wireless headphones\u2019" trailing={<Icon.Camera size={18}/>} />
      </div>

      {/* Top pill tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: '8px var(--screen-h) 4px',
        background: 'var(--surface-alt)',
        margin: '8px var(--screen-h)', borderRadius: 999, justifyContent: 'space-between',
      }}>
        <PillTab label="For you" active />
        <PillTab label="New" />
        <PillTab label="Sale" />
        <PillTab label="Local" />
      </div>

      <div className="rs-scroll">
        {/* Soft hero card */}
        <div style={{ padding: '8px var(--screen-h) 16px' }}>
          <div style={{
            borderRadius: 'var(--radius-lg)', padding: 18,
            background: '#EDE6DA', position: 'relative', overflow: 'hidden',
            minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#7A5D2B' }}>Mother's Day · Up to 40% off</div>
              <h2 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#2A1F0E' }}>
                Soft picks,<br/>thoughtful gifts.
              </h2>
            </div>
            <Button variant="primary" size="sm" style={{ alignSelf: 'flex-start', marginTop: 14 }}>Shop gifts</Button>
            <div style={{ position: 'absolute', right: -14, bottom: -22, width: 150, height: 150, color: '#A0876B', opacity: 0.95 }}>
              {Glyph.bag}
            </div>
          </div>
        </div>

        {/* Category tile grid (8 — Amazon-style) */}
        <div style={{ padding: '0 var(--screen-h) 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {MOCK.categories.slice(0, 8).map(c => (
              <div key={c.id} style={{
                background: 'var(--surface)', borderRadius: 'var(--radius-md)',
                padding: '12px 6px 10px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6, boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ width: 30, height: 30, color: 'var(--ink-1)' }}>{Glyph[c.glyph] || Glyph.tee}</div>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-2)' }}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section: trending */}
        <SectionLabel action={{ label: 'See all' }}>Trending now</SectionLabel>
        <div style={{ display: 'flex', gap: 12, padding: '0 var(--screen-h) 20px', overflowX: 'auto' }}>
          {MOCK.products.slice(0, 5).map(p => (
            <div key={p.id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 10, width: 144, flex: '0 0 auto', boxShadow: 'var(--shadow-sm)' }}>
              <ProductCard product={p} variant="shelf" width="100%" />
            </div>
          ))}
        </div>

        {/* Twin promo cards */}
        <div style={{ padding: '0 var(--screen-h) 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { bg: '#DCE7E1', fg: '#1F4034', kicker: 'Active', title: 'Run\nLighter.', glyph: 'shoe' },
            { bg: '#E2DCE7', fg: '#3A2858', kicker: 'Tech', title: 'Sound\nfor focus.', glyph: 'phones' },
          ].map((c, i) => (
            <div key={i} style={{ background: c.bg, color: c.fg, borderRadius: 'var(--radius-md)', padding: 14, minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', position: 'relative' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>{c.kicker}</div>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 4, whiteSpace: 'pre-line' }}>{c.title}</div>
              </div>
              <div style={{ position: 'absolute', bottom: -12, right: -10, width: 80, height: 80, opacity: 0.75 }}>{Glyph[c.glyph]}</div>
            </div>
          ))}
        </div>

        {/* For you grid */}
        <SectionLabel>Just for you</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 var(--screen-h) 24px' }}>
          {MOCK.products.slice(4, 8).map(p => (
            <div key={p.id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 10, boxShadow: 'var(--shadow-sm)' }}>
              <ProductCard product={p} variant="grid" />
            </div>
          ))}
        </div>
      </div>

      <BottomNavBar active="home" badges={{ cart: 3 }} />
    </SoftSurface>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. SEARCH RESULTS — Variation B (list-density)
// ─────────────────────────────────────────────────────────────
function ResultScreenB() {
  return (
    <SoftSurface>
      <ScreenHeader title="Headphones" right={
        <>
          <button style={iconBtnStyle(false)}><Icon.Sort size={20}/></button>
          <button style={iconBtnStyle(false)}><Icon.Filter size={20}/></button>
        </>
      } />
      <div style={{ padding: '8px var(--screen-h)', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {['Under \u20B92,000','Bluetooth','Noise cancelling','Rating 4+','In stock'].map((c,i) => (
          <span key={i} style={{
            padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
            background: i===0?'var(--ink-1)':'var(--surface)', color: i===0?'var(--accent-ink)':'var(--ink-2)',
            display: 'inline-flex', alignItems: 'center', gap: 6, flex: '0 0 auto',
            border: i===0?'none':'1px solid var(--line)',
          }}>{c}{i===0 && <Icon.Close size={12}/>}</span>
        ))}
      </div>

      <div className="rs-scroll" style={{ padding: '8px var(--screen-h) 16px' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>284 results</div>
        {MOCK.products.slice(3, 9).map(p => (
          <div key={p.id} style={{
            display: 'flex', gap: 12, padding: 10, marginBottom: 10,
            background: 'var(--surface)', borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <ProductTile tone={p.tone} glyph={p.glyph} size={96} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{p.brand}</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{p.title}</div>
              <div style={{ marginTop: 4 }}><Rating value={p.rating} count={p.reviews} /></div>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Price value={p.price} was={p.was} size="sm"/>
                <button style={{ ...iconBtnStyle(false), background: 'var(--surface-alt)' }}><Icon.Plus size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SoftSurface>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. PRODUCT — Variation B (image-card on warm surface)
// ─────────────────────────────────────────────────────────────
function ProductScreenB() {
  const p = MOCK.products[2]; // Wool Suit
  return (
    <SoftSurface>
      <ScreenHeader title="" variant="transparent" right={
        <>
          <button style={iconBtnStyle(true)}><Icon.Heart size={18}/></button>
          <button style={iconBtnStyle(true)}><Icon.Cart size={18}/></button>
        </>
      } />
      <div className="rs-scroll" style={{ marginTop: -52 }}>
        <div style={{ padding: '52px var(--screen-h) 16px' }}>
          <div style={{ background: TONE[p.tone].bg, borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative', aspectRatio: '4 / 5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '60%', color: TONE[p.tone].fg }}>{Glyph[p.glyph]}</div>
            <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', gap: 4, justifyContent: 'center' }}>
              {[0,1,2,3].map(i => <span key={i} style={{ width: i===0?14:5, height: 5, borderRadius: 3, background: i===0?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.4)' }}/>)}
            </div>
          </div>
        </div>

        <div style={{ padding: '4px var(--screen-h) 130px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.brand}</div>
              <h1 style={{ margin: '6px 0 8px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{p.title}</h1>
              <Rating value={p.rating} count={p.reviews} />
            </div>
            <Price value={p.price} was={p.was} size="lg" />
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Color</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['#1A2238','#2C3318','#36302A','#3B2A14'].map((c, i) => (
                <button key={i} style={{
                  width: 40, height: 40, borderRadius: 999,
                  background: c, border: i===0?'2px solid var(--ink-1)':'2px solid var(--surface-mute)',
                  outline: i===0?'1.5px solid var(--surface-mute)':'none',
                  outlineOffset: -4, cursor: 'pointer',
                }}/>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Size</span>
              <span style={{ fontSize: 12, color: 'var(--accent)' }}>Size guide</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {['XS','S','M','L','XL'].map((s, i) => (
                <button key={s} style={{
                  padding: '10px 0', borderRadius: 'var(--radius-md)',
                  background: i===1?'var(--ink-1)':'var(--surface)',
                  color: i===1?'var(--accent-ink)':'var(--ink-1)',
                  border: '1px solid ' + (i===1?'var(--ink-1)':'var(--line)'),
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div style={{ marginTop: 22, padding: 14, background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Highlights</span>
              <Icon.ChevD size={16} />
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['100% merino wool','Tailored slim fit','Half-canvas construction'].map(t => (
                <li key={t} style={{ fontSize: 12, color: 'var(--ink-2)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Icon.Check size={14} /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px var(--screen-h) 20px', background: 'var(--surface)', borderTop: '1px solid var(--line)', display: 'flex', gap: 10 }}>
        <Button variant="secondary" size="lg">Save</Button>
        <Button variant="primary" size="lg" full style={{ flex: 1 }}>Add to bag</Button>
      </div>
    </SoftSurface>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. CART — Variation B (recommended additions)
// ─────────────────────────────────────────────────────────────
function CartScreenB() {
  const total = MOCK.cart.reduce((s, l) => {
    const p = MOCK.products.find(x => x.id === l.id);
    return s + (p?.price || 0) * l.qty;
  }, 0);
  return (
    <SoftSurface>
      <ScreenHeader title="Bag" subtitle="4 items · ships free" />
      <div className="rs-scroll" style={{ padding: '8px var(--screen-h) 0' }}>
        {/* Free shipping bar */}
        <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--success-tint)', marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon.Truck size={20} />
          <div style={{ flex: 1, fontSize: 12, color: 'var(--ink-2)' }}>You\u2019re eligible for <b style={{ color: 'var(--ink-1)' }}>free delivery</b>.</div>
        </div>

        {MOCK.cart.map(l => {
          const p = MOCK.products.find(x => x.id === l.id);
          return (
            <div key={l.id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: 12, marginBottom: 8 }}>
              <CartLine product={p} qty={l.qty} variant={l.variant} />
            </div>
          );
        })}

        {/* Recommendations */}
        <SectionLabel>You might also like</SectionLabel>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16 }}>
          {MOCK.products.slice(6, 10).map(p => (
            <div key={p.id} style={{ width: 130, flex: '0 0 auto', background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 8, boxShadow: 'var(--shadow-sm)' }}>
              <ProductCard product={p} variant="shelf" width="100%" />
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '12px var(--screen-h) 20px', background: 'var(--surface)', borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Total · inc. tax</span>
          <span className="tnum" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>\u20B9{total.toLocaleString('en-IN')}</span>
        </div>
        <Button variant="primary" size="lg" full trailing={<Icon.ChevR size={18}/>}>Checkout securely</Button>
      </div>
    </SoftSurface>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. ADDRESS — Variation B (vertical step pills)
// ─────────────────────────────────────────────────────────────
function AddressScreenB() {
  return (
    <SoftSurface>
      <ScreenHeader title="Delivery" subtitle="Step 2 of 3" />
      <div className="rs-scroll" style={{ padding: '8px var(--screen-h) 16px' }}>
        <div style={{ padding: 14, background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Delivery option</div>
          {[
            { l: 'Standard', s: '3–5 days', p: 'Free', sel: true },
            { l: 'Express', s: '1–2 days', p: '\u20B9149' },
            { l: 'Same-day', s: 'Before 9pm', p: '\u20B9249' },
          ].map((o, i) => (
            <label key={o.l} style={{
              display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0',
              borderBottom: i < 2 ? '1px solid var(--line)' : 'none',
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: 999,
                border: o.sel ? '5px solid var(--ink-1)' : '1.5px solid var(--ink-4)',
              }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{o.l}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{o.s}</div>
              </div>
              <span className="tnum" style={{ fontSize: 13, fontWeight: 600 }}>{o.p}</span>
            </label>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Saved addresses</div>
        {MOCK.addresses.map(a => (
          <div key={a.id} style={{
            background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 8,
            boxShadow: 'var(--shadow-sm)',
            display: 'flex', gap: 12,
            outline: a.selected ? '2px solid var(--ink-1)' : 'none',
            outlineOffset: -2,
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 999, flex: '0 0 auto',
              border: a.selected ? '5px solid var(--ink-1)' : '1.5px solid var(--ink-4)',
              marginTop: 2,
            }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', background: 'var(--surface-alt)', color: 'var(--ink-2)', borderRadius: 999, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{a.label}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4 }}>{a.line1}, {a.line2}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{a.phone}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px var(--screen-h) 20px', background: 'var(--surface)', borderTop: '1px solid var(--line)' }}>
        <Button variant="primary" size="lg" full>Continue to payment</Button>
      </div>
    </SoftSurface>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. ORDER SUCCESS — Variation B
// ─────────────────────────────────────────────────────────────
function OrderSuccessB() {
  return (
    <SoftSurface>
      <div className="rs-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{
          margin: '24px var(--screen-h) 0', borderRadius: 'var(--radius-lg)',
          background: '#0E0E0E', color: '#fff', padding: '36px 24px 28px',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: 999, background: 'rgba(255,255,255,0.04)' }}/>
          <div style={{
            width: 64, height: 64, borderRadius: 999, background: '#fff', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
          }}><Icon.Check size={32} sw={2.6}/></div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>You\u2019re all set</h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            Order <b style={{ color: '#fff' }} className="tnum">#A-10394</b> is on its way.<br/>
            Estimated arrival: <b style={{ color: '#fff' }}>Wed, May 13</b>
          </p>
        </div>

        <div style={{ padding: '20px var(--screen-h) 12px', flex: 1 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 14, boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>What\u2019s in this order</h3>
            {[MOCK.products[9], MOCK.products[10]].map(p => (
              <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0' }}>
                <ProductTile tone={p.tone} glyph={p.glyph} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.brand} · Qty 1</div>
                </div>
                <span className="tnum" style={{ fontSize: 13, fontWeight: 600 }}>\u20B9{p.price.toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Total</span>
              <span className="tnum" style={{ fontSize: 15, fontWeight: 700 }}>\u20B96,247</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '12px var(--screen-h) 20px', display: 'flex', gap: 10 }}>
        <Button variant="secondary" size="lg" style={{ flex: 1 }}>View order</Button>
        <Button variant="primary" size="lg" style={{ flex: 1 }}>Keep shopping</Button>
      </div>
    </SoftSurface>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. ORDER HISTORY — Variation B (timeline list)
// ─────────────────────────────────────────────────────────────
function OrderHistoryB() {
  return (
    <SoftSurface>
      <ScreenHeader title="Your orders" back={false} right={<button style={iconBtnStyle(false)}><Icon.Search size={20}/></button>}/>
      <div className="rs-scroll" style={{ padding: '12px var(--screen-h)' }}>
        {MOCK.orders.map(o => (
          <button key={o.id} style={{
            width: '100%', background: 'var(--surface)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
            padding: 14, marginBottom: 10, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', textAlign: 'left',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>{o.date} · {o.items} item{o.items>1?'s':''}</div>
                <div className="tnum" style={{ fontSize: 14, fontWeight: 600 }}>{o.id}</div>
              </div>
              <StatusBadge status={o.status}/>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {o.thumbs.slice(0, 3).map((g, j) => (
                <ProductTile key={j} tone={['cream','steel','olive','tan'][j]} glyph={g} size={44} />
              ))}
              <div style={{ flex: 1 }}/>
              <span className="tnum" style={{ fontSize: 14, fontWeight: 600 }}>\u20B9{o.total.toLocaleString('en-IN')}</span>
              <Icon.ChevR size={16}/>
            </div>
          </button>
        ))}
      </div>
      <BottomNavBar active="orders"/>
    </SoftSurface>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. ORDER DETAIL — Variation B (map-style tracker)
// ─────────────────────────────────────────────────────────────
function OrderDetailB() {
  return (
    <SoftSurface>
      <ScreenHeader title="Tracking" right={<button style={iconBtnStyle(false)}><Icon.Help size={20}/></button>}/>
      <div className="rs-scroll" style={{ padding: '12px var(--screen-h) 16px' }}>
        {/* Map placeholder */}
        <div style={{ height: 160, borderRadius: 'var(--radius-md)', background: 'linear-gradient(180deg, #E0E5E2 0%, #D0D8D2 100%)', position: 'relative', overflow: 'hidden', marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
          {/* faux routes */}
          <svg viewBox="0 0 300 160" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <path d="M -20 130 Q 80 80 150 100 T 320 50" stroke="#fff" strokeWidth="3" fill="none" strokeDasharray="6 6" opacity="0.7"/>
            <path d="M 20 30 L 280 30 M 30 60 L 250 60 M 0 90 L 220 90" stroke="rgba(0,0,0,0.06)" strokeWidth="2"/>
          </svg>
          <div style={{ position: 'absolute', left: '22%', top: '60%', width: 24, height: 24, borderRadius: 999, background: 'var(--ink-1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>1</div>
          <div style={{ position: 'absolute', right: '12%', top: '30%', width: 28, height: 28, borderRadius: 999, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.Pin size={14}/>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 14, boxShadow: 'var(--shadow-sm)', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>ETA</div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>Wed, May 13 · 6–9 PM</div>
            </div>
            <StatusBadge status="In transit"/>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < 2 ? 'var(--ink-1)' : 'var(--line)' }}/>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--ink-3)' }}>
            <span style={{ color: 'var(--ink-1)', fontWeight: 600 }}>Packed</span>
            <span style={{ color: 'var(--ink-1)', fontWeight: 600 }}>Shipped</span>
            <span>Out</span>
            <span>Delivered</span>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 14, boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>Updates</h3>
          {MOCK.timeline.map((t, i) => (
            <div key={t.state} style={{ display: 'flex', gap: 10, padding: '6px 0' }}>
              <span style={{
                width: 8, height: 8, marginTop: 6, borderRadius: 999, flex: '0 0 auto',
                background: t.done ? 'var(--accent)' : 'var(--line-strong)',
              }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: t.done ? 600 : 500, color: t.done ? 'var(--ink-1)' : 'var(--ink-3)' }}>{t.state}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.at || 'Pending'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '12px var(--screen-h) 20px', background: 'var(--surface)', borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
        <Button variant="secondary" size="md" style={{ flex: 1 }} leading={<Icon.Help size={16}/>}>Support</Button>
        <Button variant="primary" size="md" style={{ flex: 1 }}>View details</Button>
      </div>
    </SoftSurface>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. PROFILE — Variation B (grid-tile menu)
// ─────────────────────────────────────────────────────────────
function ProfileScreenB() {
  return (
    <SoftSurface>
      <ScreenHeader title="You" back={false} right={<button style={iconBtnStyle(false)}><Icon.Settings size={20}/></button>}/>
      <div className="rs-scroll" style={{ padding: '4px var(--screen-h) 16px' }}>
        <div style={{ background: '#0E0E0E', color: '#fff', borderRadius: 'var(--radius-lg)', padding: 18, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 999, background: 'rgba(255,255,255,0.12)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600 }}>AM</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Aarav Mehta</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Member since 2023</div>
            </div>
            <button style={{ ...iconBtnStyle(false), background: 'rgba(255,255,255,0.12)', color: '#fff' }}><Icon.ChevR size={18}/></button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {[{l:'Reward pts',v:'1,240'},{l:'Tier',v:'Silver'},{l:'Next perk',v:'\u20B9100 off'}].map((s,i) => (
              <div key={i} style={{ flex: 1, padding: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)' }}>
                <div className="tnum" style={{ fontSize: 14, fontWeight: 700 }}>{s.v}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { i: Icon.Box,   l: 'Orders',     s: '12 placed' },
            { i: Icon.Heart, l: 'Wishlist',   s: '24 items' },
            { i: Icon.Pin,   l: 'Addresses',  s: '3 saved' },
            { i: Icon.Card,  l: 'Payments',   s: '2 cards' },
            { i: Icon.Tag,   l: 'Coupons',    s: '3 active' },
            { i: Icon.Help,  l: 'Help',       s: '24/7' },
          ].map(it => {
            const IC = it.i;
            return (
              <button key={it.l} style={{
                background: 'var(--surface)', borderRadius: 'var(--radius-md)',
                padding: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                textAlign: 'left', boxShadow: 'var(--shadow-sm)',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <IC size={20}/>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{it.l}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{it.s}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 14 }}>
          <Button variant="secondary" size="md" full leading={<Icon.Logout size={16}/>}>Log out</Button>
        </div>
      </div>
      <BottomNavBar active="profile"/>
    </SoftSurface>
  );
}

// ─────────────────────────────────────────────────────────────
// 10. LOGIN — Variation B (bottom sheet style)
// ─────────────────────────────────────────────────────────────
function LoginScreenB() {
  return (
    <div className="rs-app" style={{ background: '#0E0E0E', color: '#fff' }}>
      <div style={{ flex: 1, padding: '32px var(--screen-h) 16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: 40, width: 280, height: 280, color: 'rgba(255,255,255,0.07)' }}>
          {Glyph.bag}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>re:store</div>
          <h1 style={{ margin: '60px 0 12px', fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, fontFamily: 'var(--font-display)' }}>
            A simpler<br/>way to shop.
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.7)', maxWidth: 240, lineHeight: 1.45 }}>
            Curated brands, real reviews, no clutter. One account is all you need.
          </p>
        </div>
      </div>
      <div style={{
        background: '#fff', color: 'var(--ink-1)',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: '24px var(--screen-h) 20px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <Button variant="primary" size="lg" full leading={<Icon.Mail size={18}/>}>Continue with email</Button>
        <Button variant="secondary" size="lg" full leading={<span style={{ fontWeight: 800 }}>G</span>}>Continue with Google</Button>
        <Button variant="secondary" size="lg" full leading={<span style={{ fontSize: 16 }}>{'\uF8FF'}</span>}>Continue with Apple</Button>
        <p style={{ margin: '6px 0 0', textAlign: 'center', fontSize: 12, color: 'var(--ink-3)' }}>
          New to Re:store? <b style={{ color: 'var(--ink-1)' }}>Create an account</b>
        </p>
      </div>
    </div>
  );
}

Object.assign(window, {
  HomeScreenB, ResultScreenB, ProductScreenB, CartScreenB, AddressScreenB,
  OrderSuccessB, OrderHistoryB, OrderDetailB, ProfileScreenB, LoginScreenB,
  SoftSurface, PillTab,
});
