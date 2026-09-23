interface StatusPanelProps {
  kind: "loading" | "error" | "empty";
  title: string;
  detail?: string;
}

export default function StatusPanel({ kind, title, detail }: StatusPanelProps) {
  return (
    <div className="glass state">
      {kind === "loading" && <div className="spinner" />}
      <strong>{title}</strong>
      {detail && <span>{detail}</span>}
    </div>
  );
}
