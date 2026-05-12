// components-gallery.jsx — isolated component variants for the Components tab
// of the canvas. Each function returns a small artboard (no phone frame).

function GallerySwatch({ label, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      <div style={{ width: 60, height: 60, background: color, borderRadius: 'var(--radius-md)', boxShadow: '0 0 0 1px rgba(0,0,0,0.06) inset' }}/>
      <div style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function GalleryWrap({ title, children }) {
  return (
    <div style={{ padding: 24, background: '#fff', height: '100%', fontFamily: 'var(--font-sans)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

// 1. Color tokens
function ColorTokens() {
  return (
    <GalleryWrap title="Color tokens">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        {[
          ['accent','var(--accent)'], ['ink-1','#0A0A0A'], ['ink-2','#2E2E2E'], ['ink-3','#6B6B6B'],
          ['ink-4','#9A9A9A'], ['ink-5','#C9C9C7'], ['line','#ECECEA'], ['surface-alt','#F5F5F3'],
        ].map(([l, c]) => <GallerySwatch key={l} label={l} color={c}/>)}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Semantic</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          ['danger','#D7263D'], ['success','#1F7A3A'], ['warning','#B47914'], ['info','#2454FF'],
        ].map(([l, c]) => <GallerySwatch key={l} label={l} color={c}/>)}
      </div>
    </GalleryWrap>
  );
}

// 2. Type scale
function TypeScale() {
  return (
    <GalleryWrap title="Type scale">
      {[
        ['Display 48',48,700,'-0.03em','Quiet luxury'],
        ['Display 36',36,700,'-0.03em','Quiet luxury'],
        ['Heading 28',28,700,'-0.02em','Top of the week'],
        ['Heading 24',24,600,'-0.02em','Your bag'],
        ['Heading 20',20,600,'-0.02em','Top of the week'],
        ['Body 17',17,500,'-0.01em','We sent a receipt to aarav@mail.com'],
        ['Body 15',15,400,'0','A simpler way to shop everyday essentials.'],
        ['Caption 13',13,500,'0','3–5 days · Free'],
        ['Micro 11',11,600,'0.04em','MEMBER SINCE 2023'],
      ].map(([l, fs, fw, ls, ex]) => (
        <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 16, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--line)' }}>
          <div style={{ width: 110, fontSize: 10, color: 'var(--ink-3)', fontWeight: 600 }}>{l}</div>
          <div style={{ fontSize: fs, fontWeight: fw, letterSpacing: ls, lineHeight: 1.05, flex: 1 }}>{ex}</div>
        </div>
      ))}
    </GalleryWrap>
  );
}

// 3. Buttons
function GalleryButtons() {
  return (
    <GalleryWrap title="Buttons">
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>Variants</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>Sizes</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18 }}>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>With icon</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button leading={<Icon.Plus size={16}/>}>Add</Button>
        <Button variant="secondary" trailing={<Icon.ChevR size={16}/>}>Continue</Button>
      </div>
    </GalleryWrap>
  );
}

// 4. Inputs / Stepper
function GalleryInputs() {
  return (
    <GalleryWrap title="Inputs & control">
      <div style={{ marginBottom: 18 }}>
        <FieldA label="Email" placeholder="you@mail.com" leading={<Icon.Mail size={18}/>}/>
      </div>
      <div style={{ marginBottom: 18 }}>
        <FieldA label="Password" placeholder="••••••••" leading={<Icon.Lock size={18}/>} trailing={<Icon.Eye size={18}/>}/>
      </div>
      <div style={{ marginBottom: 18 }}>
        <SearchBar placeholder="Search products" trailing={<Icon.Camera size={18}/>}/>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>Quantity stepper</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <QuantityStepper value={2} size="sm"/>
        <QuantityStepper value={5}/>
      </div>
    </GalleryWrap>
  );
}

// 5. Badges
function GalleryBadges() {
  return (
    <GalleryWrap title="Status badges">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <StatusBadge status="Confirmed"/>
        <StatusBadge status="Shipped"/>
        <StatusBadge status="In transit"/>
        <StatusBadge status="Delivered"/>
        <StatusBadge status="Cancelled"/>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', margin: '22px 0 10px' }}>Discount chips</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Price value={4500} was={6000} size="lg"/>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 999, background: 'var(--ink-1)', color: '#fff', letterSpacing: '0.02em' }}>25% OFF</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 999, background: 'var(--success-tint)', color: 'var(--success)', letterSpacing: '0.02em' }}>NEW</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', margin: '22px 0 10px' }}>Rating</div>
      <Rating value={4.8} count={1240}/>
    </GalleryWrap>
  );
}

// 6. Product card variants
function GalleryProductCard() {
  return (
    <GalleryWrap title="Product card">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 360 }}>
        <ProductCard product={MOCK.products[0]} variant="grid"/>
        <ProductCard product={MOCK.products[3]} variant="grid" liked/>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', margin: '22px 0 10px' }}>Shelf · horizontal</div>
      <div style={{ display: 'flex', gap: 12, overflow: 'hidden' }}>
        {MOCK.products.slice(4, 8).map(p => <ProductCard key={p.id} product={p} variant="shelf" width={130}/>)}
      </div>
    </GalleryWrap>
  );
}

// 7. Bottom nav variants
function GalleryNav() {
  return (
    <GalleryWrap title="Bottom navigation">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
        <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          <BottomNavBar active="home" badges={{ cart: 3 }}/>
        </div>
        <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          <BottomNavBar active="orders"/>
        </div>
        <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          <BottomNavBar active="profile" badges={{ orders: '!' }}/>
        </div>
      </div>
    </GalleryWrap>
  );
}

// 8. Spacing & radii reference
function GallerySpacing() {
  return (
    <GalleryWrap title="Spacing & radii">
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>Spacing scale (4px base)</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 24 }}>
        {[4,8,12,16,24,32,48].map(s => (
          <div key={s} style={{ textAlign: 'center' }}>
            <div style={{ width: s, height: s, background: 'var(--ink-1)', borderRadius: 2 }}/>
            <div className="tnum" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>Radii</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {[['xs',4],['sm',8],['md',12],['lg',18],['pill',999]].map(([n, r]) => (
          <div key={n} style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: 'var(--surface-alt)', borderRadius: r }}/>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>{n}</div>
          </div>
        ))}
      </div>
    </GalleryWrap>
  );
}

Object.assign(window, { ColorTokens, TypeScale, GalleryButtons, GalleryInputs, GalleryBadges, GalleryProductCard, GalleryNav, GallerySpacing });
