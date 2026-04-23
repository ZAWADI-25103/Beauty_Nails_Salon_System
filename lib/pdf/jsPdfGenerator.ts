import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs/promises';
import path from 'path';

// Extend jsPDF prototype with autoTable
(jsPDF.prototype as any).autoTable = autoTable;

export interface ContentSection {
  title: string;
  type: 'table' | 'keyValue' | 'text';
  data: any;
}

const DEFAULT_LOGO_PATH = path.join(process.cwd(), "public", "images", "Bnails_ white.png");

/**
 * Generate a PDF report using jsPDF with optimized performance
 */
export async function generateReportPdf(
  sections: ContentSection[],
  title: string,
  dateRange: string,
): Promise<Buffer> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Define constants
    const PAGE_WIDTH = doc.internal.pageSize.getWidth();
    const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
    const MARGIN = 20;
    const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
    
    let yPos = MARGIN;

    // Add header with logo and title
    yPos = await addHeader(doc, title, dateRange, PAGE_WIDTH, yPos);

    // Process each section
    for (const section of sections) {
      yPos = await processSection(doc, section, PAGE_WIDTH, PAGE_HEIGHT, MARGIN, yPos);
    }

    // Add footers to all pages
    addFootersToAllPages(doc, PAGE_WIDTH, PAGE_HEIGHT, MARGIN);

    return Buffer.from(doc.output('arraybuffer'));
  } catch (error) {
    console.error('Error generating PDF with jsPDF:', error);
    throw error;
  }
}

/**
 * Add header section with logo and title
 */
async function addHeader(
  doc: jsPDF,
  title: string,
  dateRange: string,
  pageWidth: number,
  yPos: number
): Promise<number> {
  // Add logo or company name
  try {
    const logoBuffer = await fs.readFile(DEFAULT_LOGO_PATH);
    const logoBase64 = Buffer.from(logoBuffer).toString('base64');
    doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', pageWidth / 2 - 15, yPos, 30, 15, undefined, 'FAST');
    yPos += 20;
  } catch (error) {
    // Fallback to text if logo fails
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BEAUTY NAILS', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  }

  // Add title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Add date range
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Period: ${dateRange}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  return yPos;
}

/**
 * Process individual section based on type
 */
async function processSection(
  doc: jsPDF,
  section: ContentSection,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  yPos: number
): Promise<number> {
  // Check if we need a new page
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = margin;
  }

  // Add section title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(section.title, margin, yPos);
  yPos += 8;

  // Process content based on type
  switch (section.type) {
    case 'table':
      yPos = await processTableSection(doc, section, pageWidth, pageHeight, margin, yPos);
      break;
    case 'keyValue':
      yPos = processKeyValueSection(doc, section, pageWidth, pageHeight, margin, yPos);
      break;
    case 'text':
      yPos = processTextSection(doc, section, pageWidth, pageHeight, margin, yPos);
      break;
    default:
      console.warn(`Unknown section type: ${section.type}`);
  }

  return yPos;
}

/**
 * Process table section with autoTable
 */
async function processTableSection(
  doc: jsPDF,
  section: ContentSection,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  yPos: number
): Promise<number> {
  const { headers, rows } = section.data;
  const tableHeaders = headers ? [headers] : [];

  // Use autoTable with optimized settings
  autoTable(doc, {
    head: tableHeaders,
    body: rows,
    startY: yPos,
    margin: { left: margin, right: margin },
    headStyles: { 
      fillColor: [242, 242, 242], 
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252]
    },
    // Remove the problematic didDrawPage handler to avoid duplicate footers
  });

  // @ts-ignore - lastAutoTable is added by the plugin
  return (doc as any).lastAutoTable.finalY + 10;
}

/**
 * Process key-value section
 */
function processKeyValueSection(
  doc: jsPDF,
  section: ContentSection,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  yPos: number
): number {
  doc.setFontSize(9);
  
  const entries = Object.entries(section.data);
  for (const [key, value] of entries) {
    // Check if we need a new page
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(key, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 50, yPos);
    yPos += 6;
  }
  
  return yPos + 5; // Add space after section
}

/**
 * Process text section
 */
function processTextSection(
  doc: jsPDF,
  section: ContentSection,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  yPos: number
): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const contentWidth = pageWidth - (margin * 2);
  const textLines = doc.splitTextToSize(section.data, contentWidth);
  
  // Check if we need a new page
  if (yPos + (textLines.length * 5) > pageHeight - 30) {
    doc.addPage();
    yPos = margin;
  }
  
  doc.text(textLines, margin, yPos);
  return yPos + (textLines.length * 5) + 5;
}

/**
 * Add footers to all pages
 */
function addFootersToAllPages(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number
): void {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add footer line
    doc.setDrawColor(238, 238, 238);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    
    // Add footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Beauty Nails Management System', margin, pageHeight - 15);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
  }
}