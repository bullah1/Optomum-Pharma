import { toast } from "sonner";
import { Download } from "lucide-react";

export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) {
    toast.error("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast.success("CSV exported!");
}

export const ExportButton = ({ onClick, label = "Export CSV" }: { onClick: () => void; label?: string }) => (
  <button onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-secondary text-muted-foreground hover:bg-muted transition-colors">
    <Download size={12} /> {label}
  </button>
);
