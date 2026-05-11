// Chat screen — mid-fi with typing animation, hover states, skeleton

function ChatSkeleton() {
  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ alignSelf: "flex-end", maxWidth: "50%" }}>
        <Skeleton w={240} h={44} r={12}/>
      </div>
      <div style={{ maxWidth: "70%" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <Skeleton w={22} h={22} r={7}/>
          <Skeleton w={80} h={12}/>
        </div>
        <Skeleton w="100%" h={180} r={12}/>
      </div>
    </div>
  );
}

function ChatEmpty({ onStart }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◎</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>有咩想問？</div>
      <div style={{ fontSize: 14, color: T.muted, marginTop: 8, maxWidth: 400, textAlign: "center", lineHeight: 1.5 }}>
        I know your supplements, your goals, your schedule. Skip the preamble — just ask.
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
        {["Can I take iron with calcium?", "我瞓唔好，有咩建議？", "Prep questions for my doctor"].map(q => (
          <SuggestChip key={q} onClick={() => onStart(q)}>{q}</SuggestChip>
        ))}
      </div>
    </div>
  );
}

function SuggestChip({ children, onClick }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "8px 14px", borderRadius: 20,
        border: `1px solid ${hov ? T.accent : T.border}`,
        background: hov ? T.accentLight : T.surface,
        fontSize: 13, color: T.text, cursor: "pointer",
        transition: "all 0.15s",
      }}
    >{children}</div>
  );
}

function ChatFull() {
  const [messages, setMessages] = React.useState([
    { role: "user", text: "食緊 ashwagandha, 可唔可以同 SSRI 一齊食?" },
    {
      role: "ai",
      text: null, // structured
      structured: true,
    },
  ]);
  const [input, setInput] = React.useState("");
  const [typing, setTyping] = React.useState(false);

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { role: "ai", text: "收到！等我 check 你個 stack 先… 依家暫時未見到衝突。如果你有其他 concern, 隨時問。" }]);
    }, 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* header */}
      <div style={{ padding: "18px 32px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Chat</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Context: 8 supplements · 3 goals · 30d history</div>
        </div>
        <Btn small>+ New thread</Btn>
      </div>

      {/* messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        {messages.map((msg, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            {msg.role === "user" ? (
              <UserBubble text={msg.text}/>
            ) : msg.structured ? (
              <AIStructuredResponse/>
            ) : (
              <AIBubble text={msg.text}/>
            )}
          </FadeIn>
        ))}
        {typing && (
          <FadeIn>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, background: T.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>R</div>
              <TypingDots/>
            </div>
          </FadeIn>
        )}
      </div>

      {/* input */}
      <div style={{ padding: "14px 32px 22px", borderTop: `1px solid ${T.border}` }}>
        <ChatInput value={input} onChange={setInput} onSend={sendMessage}/>
      </div>
    </div>
  );
}

function UserBubble({ text }) {
  return (
    <div style={{ alignSelf: "flex-end", maxWidth: "60%", marginLeft: "auto" }}>
      <Card style={{ padding: "12px 16px", background: T.accent, border: "none", borderRadius: "16px 16px 4px 16px", color: "#fff", fontSize: 14, lineHeight: 1.5 }} hover={false}>
        {text}
      </Card>
      <div style={{ fontSize: 10, color: T.dim, marginTop: 4, textAlign: "right" }}>Just now</div>
    </div>
  );
}

function AIBubble({ text }) {
  return (
    <div style={{ maxWidth: "75%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 22, height: 22, borderRadius: 7, background: T.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>R</div>
        <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>recallth</span>
      </div>
      <Card style={{ padding: "14px 18px", fontSize: 14, lineHeight: 1.55 }} hover={false}>
        {text}
      </Card>
    </div>
  );
}

function AIStructuredResponse() {
  return (
    <div style={{ maxWidth: "75%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 22, height: 22, borderRadius: 7, background: T.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>R</div>
        <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>recallth</span>
      </div>
      <Card style={{ padding: 18 }} hover={false}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Pill color={T.warn} bg={T.warnLight}><Dot c={T.warn} s={6}/>Caution</Pill>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Potential interaction</span>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.6, marginTop: 10, color: T.muted }}>
          Ashwagandha has mild serotonergic activity. Combined with an SSRI the risk at 600 mg is low, but worth flagging with your prescriber.
        </div>

        {/* evidence card */}
        <Card style={{ marginTop: 14, padding: 14, background: T.bg, border: "none" }} hover={false}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, fontSize: 13 }}>
            <div>
              <div style={{ color: T.muted, fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Evidence</div>
              <div style={{ fontSize: 17, fontWeight: 600, marginTop: 4 }}>Moderate</div>
            </div>
            <div>
              <div style={{ color: T.muted, fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Studies</div>
              <div style={{ fontSize: 17, fontWeight: 600, marginTop: 4 }}>3 RCTs</div>
            </div>
            <div>
              <div style={{ color: T.muted, fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Risk @ 600mg</div>
              <div style={{ fontSize: 17, fontWeight: 600, marginTop: 4, color: T.ok }}>Low</div>
            </div>
          </div>
        </Card>

        <div style={{ fontSize: 13, marginTop: 14, color: T.muted }}>
          I don't see an SSRI in your cabinet — would you like to add it?
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {["Add SSRI to cabinet", "Prep doctor questions", "Show 3 sources"].map(x => (
            <ActionChip key={x}>{x}</ActionChip>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ActionChip({ children, onClick }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        height: 32, padding: "0 14px",
        background: hov ? T.bg : T.surface,
        border: `1px solid ${hov ? T.accent : T.border}`,
        borderRadius: 8, fontSize: 12, fontWeight: 500,
        color: T.text, cursor: "pointer",
        transition: "all 0.15s",
      }}
    >{children}</button>
  );
}

function ChatInput({ value, onChange, onSend }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <Card style={{
      padding: "10px 14px",
      display: "flex", alignItems: "center", gap: 10,
      border: `1.5px solid ${focused ? T.accent : T.borderStrong}`,
      transition: "border-color 0.2s",
    }} hover={false}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => e.key === "Enter" && onSend()}
        placeholder="Ask anything — I remember your stack"
        style={{
          flex: 1, border: "none", outline: "none", background: "transparent",
          fontSize: 14, fontFamily: T.font, color: T.text,
        }}
      />
      <Btn primary small onClick={onSend}>Send</Btn>
    </Card>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "8px 12px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: T.dim,
          animation: `popIn 0.6s ease ${i * 0.15}s infinite alternate`,
        }}/>
      ))}
    </div>
  );
}

function Chat({ state }) {
  const [chatState, setChatState] = React.useState(state === "empty" ? "empty" : "full");

  if (state === "loading") return <ChatSkeleton/>;
  if (chatState === "empty") return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "18px 32px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Chat</div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Context loaded</div>
      </div>
      <ChatEmpty onStart={() => setChatState("full")}/>
      <div style={{ padding: "14px 32px 22px", borderTop: `1px solid ${T.border}` }}>
        <ChatInput value="" onChange={() => setChatState("full")} onSend={() => setChatState("full")}/>
      </div>
    </div>
  );
  return <ChatFull/>;
}

Object.assign(window, { Chat });
