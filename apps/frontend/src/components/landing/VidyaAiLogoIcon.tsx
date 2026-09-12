import React from "react";

interface VidyaAiLogoIconProps {
  className?: string;
}

export default function VidyaAiLogoIcon({ className = "w-9 h-9" }: VidyaAiLogoIconProps) {
  return (
    <img
      src="/logo.png"
      alt="VidyaAI Logo"
      className={`${className} object-contain`}
    />
  );
}
