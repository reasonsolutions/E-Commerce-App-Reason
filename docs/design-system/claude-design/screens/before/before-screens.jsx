// before-screens.jsx — Faithful recreations of the CURRENT broken UI,
// to display side-by-side with the redesigned After screens. All issues
// are sourced from the ui-audit.md document.

const beforeFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

function BeforeApp({ children, style = {} }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: '#FFFFFF',
      fontFamily: beforeFont, color: '#1A1A1A',
      display: 'flex', flexDirection: 'column', ...style,
    }}>{children}</div>
  );
}

function BeforeBottomNav({ active = 'Home' }) {
  // The audit-flagged copy-paste of BottomNav between Home (padY 8) and Orders (padY 12)
  return (
    <div style={{
      display: 'flex', borderTop: '1px solid #ECECEC',
      paddingTop: 8, paddingBottom: 28, background: '#fff',
    }}>
      {['Home','Categories','Discover','Wishlist'].map(l => (
        <div key={l} style={{ flex: 1, textAlign: 'center', color: l === active ? '#FF3B30' : '#666', fontSize: 13 }}>
          <div style={{ marginBottom: 2, fontSize: 18 }}>·</div>{l}
        </div>
      ))}
    </div>
  );
}

// ── BEFORE 1: Home (current — clashing colors, sad emoji, no-city banner)
function BeforeHome() {
  return (
    <BeforeApp style={{ background: '#FCEEEE' }}>
      <div style={{ padding: '8px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#000' }}>
          <span style={{ fontSize: 18 }}>😟</span> Sorry, we&apos;re not in your city yet.
        </div>
        <div style={{ fontSize: 12, marginTop: 6, color: '#222' }}>
          <b>Current:</b> Phase 2, Phase 2, Rangareddy <span style={{ color: '#888' }}>›</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <div style={{ flex: 1, background: '#fff', borderRadius: 18, padding: '8px 12px', fontSize: 13, color: '#999' }}>Search For &quot;Dresses&quot;</div>
          <div style={{ background: '#F4C634', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 800 }}>TRY &amp; BUY</div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', background: '#fff', marginTop: 12 }}>
        <div style={{ textAlign: 'center', padding: '14px 0 4px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '0.02em' }}>TOP CATEGORIES</div>
          <div style={{ fontSize: 11, color: '#444' }}>Shop everything at unbelievable prices</div>
        </div>
        <div style={{ padding: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            ['Dresses','#F1ECE2','tee'], ['Men\u2019s', '#E2DCD0','suit'], ['Ethnic','#F3E5D4','tee'],
            ['Bottomwear','#E4E7EB','pants'], ['Bags','#E5DCC4','bag'], ['Footwear','#D8E1EB','shoe'],
            ['Jewellery','#1B1B1B','watch'], ['Travel','#DDE6F0','bag'], ['Home','#EFE6D6','lamp'],
          ].map(([n, bg, g], i) => (
            <div key={i} style={{ background: bg, color: bg === '#1B1B1B' ? '#fff' : '#1A1A1A', borderRadius: 12, padding: '8px 0 4px', textAlign: 'center', height: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{n}</div>
                <div style={{ width: 40, height: 40 }}>{Glyph[g]}</div>
            </div>
          ))}
        </div>
      </div>
      <BeforeBottomNav active="Home" />
    </BeforeApp>
  );
}

// ── BEFORE 2: Product (clashing red CTA, circle for text labels)
function BeforeProduct() {
  return (
    <BeforeApp>
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #ECECEC' }}>
        <span style={{ fontSize: 22 }}>‹</span>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Product</span>
        <span style={{ marginLeft: 'auto', fontSize: 18 }}>♡</span>
      </div>
      <div style={{ background: '#F5F5F5', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1A1A' }}>
        <div style={{ width: 130, height: 130 }}>{Glyph.shoe}</div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 14, color: '#888' }}>Nike</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Air Jordan 40 PF</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: '#e91e63' }}>₹5,000 <span style={{ fontSize: 13, color: 'red', textDecoration: 'line-through', fontWeight: 400 }}>₹6,000</span></div>
        {/* WRONG: circular swatches used for text size labels */}
        <div style={{ marginTop: 14, fontSize: 13, color: '#444' }}>Size</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {['6','7','8','9','10'].map((s, i) => (
            <div key={s} style={{ width: 36, height: 36, borderRadius: 999, border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, background: i===1?'#007AFF':'#fff', color: i===1?'#fff':'#1A1A1A' }}>{s}</div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 22px', borderTop: '1px solid #ECECEC', display: 'flex', gap: 10, background: '#fff' }}>
        <div style={{ flex: 1, padding: '12px 0', textAlign: 'center', background: '#fff', border: '1px solid #007AFF', color: '#007AFF', borderRadius: 8, fontWeight: 700 }}>Buy Now</div>
        {/* WRONG: red CTA in a blue app */}
        <div style={{ flex: 1, padding: '12px 0', textAlign: 'center', background: '#FF6B6B', color: '#fff', borderRadius: 8, fontWeight: 700 }}>Add to Cart</div>
      </div>
    </BeforeApp>
  );
}

// ── BEFORE 3: Address (exposed Customer Profile Code, no back btn)
function BeforeAddress() {
  return (
    <BeforeApp style={{ background: '#f5f6fa' }}>
      <div style={{ padding: '14px 16px', background: '#1976d2', color: '#fff', fontSize: 17, fontWeight: 600 }}>
        Select Address
      </div>
      <div style={{ padding: 16, flex: 1, overflow: 'auto' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 10, border: i===3?'2px solid #1976d2':'1px solid #ddd' }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Aarav Mehta</div>
            {/* BUG: exposed internal field in UI */}
            <div style={{ fontSize: 11, color: '#1976d2', fontFamily: 'monospace', marginTop: 2 }}>CustomerProfileCode: 100079</div>
            <div style={{ fontSize: 13, color: '#444', marginTop: 4 }}>Flat 12B, Sunrise Apt, Hitech City</div>
            <div style={{ fontSize: 12, color: '#888' }}>+91 98765 43210</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 16px 24px' }}>
        {/* Red checkout in mid-flow */}
        <div style={{ padding: '14px 0', background: '#FF6B6B', color: '#fff', borderRadius: 8, textAlign: 'center', fontWeight: 700 }}>Proceed to Checkout</div>
      </div>
    </BeforeApp>
  );
}

// ── BEFORE 4: Order Detail (stuck loading)
function BeforeOrderDetail() {
  return (
    <BeforeApp>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
        {/* BUG: no SafeAreaView, no back button. Permanent Loading… */}
        <div style={{ width: 32, height: 32, border: '3px solid #ECECEC', borderTopColor: '#007AFF', borderRadius: 999, animation: 'rs-shimmer 1s linear infinite' }}/>
        <div style={{ fontSize: 15, color: '#666' }}>Loading...</div>
      </div>
    </BeforeApp>
  );
}

// ── BEFORE 5: Profile (broken route, no avatar)
function BeforeProfile() {
  return (
    <BeforeApp style={{ background: '#F8F9FA' }}>
      <div style={{ padding: '14px 16px', fontSize: 18, fontWeight: 700, background: '#0078D4', color: '#fff' }}>
        Profile
      </div>
      <div style={{ padding: 16 }}>
        {/* avatar styles defined but never rendered (audit) */}
        <div style={{ fontSize: 16, fontWeight: 600 }}>Aarav Mehta</div>
        <div style={{ fontSize: 12, color: '#666' }}>aarav@mail.com</div>
      </div>
      <div style={{ padding: 0, flex: 1 }}>
        {['My Orders','Wishlist','Addresses','Payments','Help','Logout'].map((l, i) => (
          <div key={l} onClick={i===0?undefined:null} style={{
            padding: '14px 16px', borderBottom: '1px solid #ECECEC',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            color: i===5?'#d32f2f':'#1A1A1A', fontSize: 14,
          }}>
            <span>{l}</span><span style={{ color: '#999' }}>›</span>
            {/* BUG-01: My Orders points to 'OrderScreen' (does not exist) — tap does nothing */}
          </div>
        ))}
      </div>
    </BeforeApp>
  );
}

Object.assign(window, { BeforeHome, BeforeProduct, BeforeAddress, BeforeOrderDetail, BeforeProfile });
