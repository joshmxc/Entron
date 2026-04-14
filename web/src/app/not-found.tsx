export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p style={{ fontSize: "5rem", fontWeight: "800", color: "#1e3a8a", lineHeight: 1 }}>404</p>
        <p style={{ fontSize: "1.125rem", fontWeight: "600", marginTop: "0.5rem", color: "var(--text)" }}>Ukurasa haukupatikana</p>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Page not found</p>
        <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", marginTop: "1.5rem", padding: "0.5rem 1.25rem", backgroundColor: "#1e3a8a", color: "white", borderRadius: "0.5rem", fontWeight: "600", fontSize: "0.875rem", textDecoration: "none" }}>
          Rudi Nyumbani
        </a>
      </div>
    </div>
  );
}
