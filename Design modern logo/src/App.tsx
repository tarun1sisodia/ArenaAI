import SKBaghelLogo from "./components/SKBaghelLogo";

function Section({
  bg,
  label,
  labelColor,
  dividerColor,
  children,
}: {
  bg: string;
  label: string;
  labelColor: string;
  dividerColor: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{ background: bg, padding: "72px 40px" }}
    >
      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: labelColor,
          textAlign: "center",
          marginBottom: 56,
          opacity: 0.7,
        }}
      >
        {label}
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 56,
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Divider({ color }: { color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: 180,
      }}
    >
      <div style={{ flex: 1, height: "0.5px", background: color, opacity: 0.25 }} />
      <div
        style={{
          width: 4,
          height: 4,
          background: color,
          transform: "rotate(45deg)",
          opacity: 0.4,
        }}
      />
      <div style={{ flex: 1, height: "0.5px", background: color, opacity: 0.25 }} />
    </div>
  );
}

export default function App() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Dark Navy ── */}
      <Section bg="#0c1120" label="Primary · Dark Navy Ground" labelColor="#c8a050" dividerColor="#c8a050">
        <SKBaghelLogo variant="stacked" theme="dark" />
        <Divider color="#c8a050" />
        <SKBaghelLogo variant="horizontal" theme="dark" />
        <Divider color="#c8a050" />
        <SKBaghelLogo variant="emblem" theme="dark" />
      </Section>

      {/* ── Cream / Light ── */}
      <Section bg="#f4efe4" label="Reversed · Warm Cream Ground" labelColor="#6b5a3a" dividerColor="#a07830">
        <SKBaghelLogo variant="stacked" theme="light" />
        <Divider color="#a07830" />
        <SKBaghelLogo variant="horizontal" theme="light" />
        <Divider color="#a07830" />
        <SKBaghelLogo variant="emblem" theme="light" />
      </Section>

      {/* ── Gold field ── */}
      <Section
        bg="linear-gradient(160deg, #c09040 0%, #a07028 55%, #c8a050 100%)"
        label="Premium · Gold Field"
        labelColor="#0c112088"
        dividerColor="#0c1120"
      >
        <SKBaghelLogo variant="stacked" theme="gold" />
        <Divider color="#0c1120" />
        <SKBaghelLogo variant="horizontal" theme="gold" />
        <Divider color="#0c1120" />
        <SKBaghelLogo variant="emblem" theme="gold" />
      </Section>
    </div>
  );
}
