import { ImageResponse } from "next/og";

export const alt = "SMMaroc - Panel Réseaux Sociaux au Maroc";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#06080F",
          backgroundImage: "radial-gradient(circle at 25% 25%, #1A1D2D 0%, #06080F 70%)",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
          color: "#FFFFFF",
        }}
      >
        {/* Top Header Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#FF5A36",
              color: "#FFFFFF",
              fontWeight: 900,
              fontSize: "24px",
            }}
          >
            S
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px" }}>
              SMM<span style={{ color: "#FF5A36" }}>aroc</span>
            </span>
            <span style={{ fontSize: "14px", color: "#BFAEA0", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>
              Panel Réseaux Sociaux Professionnel
            </span>
          </div>
        </div>

        {/* Central Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "900px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255, 90, 54, 0.15)",
              border: "1px solid rgba(255, 90, 54, 0.4)",
              borderRadius: "999px",
              padding: "8px 20px",
              color: "#FF5A36",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            N°1 au Maroc • Tarifs Directs en MAD (Dirhams)
          </div>

          <h1
            style={{
              fontSize: "56px",
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#FAF7F2",
              margin: 0,
              letterSpacing: "-1.5px",
            }}
          >
            Développez votre visibilité Instagram, TikTok &amp; YouTube.
          </h1>

          <p
            style={{
              fontSize: "22px",
              lineHeight: 1.4,
              color: "#C4B5A5",
              margin: 0,
              fontWeight: 400,
            }}
          >
            Abonnés, likes, vues et interactions ciblées avec livraison rapide et support client WhatsApp dédié au Maroc.
          </p>
        </div>

        {/* Bottom Bar Features */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            paddingTop: "28px",
          }}
        >
          <div style={{ display: "flex", gap: "32px", fontSize: "16px", color: "#FAF7F2", fontWeight: 600 }}>
            <span>• Paiements Locaux (CIH, Attijari)</span>
            <span>• Devis Transparent en MAD</span>
            <span>• API Revendeur Sécurisée</span>
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#FF5A36" }}>
            smmaroc.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
