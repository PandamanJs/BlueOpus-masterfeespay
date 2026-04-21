import React from 'react';

interface ModernReceiptProps {
    schoolName: string;
    schoolEmail?: string;
    schoolLogo?: string | null;
    receiptNo: string;
    date: string;
    paymentRef: string;
    paymentMethod?: string;
    billedTo: string;
    grade: string;
    studentId: string;
    admissionNumber?: string;
    isPaid?: boolean;
    items: Array<{
        studentName: string;
        details: string;
        qty: number;
        unitPrice: number;
        total: number;
        amtPaid: number;
        balance: number;
    }>;
    totalFeesCharged: number;
    amountPaid: number;
    balanceOwing: number;
    nextPaymentDate: string;
    statusBadge?: 'Paid' | 'Partly Paid' | 'Unpaid';
    paymentHistory?: Array<{
        date: string;
        method: string;
        amount: number;
        description?: string;
    }>;
}

export const ModernReceipt: React.FC<ModernReceiptProps> = ({
    schoolName,
    schoolEmail,
    schoolLogo,
    receiptNo,
    date,
    paymentRef,
    paymentMethod = 'Mobile Money',
    billedTo,
    grade,
    studentId,
    admissionNumber,
    isPaid = true,
    items,
    totalFeesCharged,
    amountPaid,
    balanceOwing,
    nextPaymentDate,
    statusBadge = 'Partly Paid',
    paymentHistory = []
}) => {
    const isCleared = balanceOwing <= 0.01;
    // Truncate Student ID to 8 chars
    const displayStudentId = studentId && studentId !== 'N/A' ? studentId.substring(0, 8).toUpperCase() : 'N/A';
    const displayGrade = grade && grade !== 'N/A' ? grade : 'Class Not Specified';

    return (
        <div id="modern-receipt-container" style={{ width: 595, height: 842, position: 'relative', background: 'white', overflow: 'hidden', margin: '0 auto', boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
            {/* Header Branding */}
            <div style={{ left: 38, top: 24, position: 'absolute', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EFF2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {schoolLogo ? (
                        <img src={schoolLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#AFBFCF" strokeWidth="2">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                            <path d="M2 17L12 22L22 17" />
                            <path d="M2 12L12 17L22 12" />
                        </svg>
                    )}
                </div>
                <div>
                   <div style={{ color: '#003630', fontSize: 18, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{schoolName}</div>
                   <div style={{ color: '#73808C', fontSize: 10, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '500', marginTop: 2 }}>OFFICIAL PAYMENT RECEIPT</div>
                </div>
            </div>

            {/* Receipt Title & Status */}
            <div style={{ width: 515, left: 38, top: 110, position: 'absolute', justifyContent: 'space-between', alignItems: 'flex-start', display: 'inline-flex' }}>
                <div style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 8, display: 'inline-flex' }}>
                    <div style={{ color: 'black', fontSize: 36, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '700' }}>RECEIPT</div>
                    <div style={{ 
                        padding: '6px 16px', 
                        background: statusBadge === 'Paid' ? '#D1FAE5' : '#FEF3C7', 
                        borderRadius: 60, 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        display: 'inline-flex' 
                    }}>
                        <div style={{ 
                            color: statusBadge === 'Paid' ? '#065F46' : '#92400E', 
                            fontSize: 12, 
                            fontFamily: 'Space Grotesk, sans-serif', 
                            fontWeight: '600' 
                        }}>{statusBadge.toUpperCase()}</div>
                    </div>
                </div>
                
                {/* Meta data */}
                <div style={{ width: 220, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 6, display: 'inline-flex' }}>
                    {[
                        { label: 'Receipt No', value: receiptNo },
                        { label: 'Date', value: date },
                        { label: 'Payment Ref', value: paymentRef },
                        { label: 'Method', value: paymentMethod }
                    ].map((row, i) => (
                        <div key={i} style={{ alignSelf: 'stretch', padding: '0 4px', justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
                            <div style={{ color: '#73808C', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>{row.label}</div>
                            <div style={{ color: 'black', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600' }}>{row.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Summary Bar */}
            <div style={{ width: 515, height: 58, left: 40, top: 243, position: 'absolute', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F2F2F2', justifyContent: 'flex-start', alignItems: 'center', display: 'inline-flex' }}>
                {[
                    { label: 'BILLED TO', value: billedTo },
                    { label: 'GRADE', value: displayGrade },
                    { label: 'STUDENT ID', value: displayStudentId }
                ].map((item, i) => (
                    <div key={i} style={{ flex: '1 1 0', borderRight: i < 2 ? '1px solid #EEE' : 'none', padding: '0 10px', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 4, display: 'inline-flex' }}>
                        <div style={{ textAlign: 'center', color: '#BFBFBF', fontSize: 9, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600', letterSpacing: '0.5px' }}>{item.label}</div>
                        <div style={{ textAlign: 'center', color: 'black', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600' }}>{item.value}</div>
                    </div>
                ))}
            </div>

            {/* Items Table */}
            <div style={{ width: 515, padding: '16px 12px', left: 40, top: 332, position: 'absolute', background: 'white', borderRadius: 12, border: '1px #F2F2F2 solid', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'inline-flex' }}>
                {/* Header Row */}
                <div style={{ alignSelf: 'stretch', height: 32, padding: '0 12px', background: '#F9FAFB', borderRadius: 6, justifyContent: 'flex-start', alignItems: 'center', gap: 10, display: 'inline-flex' }}>
                    <div style={{ width: 80, color: '#73808C', fontSize: 8, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600' }}>STUDENT</div>
                    <div style={{ flex: '1 1 0', color: '#73808C', fontSize: 8, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600' }}>DETAILS</div>
                    <div style={{ width: 40, textAlign: 'center', color: '#73808C', fontSize: 8, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600' }}>QTY</div>
                    <div style={{ width: 60, textAlign: 'center', color: '#73808C', fontSize: 8, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600' }}>K/UNIT</div>
                    <div style={{ width: 55, textAlign: 'center', color: '#73808C', fontSize: 8, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600' }}>TOTAL</div>
                    <div style={{ width: 55, textAlign: 'center', color: '#73808C', fontSize: 8, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600' }}>PAID</div>
                    <div style={{ width: 55, textAlign: 'right', color: '#73808C', fontSize: 8, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600' }}>BALANCE</div>
                </div>

                {/* Rows */}
                {items.map((item, i) => (
                    <div key={i} style={{ alignSelf: 'stretch', minHeight: 30, padding: '10px 12px', borderBottom: i === items.length -1 ? 'none' : '1px solid #FAFAFA', justifyContent: 'flex-start', alignItems: 'center', gap: 10, display: 'inline-flex' }}>
                        <div style={{ width: 80, color: 'black', fontSize: 10, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600' }}>{item.studentName}</div>
                        <div style={{ flex: '1 1 0', color: '#585858', fontSize: 10, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>{item.details}</div>
                        <div style={{ width: 40, textAlign: 'center', color: '#585858', fontSize: 10, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>{item.qty}</div>
                        <div style={{ width: 60, textAlign: 'center', color: '#585858', fontSize: 10, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '500' }}>{item.unitPrice.toLocaleString()}</div>
                        <div style={{ width: 55, textAlign: 'center', color: '#585858', fontSize: 10, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600' }}>{item.total.toLocaleString()}</div>
                        <div style={{ width: 55, textAlign: 'center', color: '#059669', fontSize: 10, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600' }}>{item.amtPaid.toLocaleString()}</div>
                        <div style={{ width: 55, textAlign: 'right', color: item.balance > 0 ? '#DC2626' : '#585858', fontSize: 10, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '700' }}>{item.balance.toLocaleString()}</div>
                    </div>
                ))}

                {/* Subfooter in table */}
                <div style={{ width: '100%', height: 1, background: '#F2F2F2', margin: '4px 0' }}></div>
                
                <div style={{ alignSelf: 'stretch', padding: '6px 12px', justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
                    <div style={{ color: '#73808C', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' }}>Total Fees Charged (T)</div>
                    <div style={{ textAlign: 'right', color: 'black', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600' }}>K {totalFeesCharged.toLocaleString()}</div>
                </div>
                <div style={{ alignSelf: 'stretch', padding: '6px 12px', justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
                    <div style={{ color: '#73808C', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' }}>Amount Paid - {paymentMethod} (P)</div>
                    <div style={{ textAlign: 'right', color: '#059669', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '700' }}>-K {amountPaid.toLocaleString()}</div>
                </div>

                {/* Individual Payment History */}
                {paymentHistory && paymentHistory.length > 0 && (
                    <div style={{ alignSelf: 'stretch', padding: '0 12px 10px 12px', flexDirection: 'column', gap: 4, display: 'flex' }}>
                        {paymentHistory.map((pmt, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ color: '#73808C', fontSize: 9, fontFamily: 'Space Grotesk, sans-serif', fontStyle: 'italic', marginLeft: 12 }}>
                                    {pmt.date} {pmt.description || `Paid via ${pmt.method}`}
                                </div>
                                <div style={{ color: '#73808C', fontSize: 9, fontFamily: 'Space Grotesk, sans-serif', fontStyle: 'italic' }}>
                                    -K {pmt.amount.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ alignSelf: 'stretch', padding: '12px 12px', borderTop: '2px solid #003630', background: '#F9FAFB', borderRadius: '0 0 8px 8px', justifyContent: 'space-between', alignItems: 'center', display: 'flex', marginTop: 4 }}>
                    <div style={{ color: '#003630', fontSize: 12, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '700' }}>Balance Owing (T) - (P)</div>
                <div style={{ textAlign: 'right', color: balanceOwing > 0 ? '#EA3030' : '#059669', fontSize: 16, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '800' }}>K {balanceOwing.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</div>
            </div>
        </div>


            {/* Next Payment Footer */}
            <div style={{ width: 515, padding: '20px 24px', left: 40, top: 680, position: 'absolute', background: isCleared ? '#F0FDF4' : '#FFFBEB', borderRadius: 12, border: `1px solid ${isCleared ? '#DCFCE7' : '#FEF3C7'}`, justifyContent: 'flex-start', alignItems: 'center', gap: 16, display: 'inline-flex' }}>
                <div style={{ position: 'relative' }}>
                    {isCleared ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    )}
                </div>
                <div style={{ flex: '1 1 0', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1.5 }}>
                    {isCleared ? (
                        <div style={{ color: '#064E3B' }}>
                            <span style={{ fontWeight: '700', fontSize: 12, display: 'block', marginBottom: 2 }}>ACCOUNT FULLY SETTLED</span>
                            <span>This payment has successfully cleared your outstanding balance for the listed items. Thank you for your continued trust in our institution.</span>
                        </div>
                    ) : (
                        <div style={{ color: '#78350F' }}>
                            <span style={{ fontWeight: '700', fontSize: 12, display: 'block', marginBottom: 2 }}>PAYMENT REGISTERED</span>
                            <span>A balance of <span style={{ fontWeight: '700' }}>K {balanceOwing.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span> remains on this account. Please ensure full settlement is made to avoid any disruption in services.</span>
                        </div>
                    )}
                </div>

            </div>
            
            {/* Standard Footer */}
            <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', color: '#AFBFCF', fontSize: 9, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '1px' }}>
                GENERATED BY {schoolName.toUpperCase()} • ON {new Date().toLocaleDateString('en-GB')}
            </div>
        </div>
    );
};

