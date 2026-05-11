// Shared tokens, components, hooks for the B·Health prototype

const T = {
  bg: "#f5f5f0",
  surface: "#ffffff",
  border: "#e7e5dc",
  borderStrong: "#d6d3c4",
  text: "#1c1c1e",
  muted: "#6b6b70",
  dim: "#a8a8a8",
  accent: "#ed8547",
  accentLight: "#fdf0e6",
  accentDark: "#c66a2e",
  ok: "#2d9d5a",
  okLight: "#e8f7ee",
  warn: "#c4880f",
  warnLight: "#fef6e0",
  danger: "#b91c1c",
  dangerLight: "#fde8e8",
  font: "Inter, sans-serif",
  mono: "JetBrains Mono, monospace",
  radius: 14,
  radiusSm: 8,
};

// ── Skeleton ──
function Skeleton({ w = "100%", h = 16, r = 6, style }) {
  return <div style={{
    width: w, height: h, borderRadius: r,
    background: `linear-gradient(90deg, ${T.border} 0%, #f0ede4 40%, ${T.border} 100%)`,
    backgroundSize: "800px 100%",
    animation: "shimmer 1.6s ease-in-out infinite",
    ...style,
  }}/>;
}

// ── Card ──
function Card({ children, style, hover = true, onClick, active }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      onClick={onClick}
      style={{
        background: T.surface,
        borderRadius: T.radius,
        border: `1px solid ${active ? T.accent : T.border}`,
        boxShadow: hovered && hover ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 2px rgba(0,0,0,0.02)",
        transition: "box-shadow 0.2s, border-color 0.2s",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >{children}</div>
  );
}

// ── Pill ──
function Pill({ color, bg, children }) {
  return <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 10px", borderRadius: 999,
    background: bg || `${color}1a`,
    color: color,
    fontSize: 12, fontWeight: 500,
  }}>{children}</span>;
}

// ── Dot ──
function Dot({ c, s = 7 }) {
  return <span style={{ width: s, height: s, borderRadius: "50%", background: c, display: "inline-block", flexShrink: 0 }}/>;
}

// ── Button ──
function Btn({ children, primary, small, onClick, style }) {
  const [hov, setHov] = React.useState(false);
  const [press, setPress] = React.useState(false);
  return (
    <button
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setPress(false);}}
      onMouseDown={()=>setPress(true)} onMouseUp={()=>setPress(false)}
      onClick={onClick}
      style={{
        height: small ? 30 : 36,
        padding: small ? "0 12px" : "0 18px",
        background: primary ? (press ? T.accentDark : hov ? "#d9772e" : T.accent) : (hov ? T.bg : T.surface),
        color: primary ? "#fff" : T.text,
        border: primary ? "none" : `1px solid ${T.border}`,
        borderRadius: T.radiusSm,
        fontSize: small ? 12 : 13,
        fontWeight: 600,
        fontFamily: T.font,
        cursor: "pointer",
        transition: "background 0.15s, transform 0.1s",
        transform: press ? "scale(0.97)" : "scale(1)",
        ...style,
      }}
    >{children}</button>
  );
}

// ── Checkbox ──
function Check({ checked, onChange }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      onClick={()=>onChange && onChange(!checked)}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        border: checked ? "none" : `1.5px solid ${hov ? T.accent : T.borderStrong}`,
        background: checked ? T.accent : (hov ? T.accentLight : "transparent"),
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.15s",
        color: "#fff", fontSize: 14,
      }}
    >{checked ? "✓" : ""}</div>
  );
}

// ── Sidebar ──
function Sidebar({ active, onNavigate }) {
  const items = [
    { id: "dashboard", label: "Summary", icon: "◉" },
    { id: "chat", label: "Chat", icon: "◎" },
    { id: "cabinet", label: "Cabinet", icon: "◇" },
    { id: "schedule", label: "Schedule", icon: "▦" },
    { id: "insights", label: "Trends", icon: "△" },
    { id: "history", label: "History", icon: "▤" },
  ];
  return (
    <div style={{ width: 200, borderRight: `1px solid ${T.border}`, padding: "22px 14px", fontFamily: T.font, fontSize: 14, display: "flex", flexDirection: "column", height: "100%", background: T.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", marginBottom: 4 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: T.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>R</div>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>recallth</span>
      </div>
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(it => {
          const isActive = it.id === active;
          return (
            <SidebarItem key={it.id} isActive={isActive} onClick={() => onNavigate(it.id)}>
              <span style={{ fontSize: 14, opacity: 0.7, width: 20, textAlign: "center" }}>{it.icon}</span>
              {it.label}
            </SidebarItem>
          );
        })}
      </div>
      <div style={{ marginTop: "auto", padding: "12px 10px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.borderStrong }}/>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>You</div>
            <div style={{ fontSize: 11, color: T.muted }}>Free plan</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ isActive, onClick, children }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 10px", borderRadius: 8,
        background: isActive ? T.surface : (hov ? "rgba(255,255,255,0.5)" : "transparent"),
        color: isActive ? T.text : T.muted,
        fontWeight: isActive ? 600 : 500,
        border: isActive ? `1px solid ${T.border}` : "1px solid transparent",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >{children}</div>
  );
}

// ── Topbar ──
function Topbar({ title, sub, children }) {
  return (
    <div style={{ padding: "22px 32px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          {sub && <div style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}>{sub}</div>}
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, letterSpacing: "-0.02em" }}>{title}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>{children}</div>
      </div>
    </div>
  );
}

// ── FadeIn wrapper ──
function FadeIn({ delay = 0, children, style }) {
  return <div style={{ animation: `fadeIn 0.4s ease ${delay}s both`, ...style }}>{children}</div>;
}

// ── Empty state ──
function EmptyState({ icon, title, sub, action, onAction }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 14, color: T.muted, marginTop: 6, maxWidth: 360, lineHeight: 1.5 }}>{sub}</div>
      {action && <Btn primary onClick={onAction} style={{ marginTop: 20 }}>{action}</Btn>}
    </div>
  );
}

Object.assign(window, {
  T, Skeleton, Card, Pill, Dot, Btn, Check, Sidebar, Topbar, FadeIn, EmptyState
});
