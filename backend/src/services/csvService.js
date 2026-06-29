import fs from "node:fs";
import { parse } from "csv-parse/sync";

const detectDelimiter = (content) => {
  const [header = ""] = content.split(/\r?\n/);
  const semicolonCount = (header.match(/;/g) || []).length;
  const commaCount = (header.match(/,/g) || []).length;

  return semicolonCount >= commaCount ? ";" : ",";
};

export const readCsvFile = (filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  const delimiter = detectDelimiter(content);

  const records = parse(content, {
    bom: true,
    columns: true,
    delimiter,
    skip_empty_lines: true,
    trim: true,
  });

  return {
    delimiter,
    records,
  };
};
