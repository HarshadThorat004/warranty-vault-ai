import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 22,
            height: 24,
            background:
              "linear-gradient(160deg, #3A3F4A 0%, #16181E 50%, #08090C 100%)",
            borderRadius: "11px 11px 6px 6px",
            border: "1px solid rgba(34,211,238,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 10,
              height: 6,
              borderLeft: "2.5px solid #22D3EE",
              borderBottom: "2.5px solid #22D3EE",
              transform: "rotate(-45deg) translate(1px, -1px)",
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
