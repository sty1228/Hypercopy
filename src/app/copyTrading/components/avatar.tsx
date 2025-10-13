export default function Avatar({
  name,
  backgroundColor,
  size,
}: {
  name: string;
  backgroundColor: string;
  size: number;
}) {
  return (
    <div
      className="flex items-center justify-center font-bold text-sm"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "28px",
        backgroundColor: backgroundColor,
      }}
    >
      {name}
    </div>
  );
}
