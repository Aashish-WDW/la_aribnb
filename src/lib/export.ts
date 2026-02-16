
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function downloadExcel(data: any[], filename: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function downloadPDF(data: any[], filename: string, title: string) {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    // Table
    // Assume data is already flattened/formatted for the table
    const headers = Object.keys(data[0] || {}).map(key =>
        key.charAt(0).toUpperCase() + key.slice(1)
    );

    const rows = data.map(item => Object.values(item));

    autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 40,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [66, 133, 244] }, // Brand color approximation
    });

    doc.save(`${filename}.pdf`);
}
