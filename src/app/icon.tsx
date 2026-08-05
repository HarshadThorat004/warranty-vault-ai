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
          background: "#22D3EE",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 20,
            height: 22,
            background: "#0A0A0A",
            borderRadius: "10px 10px 6px 6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 8,
              height: 7,
              background: "#22D3EE",
              borderRadius: 2,
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
