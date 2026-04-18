import { TrendingUp } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export function Logo({ size = "md" }: LogoProps) {
  const sizes = {
    sm: { box: "h-8 w-8", icon: "h-5 w-5", text: "text-xl" },
    md: { box: "h-12 w-12", icon: "h-7 w-7", text: "text-3xl" },
    lg: { box: "h-16 w-16", icon: "h-10 w-10", text: "text-5xl" },
  }[size];

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizes.box} grid place-items-center rounded-lg bg-gradient-primary text-primary-foreground glow-primary`}>
        <TrendingUp className={sizes.icon} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-extrabold tracking-tight ${sizes.text}`}>
          Stock<span className="text-primary">Quest</span>
        </span>
        {size !== "sm" && (
          <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Learn the markets
          </span>
        )}
      </div>
    </div>
  );
}
