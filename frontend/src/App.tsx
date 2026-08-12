function App() {
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <aside
        style={{
          width: 260,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
        }}
      />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>MyTwinAI</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Theme check — heading + body fonts, colors.</p>
        </div>
      </main>
    </div>
  )
}

export default App
