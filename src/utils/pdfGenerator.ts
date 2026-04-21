/**
 * PDF Receipt Generator Utility
 * 
 * Generates professional payment receipts in PDF format using jsPDF.
 * Updated to match high-fidelity "Luxe" Space Grotesk design.
 */

import jsPDF from 'jspdf';

interface CheckoutService {
  id: string;
  description: string;
  amount: number;
  invoiceNo: string;
  studentName: string;
  studentId?: string;
  term?: number;
  academicYear?: number;
  class?: string;
  grade?: string;
}

interface ReceiptData {
  schoolName: string;
  totalAmount: number;
  baseAmount?: number;
  serviceFee?: number;
  refNumber: string;
  dateTime: string;
  scheduleId: string;
  services?: CheckoutService[];
  parentName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolLogo?: string | null;
  paymentMethod?: string;
  admissionNumber?: string;
  grade?: string;
  isPaid?: boolean;
}

export function generateReceiptPDF(data: ReceiptData) {
  const {
    schoolName,
    totalAmount,
    baseAmount: providedBaseAmount,
    refNumber,
    dateTime,
    services = [],
    parentName,
    schoolLogo,
    paymentMethod = 'Mobile Money',
    admissionNumber,
    isPaid = true,
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftMargin = 15;
  const rightMargin = pageWidth - 15;
  const contentWidth = rightMargin - leftMargin;

  // Constants for colors
  const COLOR_TEXT_DIM = [115, 128, 140]; // #73808C
  const COLOR_BLACK = [0, 0, 0];
  const COLOR_RED = [234, 48, 48]; // #EA3030
  const COLOR_GREEN_BG = [207, 242, 189]; // #CFF2BD
  const COLOR_GREEN_TEXT = [43, 123, 0]; // #2B7B00
  const COLOR_LIGHT_GRAY = [249, 250, 251]; // #F9FAFB
  const COLOR_DIVIDER = [217, 217, 217]; // #D9D9D9

  // Helper method to extract Grade/Class from description
  const extractGrade = (desc: string) => {
    const match = desc.match(/(Grade \d+|Baby Class|Reception|Nursery|Pre-school|G\s*\d+)/i);
    return match ? match[1].replace(/G\s*/i, 'Grade ') : 'Class Not Specified';
  };

  // Prioritize top-level data.grade, then services[0].grade, then extraction
  const studentClass = (data as any).grade || services[0]?.grade || services[0]?.class || extractGrade(services[0]?.description || '');
  
  // Prioritize top-level admissionNumber, then service-level studentId/id
  const studentIdRaw = admissionNumber || services[0]?.studentId || services[0]?.id || 'N/A';
  const studentId = studentIdRaw.length > 12 ? studentIdRaw.substring(0, 12) : studentIdRaw;
  const totalFeesCharged = services.reduce((acc, s) => acc + (s.amount || 0), 0) || totalAmount;
  const balanceOwing = Math.max(0, totalFeesCharged - totalAmount);

  // --- RENDERING ---
  let yPos = 15;

  // === LOGO & HEADER BARS ===
  if (schoolLogo) {
    try {
      doc.addImage(schoolLogo, 'PNG', leftMargin, yPos, 20, 20);
    } catch (e) {
      // Fallback if logo fails
      doc.setFillColor(239, 242, 245);
      doc.circle(leftMargin + 10, yPos + 10, 10, 'F');
    }
  } else {
    doc.setFillColor(239, 242, 245); // #EFF2F5
    doc.circle(leftMargin + 5, yPos + 5, 7, 'F');
  }
  
  // Add School Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
  doc.text(schoolName.toUpperCase(), leftMargin + 25, yPos + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_TEXT_DIM[0], COLOR_TEXT_DIM[1], COLOR_TEXT_DIM[2]);
  doc.text('OFFICIAL PAYMENT RECEIPT', leftMargin + 25, yPos + 13);

  yPos += 35;

  // === RECEIPT TITLE & STATUS ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
  doc.text('RECEIPT', leftMargin, yPos);

  // Status Badge
  const statusText = balanceOwing <= 0.01 ? 'PAID' : 'PARTLY PAID';
  const badgeWidth = 25;
  const badgeHeight = 8;
  doc.setFillColor(COLOR_GREEN_BG[0], COLOR_GREEN_BG[1], COLOR_GREEN_BG[2]);
  doc.roundedRect(leftMargin, yPos + 5, badgeWidth, badgeHeight, 4, 4, 'F');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_GREEN_TEXT[0], COLOR_GREEN_TEXT[1], COLOR_GREEN_TEXT[2]);
  doc.text(statusText, leftMargin + (badgeWidth / 2), yPos + 10.5, { align: 'center' });

  // === RECEIPT META (Right side) ===
  const metaX = rightMargin - 50;
  const metaValueX = rightMargin;
  let metaY = yPos - 12;

  const drawMetaRow = (label: string, value: string) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_TEXT_DIM[0], COLOR_TEXT_DIM[1], COLOR_TEXT_DIM[2]);
    doc.text(label, metaX, metaY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
    doc.text(value, metaValueX, metaY, { align: 'right' });
    metaY += 6;
  };

  drawMetaRow('Receipt No', refNumber);
  drawMetaRow('Date', dateTime);
  drawMetaRow('Payment Ref', refNumber);
  drawMetaRow('Method', paymentMethod);

  yPos += 25;

  // === INFO SUMMARY BAR ===
  doc.setFillColor(COLOR_LIGHT_GRAY[0], COLOR_LIGHT_GRAY[1], COLOR_LIGHT_GRAY[2]);
  doc.roundedRect(leftMargin, yPos, contentWidth, 16, 1.5, 1.5, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(191, 191, 191); // #BFBFBF
  
  const third = contentWidth / 3;
  doc.text('BILLED TO', leftMargin + (third / 2), yPos + 5, { align: 'center' });
  doc.text('GRADE', leftMargin + third + (third / 2), yPos + 5, { align: 'center' });
  doc.text('STUDENT ID', leftMargin + (third * 2) + (third / 2), yPos + 5, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
  doc.text(parentName || 'Parent', leftMargin + (third / 2), yPos + 11, { align: 'center' });
  doc.text(studentClass, leftMargin + third + (third / 2), yPos + 11, { align: 'center' });
  doc.text(studentId.toUpperCase(), leftMargin + (third * 2) + (third / 2), yPos + 11, { align: 'center' });

  yPos += 30;

  // === TABLE HEADER ===
  doc.setFillColor(239, 242, 245); // #EFF2F5
  doc.roundedRect(leftMargin, yPos, contentWidth, 8, 1, 1, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);

  let colX = leftMargin + 3;
  doc.text('STUDENT', colX, yPos + 5);
  colX += 25;
  doc.text('DETAILS', colX, yPos + 5);
  colX += 60;
  doc.text('QTY', colX, yPos + 5, { align: 'center' });
  colX += 15;
  doc.text('K/UNIT', colX, yPos + 5, { align: 'center' });
  colX += 20;
  doc.text('TOTAL', colX, yPos + 5, { align: 'center' });
  colX += 20;
  doc.text('AMT PAID', colX, yPos + 5, { align: 'center' });
  colX += 20;
  doc.text('BALANCE', rightMargin - 3, yPos + 5, { align: 'right' });

  yPos += 12;

  // === TABLE ROWS ===
  doc.setFontSize(9);
  doc.setTextColor(88, 88, 88); // #585858

  services.forEach((service) => {
    colX = leftMargin + 3;
    doc.text(String(service.studentName).substring(0, 15), colX, yPos);
    colX += 25;
    doc.text(String(service.description).substring(0, 35), colX, yPos);
    colX += 60;
    doc.text('1', colX, yPos, { align: 'center' });
    colX += 15;
    doc.text(service.amount.toLocaleString(), colX, yPos, { align: 'center' });
    colX += 20;
    doc.text(service.amount.toLocaleString(), colX, yPos, { align: 'center' });
    colX += 20;
    
    // Proportional distribution for the paid amount per item
    const itemPaid = totalAmount >= totalFeesCharged ? service.amount : Math.min(service.amount, totalAmount / services.length);
    const itemBalance = Math.max(0, service.amount - itemPaid);
    
    doc.text(itemPaid.toLocaleString(), colX, yPos, { align: 'center' });
    colX += 20;
    doc.text(itemBalance.toLocaleString(), rightMargin - 3, yPos, { align: 'right' });
    yPos += 8;
  });

  // Divider
  doc.setDrawColor(COLOR_DIVIDER[0], COLOR_DIVIDER[1], COLOR_DIVIDER[2]);
  doc.line(leftMargin, yPos, rightMargin, yPos);
  yPos += 8;

  // === FOOTER TOTALS ===
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Fees Charged (T)', leftMargin + 3, yPos);
  doc.text(`K ${totalFeesCharged.toLocaleString()}`, rightMargin - 3, yPos, { align: 'right' });
  yPos += 8;

  doc.text(`Amount Paid - ${paymentMethod} (P)`, leftMargin + 3, yPos);
  doc.text(`-K ${totalAmount.toLocaleString()}`, rightMargin - 3, yPos, { align: 'right' });
  yPos += 6;

  // Heavy divider
  doc.setLineWidth(0.5);
  doc.line(leftMargin, yPos, rightMargin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_RED[0], COLOR_RED[1], COLOR_RED[2]);
  doc.text('Balance Owing (T) - (P)', leftMargin + 3, yPos);
  doc.setFontSize(13);
  doc.text(`K ${balanceOwing.toLocaleString()}`, rightMargin - 3, yPos, { align: 'right' });

  // === FINAL FOOTER BOX ===
  yPos = pageHeight - 45;
  doc.setFillColor(245, 247, 249); // #F5F7F9
  doc.roundedRect(leftMargin, yPos, contentWidth, 25, 2, 2, 'F');

  // Info Icon mock
  doc.setDrawColor(175, 191, 207); // #AFBFCF
  doc.circle(leftMargin + 8, yPos + 12.5, 5, 'D');
  doc.line(leftMargin + 8, yPos + 10, leftMargin + 8, yPos + 14);
  doc.circle(leftMargin + 8, yPos + 16, 0.2, 'D');

  doc.setFontSize(8);
  doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
  
  if (balanceOwing <= 0.01) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_GREEN_TEXT[0], COLOR_GREEN_TEXT[1], COLOR_GREEN_TEXT[2]);
    doc.text('ACCOUNT FULLY SETTLED', leftMargin + 18, yPos + 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
    doc.text('This payment has successfully cleared your outstanding balance for the listed items.', leftMargin + 18, yPos + 15);
    doc.text('Thank you for your prompt payment and your continued trust in our institution.', leftMargin + 18, yPos + 20);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
    doc.text('PAYMENT REGISTERED', leftMargin + 18, yPos + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
    doc.text(`A balance of K ${balanceOwing.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} remains on this account.`, leftMargin + 18, yPos + 15);
    doc.text('Please ensure full settlement is made to avoid any disruption in services.', leftMargin + 18, yPos + 20);
  }


  drawFooter(doc, schoolName, pageWidth, pageHeight, COLOR_TEXT_DIM);

  // Save PDF
  const fileName = `Receipt_${refNumber}_${Date.now()}.pdf`;
  doc.save(fileName);
}

function drawFooter(doc: jsPDF, schoolName: string, pageWidth: number, pageHeight: number, COLOR_TEXT_DIM: number[]) {
  doc.setFontSize(8);
  doc.setTextColor(COLOR_TEXT_DIM[0], COLOR_TEXT_DIM[1], COLOR_TEXT_DIM[2]);
  doc.text(`GENERATED BY ${schoolName.toUpperCase()} • ON ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
}
