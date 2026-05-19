// states.jsx — loading skeletons, empty states, error states, components gallery.

// ── Skeleton: Home loading ─────────────────────────────────
function SkelHome() {
  return (
    <div className="rs-app">
      <div style={{ padding: '8px var(--screen-h) 12px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}><Skel h={11} w="40%" style={{ marginBottom: 6 }}/><Skel h={14} w="70%"/></div>
        <Skel w={36} h={36} r={999}/><Skel w={36} h={36} r={999}/>
      </div>
      <div style={{ padding: '0 var(--screen-h) 12px' }}><Skel h={44} r={999}/></div>
      <div className="rs-scroll" style={{ padding: '0 var(--screen-h)' }}>
        <Skel h={200} r={18} style={{ marginBottom: 24 }}/>
        <Skel h={18} w="50%" style={{ marginBottom: 12 }}/>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <Skel key={i} w={68} h={68} r={999}/>)}
        </div>
        <Skel h={18} w="60%" style={{ marginBottom: 12 }}/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
          {[1,2,3,4].map(i => (
            <div key={i}>
              <Skel h={140} r={12} style={{ marginBottom: 8 }}/>
              <Skel h={10} w="40%" style={{ marginBottom: 6 }}/>
              <Skel h={12} w="80%" style={{ marginBottom: 4 }}/>
              <Skel h={14} w="50%"/>
            </div>
          ))}
        </div>
      </div>
      <BottomNavBar active="home"/>
    </div>
  );
}

// ── Skeleton: Product Detail ────────────────────────────────
function SkelProduct() {
  return (
    <div className="rs-app">
      <ScreenHeader title="" variant="transparent" />
      <div className="rs-scroll" style={{ marginTop: -52 }}>
        <Skel h={360} r={0}/>
        <div style={{ padding: '20px var(--screen-h)' }}>
          <Skel h={10} w="20%" style={{ marginBottom: 8 }}/>
          <Skel h={22} w="70%" style={{ marginBottom: 10 }}/>
          <Skel h={14} w="40%" style={{ marginBottom: 18 }}/>
          <Skel h={26} w="50%" style={{ marginBottom: 22 }}/>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,2,3,4,5].map(i => <Skel key={i} w={46} h={42} r={12}/>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty: Cart ────────────────────────────────────────────
function EmptyCart() {
  return (
    <div className="rs-app">
      <ScreenHeader title="Bag"/>
      <EmptyState
        icon={<Icon.Bag size={28}/>}
        title="Your bag is empty"
        body="Saved items, recommended picks and recent views are waiting on the home screen."
        action={<Button variant="primary" size="md">Start shopping</Button>}
      />
      <BottomNavBar active="cart"/>
    </div>
  );
}

// ── Empty: Search / Results ────────────────────────────────
function EmptyResults() {
  return (
    <div className="rs-app">
      <ScreenHeader title="Headphones"/>
      <EmptyState
        icon={<Icon.Search size={28}/>}
        title="No matches for that filter"
        body="Try clearing the rating filter or expanding your price range."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="md">Clear filters</Button>
            <Button variant="primary" size="md">Browse audio</Button>
          </div>
        }
      />
    </div>
  );
}

// ── Empty: Orders ──────────────────────────────────────────
function EmptyOrders() {
  return (
    <div className="rs-app">
      <ScreenHeader title="Orders" back={false}/>
      <EmptyState
        icon={<Icon.Box size={28}/>}
        title="No orders yet"
        body="Anything you buy will appear here with full tracking, receipts and return options."
        action={<Button variant="primary" size="md">Discover products</Button>}
      />
      <BottomNavBar active="orders"/>
    </div>
  );
}

// ── Error: Network ─────────────────────────────────────────
function ErrorNetwork() {
  return (
    <div className="rs-app">
      <ScreenHeader title="Orders" back={false}/>
      <ErrorBanner
        title="No connection"
        body="Check your internet and try again. We saved your filters."
        onRetry={() => {}}
      />
      <EmptyState
        icon={<Icon.Wifi size={28}/>}
        title="Connection lost"
        body="We couldn\u2019t reach the server. Pull down to retry, or come back in a moment."
        action={<Button variant="primary" size="md" leading={<Icon.Refresh size={16}/>}>Retry</Button>}
      />
      <BottomNavBar active="orders"/>
    </div>
  );
}

// ── Error: Payment failed (in-flow) ─────────────────────────
function ErrorPayment() {
  return (
    <div className="rs-app">
      <ScreenHeader title="Checkout" subtitle="Payment"/>
      <div className="rs-scroll" style={{ padding: '12px var(--screen-h)' }}>
        <div style={{
          padding: 14, borderRadius: 'var(--radius-md)',
          background: 'var(--danger-tint)',
          border: '1px solid #F4C5CC',
          display: 'flex', gap: 12, marginBottom: 14,
        }}>
          <span style={{ color: 'var(--danger)', paddingTop: 2 }}>{Icon.AlertC({ size: 20 })}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Payment couldn\u2019t go through</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.4 }}>
              Your card was declined by the bank. No charge was made. Try a different method or contact your bank.
            </div>
          </div>
        </div>

        {['Card ending 4912','UPI · aarav@oksbi','Net banking'].map((m, i) => (
          <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', marginBottom: 8 }}>
            <Icon.Card size={20}/>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{m}</div>
            {i === 0 && <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>Declined</span>}
            <span style={{ width: 18, height: 18, borderRadius: 999, border: '1.5px solid var(--ink-4)' }}/>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px var(--screen-h) 20px', borderTop: '1px solid var(--line)' }}>
        <Button variant="primary" size="lg" full>Try a different method</Button>
      </div>
    </div>
  );
}

Object.assign(window, { SkelHome, SkelProduct, EmptyCart, EmptyResults, EmptyOrders, ErrorNetwork, ErrorPayment });
