import { ImageResponse } from "next/og";

export const alt = "WallAI: a public message wall moderated by AI consensus on GenLayer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const cards = [
  { who: "@demo_bb9e", text: "gm builders! Shipping AI-moderated social on GenLayer today.", tag: "APPROVED", color: "#6ee7b7" },
  { who: "@friend", text: "Congrats on the launch!", tag: "12 likes · 3 replies", color: "#f9a8d4" },
  { who: "0x1A8D…DBa8", text: "Rejected: scam link and insults", tag: "REJECTED", color: "#fda4af" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 64,
          background: "radial-gradient(900px 500px at 0% 0%, rgba(139,92,246,0.35), transparent 60%), #09090b",
          color: "#f4f4f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 620, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "rgba(139,92,246,0.25)",
                border: "2px solid rgba(167,139,250,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                fontWeight: 700,
                color: "#c4b5fd",
              }}
            >
              W
            </div>
            <div style={{ fontSize: 64, fontWeight: 700 }}>WallAI</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 32, fontSize: 46, fontWeight: 600, lineHeight: 1.15 }}>
            <span>A public wall,</span>
            <span style={{ color: "#c4b5fd" }}>moderated by AI consensus.</span>
          </div>
          <div style={{ marginTop: 24, fontSize: 26, color: "#a1a1aa", lineHeight: 1.4 }}>
            Live consensus status · likes & replies · handles · leaderboard · appeals. Built on GenLayer.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 20, marginLeft: 48, width: 420 }}>
          {cards.map((c) => (
            <div
              key={c.who}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: 22,
                borderRadius: 20,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20 }}>
                <span style={{ color: "#d4d4d8" }}>{c.who}</span>
                <span style={{ color: c.color }}>{c.tag}</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 22, color: "#f4f4f5" }}>{c.text}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
