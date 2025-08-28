import { useEffect, useState } from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  alt?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: "w-32 h-14",
  md: "w-48 h-20", 
  lg: "w-64 h-28",
  xl: "w-[580px] h-[252px]"
};

export default function Logo({ 
  className = "", 
  size = "lg", 
  alt = "CashFlowIQ Logo",
  showText = false 
}: LogoProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const stored = localStorage.getItem("theme");
      const isDarkMode = stored === "dark" || 
        (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setIsDark(isDarkMode);
    };

    checkTheme();

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const hasDarkClass = document.documentElement.classList.contains("dark");
      setIsDark(hasDarkClass);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });

    return () => observer.disconnect();
  }, []);

  const logoSrc = isDark ? "/white logo" : "/dark logo";
  const baseClasses = `${sizeClasses[size]} object-contain transition-all duration-200`;

  if (showText) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <img 
          src={logoSrc}
          alt={alt}
          className={`${baseClasses} hover:scale-110`}
          loading="eager"
          decoding="async"
        />
        <h1 className="text-2xl font-bold text-foreground">CashFlowIQ</h1>
      </div>
    );
  }

  return (
    <img 
      src={logoSrc}
      alt={alt}
      className={`${baseClasses} ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}