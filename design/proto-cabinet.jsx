// Cabinet screen — mid-fi with skeleton, empty, full + hover/expand

const CABINET_DATA = [
  { name: "Vitamin D3", dose: "2000 IU", schedule: "Daily · Morning", evidence: "High", pct: 92, status: "ok", stock: 24 },
  { name: "Omega-3 EPA/DHA", dose: "1000 mg", schedule: "Daily · Morning", evidence: "High", pct: 95, status: "ok", stock: 30 },
  { name: "Creatine monohydrate", dose: "5 g", schedule: "Daily", evidence: "High", pct: 96, status: "ok", stock: 45 },
  { name: "Magnesium glycinate", dose: "200 mg", schedule: "Noon + Night", evidence: "Moderate", pct: 68, status: "ok", stock: 18 },
  { name: "Ashwagandha KSM-66", dose: "600 mg", schedule: "Night", evidence: "Moderate", pct: 58, status: "conflict", conflictNote: "Mild serotonergic — flag if taking SSRI" },
  { name: "L-theanine", dose: "200 mg", schedule: "With caffeine", evidence: "Moderate", pct: 62, status: "ok", stock: 40 },
  { name: "B-complex", dose: "1 cap", schedule: "Noon", evidence: "Limited", pct: 35, status: "ok", stock: 60 },
  { name: "Zinc picolinate", dose: "15 mg", schedule: "Noon", evidence: "Moderate", pct: 55, status: "conflict", conflictNote: "May reduce Mg absorption — space 2hrs" },
];

function CabinetSkeleton() {
  return (
    <div style={{ padding: "22px 32px" }}>
      <Skeleton w={100} h={14} style={{ marginBottom: 8 }}/>
      <Skeleton w={160} h={28} style={{ marginBottom: 24 }}/>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[0,1,2,3,4,5].map(i => (
          <Card key={i} hover={false} style={{ padding: 18, display: "flex", gap: 14 }}>
            <Skeleton w={56} h={56} r={12}/>
            <div style={{ flex: 1 }}>
              <Skeleton w="60%" h={16}/>
              <Skeleton w="40%" h={12} style={{ marginTop: 8 }}/>
              <Skeleton w="80%" h={6} r={3} style={{ marginTop: 14 }}/>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CabinetEmpty({ onAdd }) {
  return (
    <div style={{ padding: "22px 32px" }}>
      <Topbar title="Cabinet" sub="Your supplements"/>
      <div style={{ marginTop: 32 }}>
        <EmptyState
          icon="◇"
          title="Cabinet 仲係空嘅"
          sub="Add supplements — 用自然語言寫就得，e.g. 'vitamin d 2000IU 朝早食'"
          action="+ Add first supplement"
          onAction={onAdd}
        />
      </div>
    </div>
  );
}

function CabinetFull() {
  const [expanded, setExpanded] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);

  const filtered = CABINET_DATA.filter(it =>
    it.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "22px 0 0" }}>
        <div>
          <div style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}>
            {CABINET_DATA.length} active · {CABINET_DATA.filter(x => x.status === "conflict").length} conflicts
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, letterSpacing: "-0.02em" }}>Cabinet</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{
            height: 36, padding: "0 14px", minWidth: 240,
            background: T.surface,
            border: `1.5px solid ${searchFocused ? T.accent : T.border}`,
            borderRadius: T.radiusSm,
            display: "flex", alignItems: "center", gap: 8,
            transition: "border-color 0.2s",
          }}>
            <span style={{ color: T.dim, fontSize: 14 }}>⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search supplements"
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, fontFamily: T.font, color: T.text, flex: 1 }}
            />
          </div>
          <Btn primary>+ Add supplement</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}>
        {filtered.map((it, i) => (
          <FadeIn key={it.name} delay={i * 0.04}>
            <CabinetCard
              item={it}
              isExpanded={expanded === it.name}
              onToggle={() => setExpanded(expanded === it.name ? null : it.name)}
            />
          </FadeIn>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: T.muted, fontSize: 14 }}>
          No supplements match "{search}"
        </div>
      )}
    </div>
  );
}

function CabinetCard({ item, isExpanded, onToggle }) {
  const [hov, setHov] = React.useState(false);
  const barColor = item.evidence === "High" ? T.ok : item.evidence === "Moderate" ? T.accent : T.warn;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onToggle}
      style={{
        background: T.surface,
        borderRadius: T.radius,
        border: `1px solid ${isExpanded ? T.accent : T.border}`,
        boxShadow: hov ? "0 2px 10px rgba(0,0,0,0.06)" : "0 1px 2px rgba(0,0,0,0.02)",
        padding: 18,
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* icon placeholder */}
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: T.bg, border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: T.dim,
        }}>
          {item.name[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: T.text }}>{item.name}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{item.dose} · {item.schedule}</div>
            </div>
            {item.status === "conflict" && <Pill color={T.warn} bg={T.warnLight}><Dot c={T.warn} s={6}/>Conflict</Pill>}
          </div>

          {/* evidence bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
            <div style={{ flex: 1, height: 5, background: T.border, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${item.pct}%`, height: "100%", background: barColor, borderRadius: 3, transition: "width 0.5s ease" }}/>
            </div>
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 500, minWidth: 80, textAlign: "right" }}>{item.evidence}</span>
          </div>
        </div>
      </div>

      {/* expanded details */}
      {isExpanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}`, animation: "fadeIn 0.25s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 13 }}>
            <div>
              <div style={{ color: T.muted, fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Stock</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{item.stock} days</div>
            </div>
            <div>
              <div style={{ color: T.muted, fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Adherence</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>91%</div>
            </div>
            <div>
              <div style={{ color: T.muted, fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Since</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>Jan 14</div>
            </div>
          </div>
          {item.status === "conflict" && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: T.warnLight, borderRadius: 8, fontSize: 13, color: T.warn, lineHeight: 1.4 }}>
              ⚠ {item.conflictNote}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Btn small>Edit</Btn>
            <Btn small>History</Btn>
            <Btn small style={{ color: T.danger }}>Remove</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function Cabinet({ state }) {
  if (state === "loading") return <CabinetSkeleton/>;
  if (state === "empty") return <CabinetEmpty onAdd={() => {}}/>;
  return <CabinetFull/>;
}

Object.assign(window, { Cabinet });
