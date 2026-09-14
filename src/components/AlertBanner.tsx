export default function AlertBanner({
  type = "error",
  message,
}: {
  type?: "error" | "success" | "info";
  message: string;
}) {
  if (!message) return null;
  const styles =
    type === "error"
      ? "bg-agora-red/10 text-agora-red border-agora-red/30"
      : type === "success"
      ? "bg-agora-green/10 text-agora-green border-agora-green/30"
      : "bg-agora-blue/10 text-agora-blue border-agora-blue/30";
  return (
    <div className={`text-sm rounded-lg border px-3.5 py-2.5 font-nunito ${styles}`} role="alert">
      {message}
    </div>
  );
}
