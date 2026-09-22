export function formatDate(iso: string): string {
  try {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDateShort(iso: string): string {
  try {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}
