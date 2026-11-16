import { Document, Packer, Paragraph, TextRun } from "docx";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.addVirtualFileSystem(pdfFonts);

export type ExportTeacher = { id: number; name: string; position: string; rate: number };
export type ExportWorkload = {
  teacher_id: number;
  discipline_name: string;
  groups: string;
  lectures?: number;
  labs?: number;
  practices?: number;
  exams?: number;
  credits?: number;
  course_projects?: number;
  consultations?: number;
  seminars?: number;
  diploma_students?: number;
  practice_hours?: number;
  postgraduates?: number;
};

const value = (item: unknown) => Number(item ?? 0);
const total = (row: ExportWorkload): number => {
  let result = 0;
  [row.lectures, row.labs, row.practices, row.exams, row.credits, row.course_projects, row.consultations, row.seminars, row.diploma_students, row.practice_hours, row.postgraduates].forEach((item) => { result += value(item); });
  return result;
};
const fmt = (hours: number) => new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(hours);

const saveBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export async function exportWordReport(title: string, subtitle: string, rows: ExportWorkload[], fileName: string) {
  const lines = rows.length
    ? rows.map((row, index) => `${index + 1}. ${row.discipline_name || "Навчальне навантаження"}; ${row.groups || "—"}; лекції: ${value(row.lectures)}; лабораторні: ${value(row.labs)}; практичні: ${value(row.practices)}; разом: ${fmt(total(row))} год.`)
    : ["За обраними параметрами записів немає."];
  const overall = rows.reduce<number>((sum, row) => sum + total(row), 0);
  const documentFile = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ alignment: "center", children: [new TextRun({ text: title, bold: true, size: 28 })] }),
        new Paragraph({ alignment: "center", children: [new TextRun({ text: subtitle, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: "Педагогічне навантаження", bold: true, size: 24 })] }),
        ...lines.map((line) => new Paragraph({ children: [new TextRun({ text: line, size: 22 })] })),
        new Paragraph({ children: [new TextRun({ text: `Загальний обсяг: ${fmt(overall)} год.`, bold: true, size: 24 })] }),
      ],
    }],
  });
  saveBlob(await Packer.toBlob(documentFile), `${fileName}.docx`);
}

export function exportPdfReport(title: string, subtitle: string, rows: ExportWorkload[], fileName: string) {
  const overall = rows.reduce<number>((sum, row) => sum + total(row), 0);
  const body = rows.length ? rows.map((row, index) => [String(index + 1), row.discipline_name || "Навчальне навантаження", row.groups || "—", String(value(row.lectures)), String(value(row.labs)), String(value(row.practices)), `${fmt(total(row))} год.`]) : [["", "За обраними параметрами записів немає.", "", "", "", "", ""]];
  pdfMake.createPdf({ content: [{ text: title, style: "title" }, { text: subtitle, style: "subtitle" }, { table: { headerRows: 1, widths: [22, "*", 55, 45, 55, 50, 55], body: [["№", "Дисципліна", "Група", "Лекції", "Лабораторні", "Практичні", "Разом"], ...body] }, layout: "lightHorizontalLines" }, { text: `Загальний обсяг: ${fmt(overall)} год.`, style: "total" }], styles: { title: { fontSize: 16, bold: true, alignment: "center", margin: [0, 0, 0, 6] }, subtitle: { fontSize: 11, alignment: "center", color: "#526681", margin: [0, 0, 0, 18] }, total: { fontSize: 12, bold: true, alignment: "right", margin: [0, 16, 0, 0] } }, defaultStyle: { font: "Roboto", fontSize: 9 } }).download(`${fileName}.pdf`);
}
