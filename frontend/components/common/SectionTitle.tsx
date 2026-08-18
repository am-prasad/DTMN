import { cn } from "@/lib/utils";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  className?: string;
    id?: string;
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  center = false,
  className,
}: SectionTitleProps) {
  return (
    <div className={cn(center && "text-center", className)}>
      {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
      <h2 className="section-title">{title}</h2>
      {subtitle && (
        <p className={cn("section-subtitle", center && "mx-auto")}>{subtitle}</p>
      )}
    </div>
  );
}
