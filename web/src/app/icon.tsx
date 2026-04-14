import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: "#1e3a8a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Home icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 12L12 4L21 12V21H15V15H9V21H3V12Z" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
