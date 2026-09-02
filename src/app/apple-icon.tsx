import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050607",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            width: 118,
            height: 128,
            background:
              "linear-gradient(160deg, #3A3F4A 0%, #1C1F26 40%, #0E1014 75%, #07080A 100%)",
            borderRadius: "58px 58px 32px 32px",
            border: "2px solid rgba(34,211,238,0.3)",
            boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 52,
              height: 32,
              borderLeft: "14px solid #22D3EE",
              borderBottom: "14px solid #22D3EE",
              transform: "rotate(-45deg) translate(4px, -4px)",
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
