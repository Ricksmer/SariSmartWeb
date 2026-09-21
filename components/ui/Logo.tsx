import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "stacked";
  theme?: "light" | "dark" | "mint";
}

export default function Logo({
  className = "",
  size = "md",
  variant = "full",
  theme = "light",
}: LogoProps) {
  // Dimensions map
  const dimensions = {
    sm: { icon: 26, text: "text-lg", h: 26 },
    md: { icon: 34, text: "text-xl", h: 34 },
    lg: { icon: 44, text: "text-2xl", h: 44 },
    xl: { icon: 58, text: "text-3xl", h: 58 },
  }[size];

  const iconSrc =
    theme === "dark"
      ? "/logo-icon-white.png"
      : theme === "mint"
      ? "/logo-icon-mint.png"
      : "/logo-icon-green.png";

  if (variant === "icon") {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <Image
          src={iconSrc}
          alt="SariSmart Logo"
          width={dimensions.icon}
          height={dimensions.icon}
          className="object-contain drop-shadow-sm transition-transform duration-200 hover:scale-105"
          priority
        />
      </div>
    );
  }

  if (variant === "stacked") {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <Image
          src={iconSrc}
          alt="SariSmart Logo"
          width={dimensions.icon * 1.3}
          height={dimensions.icon * 1.3}
          className="object-contain drop-shadow-md"
          priority
        />
        <div className="flex items-baseline tracking-tight font-black font-sans leading-none">
          <span className={theme === "dark" ? "text-emerald-300" : "text-[#1a7949]"}>Sari</span>
          <span className={theme === "dark" ? "text-white" : "text-[#161d26]"}>Smart</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative flex items-center justify-center shrink-0">
        <Image
          src={iconSrc}
          alt="SariSmart Logo"
          width={dimensions.icon}
          height={dimensions.icon}
          className="object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
          priority
        />
      </div>
      <div className={`flex items-baseline font-black tracking-tight ${dimensions.text} font-sans leading-none`}>
        <span className={theme === "dark" ? "text-[#b7dec2]" : "text-[#1a7949]"}>Sari</span>
        <span className={theme === "dark" ? "text-white" : "text-[#161d26]"}>Smart</span>
      </div>
    </div>
  );
}
