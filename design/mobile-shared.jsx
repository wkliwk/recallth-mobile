// Mobile shared tokens + components for Recallth

const MT = {
  ...T,
  pad: 16,
  padL: 20,
  radiusCard: 16,
  tabH: 82,
};

// ── Bottom Tab Bar ──
function TabBar({ active, onNavigate }) {
  const tabs = [
    { id: "dashboard", label: "Summary", icon: "◉" },
    { id: "chat", label: "Chat", icon: "◎" },
    { id: "cabinet", label: "Cabinet", icon: "◇" },
    { id: "insights", label: "Trends", icon: "△" },
  ];
  return (
    <div style={{
      display: "flex", justifyContent: "space-around", alignItems: "flex-start",
      paddingTop: 8, paddingBottom: 28,
      borderTop: `1px solid ${T.border}`,
      background: "rgba(245,245,240,0.92)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      position: "relative", zIndex: 10,
      flexShrink: 0,
    }}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <TabBarItem key={tab.id} isActive={isActive} onClick={() => onNavigate(tab.id)} icon={tab.icon} label={tab.label}/>
        );
      })}
    </div>
  );
}

function TabBarItem({ isActive, onClick, icon, label }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        padding: "4px 12px", cursor: "pointer",
        minWidth: 64,
      }}
    >
      <span style={{
        fontSize: 20,
        color: isActive ? T.accent : T.dim,
        transition: "color 0.2s",
      }}>{icon}</span>
      <span style={{
        fontSize: 10, fontWeight: isActive ? 600 : 500,
        color: isActive ? T.accent : T.muted,
        transition: "color 0.2s",
      }}>{label}</span>
    </div>
  );
}

// ── Mobile Topbar ──
function MobileTopbar({ title, sub, right }) {
  return (
    <div style={{ padding: `14px ${MT.padL}px 10px` }}>
      {sub && <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{sub}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</div>
        {right && <div style={{ display: "flex", gap: 8 }}>{right}</div>}
      </div>
    </div>
  );
}

// ── Mobile Card ──
function MCard({ children, style, onClick, active }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.surface,
        borderRadius: MT.radiusCard,
        border: `1px solid ${active ? T.accent : T.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >{children}</div>
  );
}

// ── Mobile Skeleton ──
function MSkeleton({ w = "100%", h = 14, r = 6, style }) {
  return <div style={{
    width: w, height: h, borderRadius: r,
    background: `linear-gradient(90deg, ${T.border} 0%, #f0ede4 40%, ${T.border} 100%)`,
    backgroundSize: "800px 100%",
    animation: "shimmer 1.6s ease-in-out infinite",
    ...style,
  }}/>;
}

Object.assign(window, {
  MT, TabBar, MobileTopbar, MCard, MSkeleton,
});
