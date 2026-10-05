import { addressHue } from "@/lib/format";

export function Avatar({ address, size = 32 }: { address: string; size?: number }) {
  const hue = addressHue(address);
  return (
    <div
      className="shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue} 70% 65%), hsl(${(hue + 60) % 360} 70% 45%))`,
      }}
    />
  );
}
