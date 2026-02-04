import * as XLSX from "xlsx";

/**
 * Exports data to an Excel file.
 * @param data Array of objects where each object represents a row.
 * @param filename Name of the file (without extension).
 * @param sheetName Name of the worksheet.
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = "Sheet1") {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Auto-size columns roughly
    const maxChars = data.reduce((acc, row) => {
        Object.keys(row).forEach((key, i) => {
            const val = String(row[key] || "");
            acc[i] = Math.max(acc[i] || key.length, val.length);
        });
        return acc;
    }, [] as number[]);

    ws["!cols"] = maxChars.map((w: number) => ({ wch: Math.min(w + 2, 50) }));

    XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Downloads a buffer as a file.
 */
export function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
