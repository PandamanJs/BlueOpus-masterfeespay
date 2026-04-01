/**
 * PDF Receipt Generator Utility
 * 
 * Generates professional payment receipts in PDF format using jsPDF
 * Modeled after Twalumbu Education Centre invoice format
 */

import jsPDF from 'jspdf';

/**
 * Interface for checkout service items
 */
interface CheckoutService {
  id: string;
  description: string;
  amount: number;
  invoiceNo: string;
  studentName: string;
  term?: number;
  academicYear?: number;
  class?: string;
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
  paymentMethod?: string;
  admissionNumber?: string;
  isPaid?: boolean;
  amountPaid?: number;
  balanceDue?: number;
}

/**
 * Generate a PDF receipt from payment data
 * Modeled after professional invoice format
 */
export function generateReceiptPDF(data: ReceiptData) {
  const {
    schoolName,
    totalAmount, // This indicates the base payment amount made (e.g., 1.00)
    baseAmount: providedBaseAmount, // sometimes passed
    serviceFee: providedServiceFee, // sometimes passed
    refNumber,
    dateTime,
    scheduleId,
    services = [],
    parentName,
    schoolAddress = '',
    schoolPhone = '',
    schoolEmail = '',
    paymentMethod = 'N/A',
    admissionNumber = '',
    isPaid = true,
  } = data;

  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Sum of all service original amounts (e.g., 1700 + 50)
  const servicesSum = services.reduce((acc, s) => acc + (s.amount || 0), 0) || totalAmount;

  // Amount Paid Base (e.g., 1.00 or 1700)
  const amountPaidBase = (providedBaseAmount !== undefined && providedBaseAmount !== null)
    ? providedBaseAmount
    : totalAmount;

  // Service Fee (e.g., 0.03 or 51.00)
  const serviceFeeValue = (providedServiceFee !== undefined && providedServiceFee !== null)
    ? providedServiceFee
    : (amountPaidBase * 0.03);

  // Total Payment Made (e.g., 1.03)
  const finalAmountPaid = isPaid ? (amountPaidBase + serviceFeeValue) : 0;

  // Balance Due (e.g., 1700 - 1.00 = 1699)
  const finalBalanceDue = isPaid ? Math.max(0, servicesSum - amountPaidBase) : servicesSum;

  const paymentMethodLabel = isPaid ? paymentMethod.replace('_', ' ').toUpperCase() : 'PENDING';

  // Helper method to extract Grade/Class from description
  const extractGrade = (desc: string) => {
    const match = desc.match(/(Grade \d+|Baby Class|Reception|Nursery|Pre-school|G\s*\d+)/i);
    return match ? match[1].replace(/G\s*/i, 'Grade ') : 'Class Not Specified';
  };

  const studentClass = services[0]?.class || extractGrade(services[0]?.description || '');
  const schoolTerm = services[0]?.term || 1;

  // --- RENDERING ---
  let yPos = 25;
  const leftMargin = 20;
  const rightMargin = pageWidth - 20;
  const contentWidth = rightMargin - leftMargin;

  // === SCHOOL HEADER ===
  // Elegant dark green school name
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 54, 48); // #003630
  doc.text(schoolName.toUpperCase(), leftMargin, yPos);

  yPos += 8;

  // Premium school contact information
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate grayish

  if (schoolAddress) {
    doc.text(schoolAddress, leftMargin, yPos);
    yPos += 5;
  }
  if (schoolPhone || schoolEmail) {
    const contact = [schoolPhone, schoolEmail].filter(Boolean).join('  •  ');
    doc.text(contact, leftMargin, yPos);
  }

  // === INVOICE HEADING ===
  yPos += 15;
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(149, 227, 108); // #95e36c
  doc.text('RECEIPT', leftMargin, yPos);

  // Status Badge
  const statusText = isPaid ? 'PAID' : 'PENDING';
  const statusColor = isPaid ? [149, 227, 108] : [239, 68, 68];

  doc.setFillColor(statusColor[0] as number, statusColor[1] as number, statusColor[2] as number);
  doc.roundedRect(leftMargin + 48, yPos - 7, 18, 7, 1.5, 1.5, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, leftMargin + 57, yPos - 2, { align: 'center' });

  // === INVOICE DETAILS (Right side) ===
  const detailsValueX = rightMargin;
  const detailsLabelX = pageWidth - 70;
  let detailsY = yPos - 15;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(148, 163, 184); // Slate 400

  doc.text('RECEIPT NO.', detailsLabelX, detailsY);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(refNumber, detailsValueX, detailsY, { align: 'right' });
  detailsY += 6;

  doc.setTextColor(148, 163, 184);
  doc.text('DATE', detailsLabelX, detailsY);
  doc.setTextColor(15, 23, 42);
  doc.text(dateTime, detailsValueX, detailsY, { align: 'right' });
  detailsY += 6;

  doc.setTextColor(148, 163, 184);
  doc.text('PAYMENT REF', detailsLabelX, detailsY);
  doc.setTextColor(15, 23, 42);
  doc.text(refNumber.substring(0, 10) + '...', detailsValueX, detailsY, { align: 'right' });

  yPos += 20;

  // === BILLING & STUDENT INFO ===
  const boxWidth = contentWidth;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(leftMargin, yPos, boxWidth, 24, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(148, 163, 184);
  doc.text('BILLED TO', leftMargin + 6, yPos + 8);
  doc.text('STUDENT CLASS', leftMargin + 85, yPos + 8);
  doc.text('TERM', leftMargin + 155, yPos + 8);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(parentName || 'Valued Parent', leftMargin + 6, yPos + 16);
  doc.text(studentClass || 'N/A', leftMargin + 85, yPos + 16);
  doc.text(`Term ${schoolTerm}`, leftMargin + 155, yPos + 16);

  yPos += 36;

  // === TABLE HEADER ===
  const tableTop = yPos;
  const colWidths = {
    service: 40,
    description: 60,
    qty: 15,
    rate: 25,
    amount: 30
  };

  doc.setFillColor(0, 54, 48); // #003630 Dark Header
  doc.rect(leftMargin, tableTop, contentWidth, 10, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  let colX = leftMargin + 5;
  doc.text('STUDENT', colX, tableTop + 6.5);
  colX += colWidths.service;
  doc.text('SERVICE / DETAILS', colX, tableTop + 6.5);
  colX += colWidths.description;
  doc.text('QTY', colX, tableTop + 6.5);
  colX += colWidths.qty;
  doc.text('CHARGE', colX, tableTop + 6.5, { align: 'right' });
  colX += colWidths.rate;
  doc.text('TOTAL', colX + 2, tableTop + 6.5, { align: 'right' });

  yPos = tableTop + 16;

  // === TABLE ROWS ===
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  services.forEach((service) => {
    colX = leftMargin + 5;

    // Student 
    const serviceName = String(service.studentName || 'Student').substring(0, 20);
    doc.text(serviceName, colX, yPos);
    colX += colWidths.service;

    // Description
    const desc = service.description.length > 30
      ? service.description.substring(0, 28) + '...'
      : service.description;
    doc.text(desc, colX, yPos);
    colX += colWidths.description;

    // Quantity
    doc.text('1', colX, yPos);
    colX += colWidths.qty;

    // Charge (Rate)
    const lineAmount = service.amount || 0;
    doc.text(lineAmount.toFixed(2), colX, yPos, { align: 'right' });
    colX += colWidths.rate;

    // Total Line Amount
    doc.setFont('helvetica', 'bold');
    doc.text(lineAmount.toFixed(2), colX + 2, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    yPos += 8;

    doc.setDrawColor(241, 245, 249); // Slate 100
    doc.line(leftMargin, yPos - 2, rightMargin, yPos - 2);
    yPos += 2;
  });

  yPos += 5;

  // === PREMIUM PAYMENT SUMMARY ===
  const summaryLabelX = pageWidth - 80;
  const summaryValueX = rightMargin - 3;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);

  // Total Invoice Charges
  doc.text('TOTAL INVOICE COST:', summaryLabelX, yPos);
  doc.setTextColor(15, 23, 42);
  doc.text(servicesSum.toFixed(2), summaryValueX, yPos, { align: 'right' });
  yPos += 8;

  // Service Fee
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Service Fee (3%):', summaryLabelX, yPos);
  doc.setTextColor(100, 116, 139);
  doc.text(serviceFeeValue.toFixed(2), summaryValueX, yPos, { align: 'right' });
  yPos += 8;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(summaryLabelX - 5, yPos - 3, rightMargin, yPos - 3);

  // Amount Paid Today
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 54, 48); // Brand dark green
  
  // Truncate payment method if too long to prevent overlap
  const displayPaymentMethod = paymentMethodLabel.length > 15 
    ? paymentMethodLabel.substring(0, 12) + '...' 
    : paymentMethodLabel;
    
  doc.text(`PAID (${displayPaymentMethod}):`, summaryLabelX, yPos);
  doc.text(finalAmountPaid.toFixed(2), summaryValueX, yPos, { align: 'right' });
  yPos += 10; // Increased gap

  // Divider heavy
  doc.setDrawColor(0, 54, 48);
  doc.setLineWidth(0.8);
  doc.line(summaryLabelX - 5, yPos - 4, rightMargin, yPos - 4);
  yPos += 2;

  // Final Balance
  doc.setFontSize(11);
  doc.text('BALANCE DUE:', summaryLabelX, yPos);
  doc.setFontSize(13);
  doc.setTextColor(239, 68, 68); // Red color for outstanding balance 
  if (finalBalanceDue <= 0.01) doc.setTextColor(22, 163, 74); // Green if fully paid (handle floating point)
  doc.text(`K ${finalBalanceDue.toFixed(2)}`, summaryValueX, yPos, { align: 'right' });

  // === FOOTER (Bottom of page guarantee) ===
  yPos = pageHeight - 25;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(leftMargin, yPos - 5, rightMargin, yPos - 5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(148, 163, 184);
  doc.text('master-fees', leftMargin, yPos);

  doc.setFont('helvetica', 'normal');
  doc.text(`Schedule ID: ${scheduleId}  |  Admission Number: ${admissionNumber || 'N/A'}`, pageWidth / 2, yPos, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer-generated receipt and does not require a signature.', rightMargin, yPos, { align: 'right' });

  // Save PDF
  const fileName = `Receipt_${refNumber}_${Date.now()}.pdf`;
  doc.save(fileName);
}

