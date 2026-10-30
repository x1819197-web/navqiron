import { iconSvg } from "@/lib/icons";

export function CategoryIcon({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      dangerouslySetInnerHTML={{ __html: iconSvg(name, size, 2.05) }}
    />
  );
}
