import React from 'react';
import type { StudentData } from '../../lib/supabase/api/registration';

interface ModernReceiptProps {
    schoolName: string;
    receiptNo: string;
    date: string;
    paymentRef: string;
    paymentMethod: string;
    billedTo: string;
    grade: string;
    studentId: string;
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
}

export const ModernReceipt: React.FC<ModernReceiptProps> = ({
    schoolName,
    receiptNo,
    date,
    paymentRef,
    paymentMethod,
    billedTo,
    grade,
    studentId,
    items,
    totalFeesCharged,
    amountPaid,
    balanceOwing,
    nextPaymentDate,
    statusBadge = 'Partly Paid'
}) => {
    return (
        <div style={{ width: 595, height: 842, position: 'relative', background: 'white', overflow: 'hidden', margin: '0 auto', boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
            {/* Logo area */}
            <div style={{ left: 38, top: 24, position: 'absolute' }}>
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="26" cy="26" r="26" fill="#EFF2F5" />
                </svg>
            </div>
            
            {/* School name / info bars mock */}
            <div style={{ width: 191, left: 111, top: 24, position: 'absolute', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 9, display: 'inline-flex' }}>
                <div style={{ alignSelf: 'stretch', height: 12, background: '#EFF2F5' }} />
                <div style={{ width: 191, height: 12, background: '#EFF2F5' }} />
                <div style={{ width: 174, height: 12, background: '#EFF2F5' }} />
            </div>

            {/* Receipt Header */}
            <div style={{ width: 515, left: 38, top: 110, position: 'absolute', justifyContent: 'space-between', alignItems: 'flex-start', display: 'inline-flex' }}>
                <div style={{ width: 139, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 8, display: 'inline-flex' }}>
                    <div style={{ width: 168, justifyContent: 'flex-end', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 36, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '700', wordWrap: 'break-word' }}>RECEIPT</div>
                    <div style={{ alignSelf: 'stretch', height: 35, padding: '0 10px', background: statusBadge === 'Paid' ? '#D1FAE5' : '#CFF2BD', borderRadius: 60, justifyContent: 'center', alignItems: 'center', gap: 10, display: 'inline-flex' }}>
                        <div style={{ justifyContent: 'flex-end', display: 'flex', flexDirection: 'column', color: statusBadge === 'Paid' ? '#065F46' : '#2B7B00', fontSize: 12, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '500', wordWrap: 'break-word' }}>{statusBadge}</div>
                    </div>
                </div>
                
                {/* Meta data */}
                <div style={{ width: 220, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, display: 'inline-flex' }}>
                    {[
                        { label: 'Receipt No', value: receiptNo },
                        { label: 'Date', value: date },
                        { label: 'Payment Ref', value: paymentRef },
                        { label: 'Method', value: paymentMethod }
                    ].map((row, i) => (
                        <div key={i} style={{ alignSelf: 'stretch', padding: '0 10px', justifyContent: 'flex-start', alignItems: 'center', gap: 10, display: 'inline-flex' }}>
                            <div style={{ flex: '1 1 0', color: '#73808C', fontSize: 12, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>{row.label}</div>
                            <div style={{ flex: '1 1 0', textAlign: 'right', color: 'black', fontSize: 12, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '500' }}>{row.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Summary Bar */}
            <div style={{ width: 515, height: 58, left: 40, top: 243, position: 'absolute', background: '#F9FAFB', borderRadius: 6, justifyContent: 'flex-start', alignItems: 'center', display: 'inline-flex' }}>
                {[
                    { label: 'BILLED TO', value: billedTo },
                    { label: 'GRADE', value: grade },
                    { label: 'STUDENT ID', value: studentId }
                ].map((item, i) => (
                    <div key={i} style={{ flex: '1 1 0', padding: '0 10px', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: 4, display: 'inline-flex' }}>
                        <div style={{ alignSelf: 'stretch', textAlign: 'center', color: '#BFBFBF', fontSize: 10, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '500' }}>{item.label}</div>
                        <div style={{ alignSelf: 'stretch', textAlign: 'center', color: 'black', fontSize: 12, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '500' }}>{item.value}</div>
                    </div>
                ))}
            </div>

            {/* Items Table */}
            <div style={{ width: 515, padding: 12, left: 40, top: 332, position: 'absolute', background: 'white', borderRadius: 8, outline: '1px #F2F2F2 solid', outlineOffset: '-1px', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 4, display: 'inline-flex' }}>
                {/* Header Row */}
                <div style={{ alignSelf: 'stretch', height: 30, padding: '0 12px', background: '#EFF2F5', borderRadius: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 10, display: 'inline-flex' }}>
                    <div style={{ width: 68, color: 'black', fontSize: 8, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>STUDENT</div>
                    <div style={{ flex: '1 1 0', color: 'black', fontSize: 8, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>DETAILS</div>
                    <div style={{ width: 53, textAlign: 'center', color: 'black', fontSize: 8, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>QTY</div>
                    <div style={{ width: 63, textAlign: 'center', color: 'black', fontSize: 8, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>K/UNIT</div>
                    <div style={{ width: 53, textAlign: 'center', color: 'black', fontSize: 8, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>TOTAL</div>
                    <div style={{ width: 53, textAlign: 'center', color: 'black', fontSize: 8, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>AMT PAID</div>
                    <div style={{ width: 53, textAlign: 'right', color: 'black', fontSize: 8, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>BALANCE</div>
                </div>

                {/* Rows */}
                {items.map((item, i) => (
                    <div key={i} style={{ alignSelf: 'stretch', height: 30, padding: '0 12px', borderRadius: 6, justifyContent: 'flex-start', alignItems: 'center', gap: 10, display: 'inline-flex' }}>
                        <div style={{ width: 68, color: '#585858', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>{item.studentName}</div>
                        <div style={{ flex: '1 1 0', color: '#585858', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>{item.details}</div>
                        <div style={{ width: 53, textAlign: 'center', color: '#585858', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>{item.qty}</div>
                        <div style={{ width: 63, textAlign: 'center', color: '#585858', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>{item.unitPrice.toLocaleString()}</div>
                        <div style={{ width: 53, textAlign: 'center', color: '#585858', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>{item.total.toLocaleString()}</div>
                        <div style={{ width: 53, textAlign: 'center', color: '#585858', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>{item.amtPaid.toLocaleString()}</div>
                        <div style={{ width: 53, textAlign: 'right', color: '#585858', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>{item.balance.toLocaleString()}</div>
                    </div>
                ))}

                {/* Subfooter in table */}
                <div style={{ width: 489, height: 1.5, background: '#D9D9D9', margin: '4px 0' }}></div>
                
                <div style={{ alignSelf: 'stretch', height: 30, padding: '0 12px', borderRadius: 6, justifyContent: 'flex-start', alignItems: 'center', gap: 10, display: 'inline-flex' }}>
                    <div style={{ width: 290, color: '#585858', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>Total Fees Charged (T)</div>
                    <div style={{ flex: 1, textAlign: 'right', color: '#585858', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>K {totalFeesCharged.toLocaleString()}</div>
                </div>
                <div style={{ alignSelf: 'stretch', height: 30, padding: '0 12px', borderRadius: 6, justifyContent: 'flex-start', alignItems: 'center', gap: 10, display: 'inline-flex' }}>
                    <div style={{ width: 350, color: '#585858', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>Amount Paid - {paymentMethod} (P)</div>
                    <div style={{ flex: 1, textAlign: 'right', color: '#585858', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '400' }}>-K {amountPaid.toLocaleString()}</div>
                </div>
                <div style={{ alignSelf: 'stretch', height: 30, padding: '6px 12px', borderTop: '0.75px #D9D9D9 solid', justifyContent: 'flex-start', alignItems: 'center', gap: 10, display: 'inline-flex', marginTop: 4 }}>
                    <div style={{ flex: '1 1 0', color: '#EA3030', fontSize: 12, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '700' }}>Balance Owing (T) - (P)</div>
                    <div style={{ textAlign: 'right', color: '#EA3030', fontSize: 14, fontFamily: 'Space Grotesk, sans-serif', fontWeight: '700' }}>K {balanceOwing.toLocaleString()}</div>
                </div>
            </div>

            {/* Next Payment Footer */}
            <div style={{ width: 515, padding: 24, left: 40, top: 680, position: 'absolute', background: '#F5F7F9', borderRadius: 6, justifyContent: 'flex-start', alignItems: 'center', gap: 10, display: 'inline-flex' }}>
                <div style={{ position: 'relative' }}>
                    <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.5 30.25C24.0939 30.25 30.25 24.0939 30.25 16.5C30.25 8.90608 24.0939 2.75 16.5 2.75C8.90608 2.75 2.75 8.90608 2.75 16.5C2.75 24.0939 8.90608 30.25 16.5 30.25Z" stroke="#AFBFCF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16.5 22V16.5M16.5 11H16.5138" stroke="#AFBFCF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div style={{ flex: '1 1 0', fontSize: 12, fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1.4 }}>
                    <span style={{ color: 'black', fontWeight: '400' }}>YOUR </span>
                    <span style={{ color: '#DD3D3D', fontWeight: '700' }}>NEXT PAYMENT IS DUE ON THE {nextPaymentDate}</span>
                    <span style={{ color: 'black', fontWeight: '700' }}>. </span>
                    <span style={{ color: 'black', fontWeight: '400' }}>PLEASE MAKE SURE TO SETTLE YOUR BALANCE BEFORE THE NEXT PAYMENT DATE. THANK YOU FOR CHOOSING US.</span>
                </div>
            </div>
        </div>
    );
};
