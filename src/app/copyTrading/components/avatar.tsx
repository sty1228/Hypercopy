export default function Avatar({
  name,
  backgroundColor,
  size,
}: {
  name: string;
  backgroundColor: string;
  size: number;
}) {
  const isGradient = backgroundColor?.startsWith("linear-gradient");
  
  return (
    <div
      className="flex items-center justify-center font-bold text-white"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: size > 30 ? "16px" : "12px",
        background: isGradient ? backgroundColor : undefined,
        backgroundColor: !isGradient ? backgroundColor : undefined,
        fontSize: size > 30 ? "14px" : "12px",
        boxShadow: "0 0 20px rgba(0,0,0,0.3)",
      }}
    >
      {name}
    </div>
  );
}