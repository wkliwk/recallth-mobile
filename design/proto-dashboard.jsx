// Dashboard screen — mid-fi, with loading skeleton + empty→data states

const SCHEDULE_DATA = [
  { time: "08:00", name: "Vitamin D3", dose: "2000 IU", status: "taken", takenAt: "8:03 AM" },
  { time: "08:00", name: "Omega-3 EPA/DHA", dose: "1000 mg", status: "taken", takenAt: "8:03 AM" },
  { time: "08:00", name: "Creatine monohydrate", dose: "5 g", status: "taken", takenAt: "8:05 AM" },
  { time: "12:30", name: "Magnesium glycinate", dose: "200 mg", status: "due" },
  { time: "12:30", name: "B-complex", dose: "1 cap", status: "due" },
  { time: "18:00", name: "Caffeine + L-theanine", dose: "100 + 200 mg", status: "scheduled" },
  { time: "22:30", name: "Ashwagandha KSM-66", dose: "600 mg", status: "scheduled" },
];

// Skeleton version
function DashboardSkeleton() {
  return (
    <div style={{ padding: "22px 32px" }}>
      <Skeleton w={120} h={14} style={{ marginBottom: 8 }}/>
      <Skeleton w={200} h={28} style={{ marginBottom: 24 }}/>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
        {[0,1,2].map(i => (
          <Card key={i} hover={false} style={{ padding: 20 }}>
            <Skeleton w={80} h={12}/>
            <Skeleton w={60} h={36} style={{ marginTop: 8 }}/>
            <Skeleton w={100} h={12} style={{ marginTop: 8 }}/>
          </Card>
        ))}
      </div>
      <Card hover={false} style={{ padding: 0 }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
          <Skeleton w={100} h={14}/>
        </div>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "32px 1fr 120px 100px", padding: "14px 18px", borderBottom: `1px solid ${T.border}`, gap: 12, alignItems: "center" }}>
            <Skeleton w={22} h={22} r={6}/>
            <Skeleton w="70%" h={14}/>
            <Skeleton w={80} h={14}/>
            <Skeleton w={60} h={22} r={11}/>
          </div>
        ))}
      </Card>
    </div>
  );
}

// Empty state
function DashboardEmpty({ onAdd }) {
  return (
    <div style={{ padding: "22px 32px" }}>
      <Topbar title="Summary" sub="Welcome to recallth"/>
      <div style={{ marginTop: 32 }}>
        <EmptyState
          icon="◇"
          title="你嘅 supplement cabinet 仲係空嘅"
          sub="Add your first supplement — 自由寫就得，AI 幫你 parse。"
          action="+ Add first supplement"
          onAction={onAdd}
        />
      </div>
    </div>
  );
}

// Full dashboard with data
function DashboardFull({ onNavigate }) {
  const [items, setItems] = React.useState(SCHEDULE_DATA);
  const taken = items.filter(x => x.status === "taken").length;
  const total = items.length;

  const toggleDose = (idx) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      if (it.status === "taken") return { ...it, status: "due", takenAt: undefined };
      return { ...it, status: "taken", takenAt: new Date().toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" }) };
    }));
  };

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", height: "100%" }}>
      <Topbar title="Summary" sub="Wednesday · 24 April">
        <Btn small>Export</Btn>
        <Btn primary small>+ Log dose</Btn>
      </Topbar>

      {/* Stat cards */}
      <FadeIn delay={0.05}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 20, padding: "0" }}>
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: T.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Today's doses</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.03em" }}>{taken}</span>
              <span style={{ fontSize: 18, color: T.muted }}>of {total}</span>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
              {items.map((it, i) => (
                <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: it.status === "taken" ? T.accent : T.border, transition: "background 0.3s" }}/>
              ))}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>
              {taken < total ? `Next: ${items.find(x => x.status !== "taken")?.name} · ${items.find(x => x.status !== "taken")?.time}` : "All done for today ✓"}
            </div>
          </Card>

          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: T.warn, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Adherence</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.03em" }}>84</span>
              <span style={{ fontSize: 22, color: T.muted, fontWeight: 600 }}>%</span>
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>30 day average · ▲ 3 vs prior</div>
          </Card>

          <Card style={{ padding: 20 }} onClick={() => onNavigate("cabinet")}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Active stack</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.03em" }}>8</span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 8 }}>
              <Pill color={T.warn} bg={T.warnLight}><Dot c={T.warn} s={6}/>2 conflicts</Pill>
            </div>
          </Card>
        </div>
      </FadeIn>

      {/* Schedule card */}
      <FadeIn delay={0.15}>
        <Card style={{ marginTop: 18 }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Schedule</div>
            <span style={{ fontSize: 13, color: T.accent, fontWeight: 500, cursor: "pointer" }}>Edit</span>
          </div>

          {["Morning · 08:00", "Midday · 12:30", "Evening · 18:00", "Night · 22:30"].map(blockLabel => {
            const blockTime = blockLabel.split(" · ")[1];
            const blockItems = items.filter(it => it.time === blockTime);
            if (blockItems.length === 0) return null;
            return (
              <React.Fragment key={blockLabel}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", background: T.bg }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{blockLabel.split(" · ")[0]}</div>
                  <div style={{ fontSize: 12, color: T.muted, fontFamily: T.mono }}>{blockTime}</div>
                </div>
                {blockItems.map((r, ri) => {
                  const idx = items.indexOf(r);
                  return (
                    <ScheduleRow key={idx} item={r} onToggle={() => toggleDose(idx)} isLast={ri === blockItems.length - 1}/>
                  );
                })}
              </React.Fragment>
            );
          })}
        </Card>
      </FadeIn>

      {/* AI suggestion */}
      <FadeIn delay={0.25}>
        <Card style={{ marginTop: 14, padding: "14px 18px", background: T.accentLight, border: `1px solid ${T.accent}30` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Pill color={T.accent} bg={T.accent}><span style={{ color: "#fff", fontWeight: 600 }}>AI</span></Pill>
            <span style={{ fontSize: 13, color: T.text }}>你 Wed noon skip 最多 B-complex。建議 move 去 morning block。</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <Btn primary small>Apply</Btn>
              <Btn small>Dismiss</Btn>
            </div>
          </div>
        </Card>
      </FadeIn>
    </div>
  );
}

function ScheduleRow({ item, onToggle, isLast }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "grid", gridTemplateColumns: "32px 1fr 120px 120px",
        padding: "13px 18px",
        borderBottom: isLast ? "none" : `1px solid ${T.border}`,
        alignItems: "center",
        background: hov ? "rgba(237,133,71,0.03)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      <Check checked={item.status === "taken"} onChange={onToggle}/>
      <div style={{ fontWeight: 500, color: item.status === "taken" ? T.muted : T.text, textDecoration: item.status === "taken" ? "line-through" : "none", transition: "all 0.2s" }}>
        {item.name}
      </div>
      <div style={{ color: T.muted, fontSize: 13 }}>{item.dose}</div>
      <div>
        {item.status === "taken" && <span style={{ fontSize: 12, color: T.muted }}>Taken · {item.takenAt}</span>}
        {item.status === "due" && <Pill color={T.warn} bg={T.warnLight}><Dot c={T.warn} s={6}/>Due now</Pill>}
        {item.status === "scheduled" && <span style={{ fontSize: 12, color: T.dim }}>Scheduled</span>}
      </div>
    </div>
  );
}

function Dashboard({ state, onNavigate }) {
  if (state === "loading") return <DashboardSkeleton/>;
  if (state === "empty") return <DashboardEmpty onAdd={() => onNavigate("cabinet")}/>;
  return <DashboardFull onNavigate={onNavigate}/>;
}

Object.assign(window, { Dashboard });
