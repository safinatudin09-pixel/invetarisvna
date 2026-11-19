import * as XLSX from "xlsx";

/**
 * Mengonversi array of objects menjadi file Excel (.xlsx) atau CSV di sisi client.
 */
export function exportToSpreadsheet(
  data: Record<string, unknown>[],
  fileName: string,
  formatType: "xlsx" | "csv" = "xlsx",
  sheetName = "Data"
) {
  if (!data || data.length === 0) {
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-width kolom berdasarkan panjang header atau isi
  const keys = Object.keys(data[0]);
  const colWidths = keys.map((key) => {
    const maxContentLen = Math.max(
      key.length,
      ...data.map((row) => String(row[key] ?? "").length)
    );
    return { wch: Math.min(Math.max(maxContentLen + 3, 12), 45) };
  });
  worksheet["!cols"] = colWidths;

  if (formatType === "csv") {
    XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: "csv" });
  } else {
    XLSX.writeFile(workbook, `${fileName}.xlsx`, { bookType: "xlsx" });
  }
}
