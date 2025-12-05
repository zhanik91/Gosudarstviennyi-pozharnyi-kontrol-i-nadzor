import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Читаем файл Excel с учетными записями
const filePath = path.join(__dirname, "../../attached_assets/учетные записи_1756247677774.xlsx");

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Преобразуем в JSON
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log("Учетные записи:");
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.error("Ошибка чтения файла:", error.message);
}
