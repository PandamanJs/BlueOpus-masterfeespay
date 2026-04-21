import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useMemo, Fragment } from "react";
import { getStudentsByPhone, getInstitutionType } from "../data/students";
import type { Student } from "../data/students";
import { getPendingTransactionsForStudent, getInvoicesWithBalanceForStudent, getStudentFinancialSummary } from "../lib/supabase/api/transactions";
import type { Transaction } from "../types";
import type { PaymentHistoryRecord } from "../lib/supabase/types";


import { haptics } from "../utils/haptics";
import { Trash2, AlertCircle, AlertTriangle, Shirt, Bus, Users, Home, Package, BookOpen, Coffee, Dumbbell, Tag, Layers, MapPin, Plane } from "lucide-react";
import { toast } from "sonner";
import LogoHeader from "./common/LogoHeader";
import { getSchoolByName } from "../lib/supabase/api/schools";
import type { School } from "../types";
import { useAppStore } from "../stores/useAppStore";
import type { CheckoutService } from "../stores/useAppStore";

interface AddServicesPageProps {
    selectedStudentIds: string[];
    userPhone: string;
    schoolName: string;
    onBack: () => void;
    onNext: () => void;
    onCheckout?: (services: Array<Service & { studentName: string; studentId?: string }>) => void;
}

interface Service {
    id: string;
    description: string;
    amount: number;
    invoiceNo: string;
    term?: number;
    academicYear?: number;
    grade?: string;
    pricing_id?: string;
    invoice_id?: string; // Add this too for consistency
    categoryId?: string; // Link to fee category ID
}



function ChildPill({ name, isActive, hasBalance, onClick }: { name: string; id: string; admissionNumber?: string; isActive: boolean; hasBalance?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                haptics.selection();
                onClick();
            }}
            className={`h-[50px] w-[50px] relative rounded-[16px] shrink-0 transition-all ${isActive
                ? 'bg-[#95e36c]/40 text-[#003630] border-[1.5px] border-[#95e36c]/50 z-10'
                : 'bg-white border-[1.2px] border-gray-100 text-gray-500 hover:bg-gray-50'}`}
            style={isActive ? { boxShadow: '0px 4px 12px rgba(0,0,0,0.1), 0px 2px 4px rgba(0,0,0,0.06)' } : {}}
        >
            <div className="flex flex-row items-center justify-center h-full">
                <div className="flex gap-[10px] items-center justify-center px-[25px] py-[4px] relative h-full">
                    {isActive && (
                        <div className="w-[8px] h-[8px] rounded-full bg-[#95e36c] shrink-0 shadow-[0_0_8px_rgba(149,227,108,0.5)] animate-pulse" />
                    )}
                    <div className={`flex flex-col justify-end leading-[normal] relative shrink-0 text-[10px] whitespace-nowrap ${isActive ? "font-['Space_Grotesk',sans-serif] font-bold text-[#003630]" : "font-['Space_Grotesk',sans-serif] font-medium text-black/40"}`}>
                        <p className="m-0">{name}</p>
                    </div>
                </div>
            </div>
        </button>
    );
}

function StudentInfo({ student, serviceTotal, onClearBalances }: { student: Student; serviceTotal: number; onClearBalances?: () => void }) {
    const hasBalance = student.balances > 0;

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1.5">
                    <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-[#003630] tracking-[-0.3px] leading-tight">
                        {student.name}
                    </h3>
                    <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[11px] leading-none opacity-80">
                        {student.grade}
                    </p>
                    <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[11px] leading-none opacity-80 pl-2 border-l border-[#e5e7eb]">
                        {student.schoolName || 'Twalumbu Education Centre'}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <p className="font-['Inter:Bold',sans-serif] text-[19px] text-[#003630] leading-none">
                        ZMW {serviceTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </p>
                    <span className="text-[9px] text-[#9ca3af] font-black uppercase tracking-[1px] leading-none">Adding to cart</span>
                </div>
            </div>

            {hasBalance && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={onClearBalances}
                    role="button"
                    tabIndex={0}
                    className="group relative flex items-center justify-between p-3 rounded-[14px] bg-[#FFF1F0]/60 border border-[#FFCCC7]/80 shadow-[0px_2px_8px_rgba(255,107,107,0.04)] cursor-pointer active:scale-[0.98] transition-transform"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-[1.5px] leading-none">Due Balance</span>
                            <span className="text-[10px] text-red-400/90 font-medium tracking-tight mt-0.5 group-active:text-red-500 transition-colors">Tap to add outstanding items</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="font-['Inter:Bold',sans-serif] text-[15px] text-red-600">
                            ZMW {student.balances.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-red-400 transition-transform group-hover:translate-x-0.5">
                            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </motion.div>
            )}
        </div>
    );
}



function TrashIcon({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                haptics.selection();
                onClick();
            }}
            className="size-[24px] cursor-pointer text-[#9ca3af] hover:text-red-500 active:scale-90 transition-all flex items-center justify-center rounded-full hover:bg-red-50/50"
            aria-label="Remove item"
        >
            <Trash2 size={18} strokeWidth={2.5} />
        </button>
    );
}

function ServiceTable({ services, onRemoveItem }: { services: Service[]; onRemoveItem: (id: string) => void }) {
    const hasServices = services.length > 0;

    return (
        <div className="content-stretch flex flex-col flex-1 items-start relative shrink-0 w-full animate-scale-in" style={{ animationDelay: '100ms' }}>
            {/* Header */}
            <div className="box-border flex h-[32px] items-center px-[10px] relative shrink-0 w-full mb-2">
                <div className="box-border content-stretch flex gap-[10px] h-full items-center pb-[2px] pt-[4px] px-[6px] relative shrink-0 flex-1">
                    <div className="flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#7a929e] text-[8px] text-nowrap tracking-[-0.08px]">
                        <p className="leading-[24px] whitespace-pre">Service Description</p>
                    </div>
                </div>
                <div className="h-full relative shrink-0 w-[108px]">
                    <div className="flex flex-row items-center justify-center size-full">
                        <div className="box-border content-stretch flex gap-[10px] h-full items-center justify-center px-[10px] py-[4px] relative w-[108px]">
                            <div className="flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] h-full justify-center leading-[0] not-italic relative shrink-0 text-[#7a929e] text-[8px] tracking-[-0.08px] w-[54px]">
                                <p className="leading-[24px]">Amount (ZMW)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header divider removed for seamless look */}

            {/* Services or Empty State */}
            {!hasServices ? (
                <div className="flex-1 flex items-center justify-center w-full py-8">
                    <p className="font-['Inter:Light',sans-serif] font-light leading-[15px] not-italic text-[#a7aaa7] text-[10px] text-center tracking-[-0.1px] px-4">
                        Select a Pupil to View Payment History
                    </p>
                </div>
            ) : (
                <div className="flex-1 w-full">
                    {services.map((service, index) => (
                        <motion.div
                            key={`${service.id}-${index}`}
                            className="box-border content-stretch flex min-h-[40px] items-center pl-[5px] pr-[56px] py-[6px] w-full relative group hover:bg-gradient-to-r hover:from-[rgba(149,227,108,0.03)] hover:to-transparent transition-all duration-200"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.2, ease: "easeOut" }}
                        >
                            <div className="box-border content-stretch flex gap-[10px] items-center px-[10px] py-[4px] relative shrink-0 flex-1 min-w-0">
                                <div className="content-stretch flex flex-col items-start justify-center leading-[0] not-italic relative flex-1 min-w-0">
                                    <div className="flex flex-col font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] justify-center relative w-full text-[12px] text-black">
                                        <p className="leading-[1.4] truncate">{service.description.replace(/\s*\(Per term\)/i, '')}</p>
                                    </div>
                                    <div className="flex flex-col font-['Inter:Light',sans-serif] font-light justify-center relative text-[#003049] text-[8px] tracking-[-0.08px] mt-[2px]">
                                        <p className="leading-[12px]">Invoice No. {service.invoiceNo}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="box-border content-stretch flex gap-[10px] items-center justify-end px-[10px] py-[4px] relative shrink-0 w-[100px]">
                                <div className="flex flex-col font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-nowrap">
                                    <p className="leading-[1.4] whitespace-pre">K{service.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                            <div
                                className="absolute right-0 top-0 h-full px-[12px] flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity"
                                style={{ minWidth: '44px' }}
                            >
                                <div className="absolute right-[18px] top-1/2 -translate-y-1/2">
                                    <TrashIcon onClick={() => onRemoveItem(service.id)} />
                                </div>
                            </div>
                            {/* No dividers for a seamless look */}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AddServicesPage({
    selectedStudentIds, userPhone, schoolName, onBack, onNext, onCheckout }: AddServicesPageProps) {
    const [allStudents, setAllStudents] = useState<Student[]>([]);

    useEffect(() => {
        async function loadStudents() {
            const students = await getStudentsByPhone(userPhone);
            setAllStudents(students);
        }
        loadStudents();
    }, [userPhone]);

    const selectedStudents = allStudents.filter(s => selectedStudentIds.includes(s.id));

    // Determine if this is a university or school
    const institutionType = getInstitutionType(schoolName);
    const isUniversity = institutionType === 'university';

    const [activeStudentId, setActiveStudentId] = useState<string>("");
    const [schoolData, setSchoolData] = useState<School | null>(null);

    useEffect(() => {
        const fetchSchool = async () => {
            if (schoolName) {
                const data = await getSchoolByName(schoolName);
                if (data) setSchoolData(data);
            }
        };
        fetchSchool();
    }, [schoolName]);

    // Set initial active student when data loads
    useEffect(() => {
        if (selectedStudents.length > 0 && !activeStudentId) {
            const firstStudent = selectedStudents[0];
            if (firstStudent) {
                setActiveStudentId(firstStudent.id);
            }
        }
    }, [selectedStudents, activeStudentId]);
    const activeStudent = selectedStudents.find(s => s.id === activeStudentId);
    const [showAddFeesForm, setShowAddFeesForm] = useState(false);
    const [showOtherServicesPopup, setShowOtherServicesPopup] = useState(false);
    const [showUnifiedPopup, setShowUnifiedPopup] = useState(false);
    const studentServices = useAppStore(state => state.studentServices);
    const setStudentServices = useAppStore(state => state.setStudentServices);

    const [financialSummary, setFinancialSummary] = useState<any>(null);
    const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
    const [invoicesWithBalance, setInvoicesWithBalance] = useState<PaymentHistoryRecord[]>([]);

    useEffect(() => {
        if (activeStudentId) {
            // Fetch all required data in parallel
            Promise.all([
                getStudentFinancialSummary(activeStudentId),
                getPendingTransactionsForStudent(activeStudentId),
                getInvoicesWithBalanceForStudent(activeStudentId)
            ]).then(([summary, pending, invoices]) => {
                setFinancialSummary(summary);
                setPendingTransactions(pending);
                setInvoicesWithBalance(invoices);
            });
        }
    }, [activeStudentId]);

    // Get services for the active student
    const activeStudentServices = studentServices[activeStudentId] || [];
    const activeCartRefs = new Set(activeStudentServices.map(s => s.invoiceNo));

    // Determine net credit position
    const hasNetDebt = (activeStudent?.balances || 0) > 0;

    const hasTuitionDebt = hasNetDebt && (pendingTransactions.some((tx) => {
        const meta_data = tx.meta_data as any;
        if (activeCartRefs.has(tx.reference)) return false;
        if (meta_data?.items && Array.isArray(meta_data.items)) {
            return meta_data.items.some((item: any) =>
                item.category === 'tuition' ||
                item.description?.toLowerCase().includes('term') ||
                item.description?.toLowerCase().includes('school fees')
            );
        }
        const desc = meta_data?.description?.toLowerCase() || '';
        return desc.includes('tuition') || desc.includes('school fees');
    }) || invoicesWithBalance.some(invoice => (invoice.balance_remaining || 0) > 0 && !activeCartRefs.has(invoice.reference)));

    // Smart Debt Detection: Categorize outstanding balances by tab
    const debtSummary = useMemo(() => {
        const summary = {
            'fees': [] as Service[],
            'transport': [] as Service[],
            'cafeteria': [] as Service[],
            'uniforms': [] as Service[],
            'boarding': [] as Service[],
            'tours': [] as Service[],
            'clubs': [] as Service[]
        };

        if (!activeStudentId) return summary;

        const currentServices = studentServices[activeStudentId] || [];
        const existingInvoices = new Set(currentServices.map(s => s.invoiceNo));

        const categorize = (item: any) => {
            // Priority 1: Explicit Category from data
            const explicitCat = (item.category || item.service_category || '').toLowerCase();
            if (explicitCat === 'transport' || explicitCat === 'bus') return 'transport';
            if (explicitCat === 'cafeteria' || explicitCat === 'canteen' || explicitCat === 'meal' || explicitCat === 'lunch') return 'cafeteria';
            if (explicitCat === 'boarding' || explicitCat === 'hostel' || explicitCat === 'bed') return 'boarding';
            if (explicitCat === 'uniforms' || explicitCat === 'uniform') return 'uniforms';
            if (explicitCat === 'tours' || explicitCat === 'tour' || explicitCat === 'trip' || explicitCat === 'excursion') return 'tours';
            if (explicitCat === 'clubs' || explicitCat === 'club' || explicitCat === 'society') return 'clubs';

            // Priority 2: Scan nested services (for invoices/aggregate items)
            const services = item.services || (item.invoice_items?.items) || [];
            if (Array.isArray(services) && services.length > 0) {
                for (const svc of services) {
                    const sCat = (svc.category || svc.service_category || '').toLowerCase();
                    if (sCat === 'transport' || sCat === 'bus') return 'transport';
                    if (sCat === 'cafeteria' || sCat === 'canteen' || sCat === 'meal' || sCat === 'lunch') return 'cafeteria';
                    if (sCat === 'boarding' || sCat === 'hostel' || sCat === 'bed') return 'boarding';
                    if (sCat === 'uniforms' || sCat === 'uniform') return 'uniforms';
                    if (sCat === 'tours' || sCat === 'tour' || sCat === 'trip' || sCat === 'excursion') return 'tours';
                    if (sCat === 'clubs' || sCat === 'club' || sCat === 'society') return 'clubs';

                    const sName = (svc.name || svc.description || '').toLowerCase();
                    if (sName.includes('transport') || sName.includes('bus') || sName.includes('shuttle') || sName.includes('route') || sName.includes('zone') || sName.includes('fare')) return 'transport';
                    if (sName.includes('canteen') || sName.includes('lunch') || sName.includes('cafeteria') || sName.includes('meal') || sName.includes('food')) return 'cafeteria';
                    if (sName.includes('boarding') || sName.includes('hostel') || sName.includes('room') || sName.includes('bed')) return 'boarding';
                    if (sName.includes('uniform') || sName.includes('crest') || sName.includes('blazer') || sName.includes('tracksuit') || sName.includes('tie') || sName.includes('badge')) return 'uniforms';
                    if (sName.includes('tour') || sName.includes('trip') || sName.includes('excursion') || sName.includes('expedition') || sName.includes('museum')) return 'tours';
                    if (sName.includes('club') || sName.includes('society') || sName.includes('membership') || sName.includes('association')) return 'clubs';
                }
            }

            // Priority 3: Metadata / Service Name / Reference keywords fallback
            const isTx = 'meta_data' in item;
            const meta = isTx ? item.meta_data : null;
            const desc = (meta?.description || item.service_name || item.name || '').toLowerCase();
            const ref = (item.reference || item.invoice_number || '').toLowerCase();

            if (desc.includes('transport') || desc.includes('bus') || desc.includes('shuttle') || desc.includes('route') || desc.includes('zone') || desc.includes('fare') || ref.startsWith('tr-')) return 'transport';
            if (desc.includes('canteen') || desc.includes('lunch') || desc.includes('cafeteria') || desc.includes('meal') || desc.includes('food') || ref.startsWith('cn-')) return 'cafeteria';
            if (desc.includes('boarding') || desc.includes('hostel') || desc.includes('room') || desc.includes('bed') || ref.startsWith('bd-')) return 'boarding';
            if (desc.includes('uniform') || desc.includes('crest') || desc.includes('blazer') || desc.includes('tracksuit') || desc.includes('tie') || desc.includes('badge')) return 'uniforms';
            if (desc.includes('tour') || desc.includes('trip') || desc.includes('excursion') || desc.includes('expedition') || desc.includes('museum') || ref.startsWith('tr-')) return 'tours';
            if (desc.includes('club') || desc.includes('society') || desc.includes('membership') || desc.includes('association') || ref.startsWith('cl-')) return 'clubs';
            return 'fees';
        };

        // Process Pending Transactions
        pendingTransactions.forEach(tx => {
            if (existingInvoices.has(tx.reference)) return;
            const cat = categorize(tx);
            const meta = tx.meta_data as any;
            const term = meta?.term || (tx as any).term;
            const year = meta?.academicYear || (tx as any).academicYear;
            const baseName = meta?.description || (meta?.items && meta.items[0]?.description) || "Outstanding Balance";
            const name = `${baseName}${term ? ` - Term ${term}` : ''}${year ? ` ${year}` : ''}`;

            summary[cat].push({
                id: tx.id || `tx-${tx.reference}`,
                description: name,
                amount: tx.total_amount,
                invoiceNo: tx.reference,
                invoice_id: tx.id || undefined,
                term: typeof term === 'number' ? term : parseInt(term) || undefined,
                academicYear: typeof year === 'number' ? year : parseInt(year) || undefined
            });
        });

        // Process Invoices with Balance
        invoicesWithBalance.forEach(inv => {
            if (existingInvoices.has(inv.reference)) return;
            const cat = categorize(inv);
            const baseName = inv.service_name || "Fees Settlement";
            const term = inv.term;
            const year = inv.academic_year;
            const name = `${baseName}${term ? ` - Term ${term}` : ''}${year ? ` ${year}` : ''} (Balance)`;

            summary[cat].push({
                id: inv.id || `inv-${inv.reference}`,
                description: name,
                amount: inv.balance_remaining || 0,
                invoiceNo: inv.reference,
                invoice_id: inv.id || undefined,
                term: term,
                academicYear: year
            });
        });

        // Fallback: Check financial summary for un-invoiced items or aggregate balances
        if (financialSummary?.items) {
            financialSummary.items.forEach((item: any) => {
                if (item.balance > 0) {
                    // Avoid duplicating items already handled by invoices or Txs
                    const isAlreadyHandled = [...summary.fees, ...summary.transport, ...summary.cafeteria, ...summary.uniforms, ...summary.boarding, ...summary.tours, ...summary.clubs]
                        .some(d => d.invoiceNo === item.invoice_number || d.id === item.invoice_id);

                    if (!isAlreadyHandled) {
                        const cat = categorize(item);
                        summary[cat].push({
                            id: item.invoice_id || item.id || `sum-${item.name}-${item.type}`,
                            description: `${item.name}${item.status === 'unpaid' ? ' (Outstanding)' : ''}`,
                            amount: item.balance,
                            invoiceNo: item.invoice_number || "Balance",
                            term: item.term || financialSummary.student?.term, // Attempt to pull from summary context
                            academicYear: item.academicYear || financialSummary.student?.year || new Date().getFullYear()
                        });
                    }
                }
            });
        }

        return summary;
    }, [pendingTransactions, invoicesWithBalance, activeStudentId, studentServices, financialSummary]);

    // Calculate specific blocked services
    const { blockedServiceNames } = !hasNetDebt ? { blockedServiceNames: [] } : [...pendingTransactions, ...invoicesWithBalance].reduce((acc, item) => {
        if (activeCartRefs.has(item.reference)) return acc;

        const isTx = 'meta_data' in item;
        const meta_data = isTx ? (item as Transaction).meta_data as any : null;

        // 1. Identify specific service names to block
        if (isTx) {
            if (meta_data?.items && Array.isArray(meta_data.items)) {
                meta_data.items.forEach((subItem: any) => {
                    const name = subItem.name || subItem.description;
                    if (name && !acc.blockedServiceNames.includes(name)) {
                        acc.blockedServiceNames.push(name);
                    }
                });
            } else if (meta_data?.description && !acc.blockedServiceNames.includes(meta_data.description)) {
                acc.blockedServiceNames.push(meta_data.description);
            }
        } else {
            const invoice = item as PaymentHistoryRecord;
            if (invoice.service_name && !acc.blockedServiceNames.includes(invoice.service_name)) {
                acc.blockedServiceNames.push(invoice.service_name);
            }
        }

        return acc;
    }, { blockedServiceNames: [] as string[] });

    // Determine if there is debt for "Other" (non-tuition) services
    const hasOtherDebt = blockedServiceNames.some(name => {
        const low = name.toLowerCase();
        // Exclude names that look like tuition/fees
        return !low.includes('fees') && !low.includes('tuition') && !low.includes('school fees') && !low.includes('grade');
    });

    // Calculate total across all selected students
    const totalAmount = Object.entries(studentServices).reduce((sum, [studentId, services]) => {
        if (selectedStudentIds.includes(studentId)) {
            return sum + services.reduce((serviceSum, service) => serviceSum + service.amount, 0);
        }
        return sum;
    }, 0);

    const handleClearOutstandingDebt = (type: 'tuition' | 'other' | 'all') => {
        const debtsToAdd: Service[] = [];
        // Get all current services to avoid duplicates by invoice number
        const currentServices = studentServices[activeStudentId] || [];
        const existingInvoices = new Set(currentServices.map(s => s.invoiceNo));

        const isTargetType = (name: string) => {
            if (type === 'all') return true;
            const low = name.toLowerCase();
            const isTuition = low.includes('fees') || low.includes('tuition') || low.includes('school fees') || low.includes('grade');
            return type === 'tuition' ? isTuition : !isTuition;
        };

        // 1. Process Pending Transactions
        pendingTransactions.forEach((tx) => {
            const meta_data = tx.meta_data as any;
            const term = meta_data?.term || (tx as any).term;
            const year = meta_data?.academicYear || (tx as any).academicYear;

            let baseName = meta_data?.description || (meta_data?.items && meta_data.items[0]?.description) || "Outstanding Balance";
            const name = `${baseName}${term ? ` - ${typeof term === 'number' ? `Term ${term}` : term}` : ''}${year ? ` ${year}` : ''}`;

            if (isTargetType(name) && !existingInvoices.has(tx.reference)) {
                debtsToAdd.push({
                    id: tx.id || `tx-${tx.reference}`,
                    description: name,
                    amount: tx.total_amount,
                    invoiceNo: tx.reference,
                    invoice_id: tx.id || undefined,  // actual UUID for DB linkage
                    term: term,
                    academicYear: year,
                    isDebt: true
                });
            }
        });

        // 2. Process Historical Invoices with balances
        invoicesWithBalance.forEach((inv) => {
            const baseName = inv.service_name || "School Fees";
            const term = inv.term;
            const year = inv.academic_year;

            const name = `${baseName}${term ? ` - Term ${term}` : ''}${year ? ` ${year}` : ''} (Balance)`;

            if (isTargetType(name) && !existingInvoices.has(inv.reference)) {
                let amount = inv.balance_remaining || 0;

                // Ensure we don't bring the full invoice amount if the student has a lower net balance (partial payment exists)
                if (activeStudent && activeStudent.balances > 0 && amount > activeStudent.balances) {
                    amount = activeStudent.balances;
                }

                debtsToAdd.push({
                    id: `inv-${inv.id || inv.reference}`,
                    description: name,
                    amount: amount,
                    invoiceNo: inv.reference,
                    invoice_id: inv.id || undefined,  // actual UUID for DB linkage
                    term: term,
                    academicYear: year,
                    isDebt: true
                });
            }
        });

        // 3. Fallback: If the student object shows a balance but we couldn't find line-item matches, 
        // add it as a generic item so they can still pay it
        if (debtsToAdd.length === 0 && activeStudent && activeStudent.balances > 0) {
            // Check if we already have a balance-related items in the cart
            const hasBalanceItem = Array.from(existingInvoices).some(ref => ref.startsWith('BAL-') || ref.startsWith('tx-') || ref.startsWith('inv-'));

            if (!hasBalanceItem) {
                const studentName = activeStudent.name || 'Student';
                const gradeContext = activeStudent.grade ? `(${activeStudent.grade}) ` : '';

                debtsToAdd.push({
                    id: `fallback-${activeStudentId}`,
                    description: `${studentName} - ${gradeContext}Outstanding Fees`,
                    amount: activeStudent.balances,
                    invoiceNo: `BAL-${activeStudent.admissionNumber || activeStudentId.slice(0, 4)}`,
                    academicYear: new Date().getFullYear(),
                    isDebt: true
                });
            }
        }

        if (debtsToAdd.length > 0) {
            setStudentServices(prev => ({
                ...prev,
                [activeStudentId]: [...(prev[activeStudentId] || []), ...debtsToAdd]
            }));
            haptics.success();
            toast.success("Debt Added to Cart", {
                description: `Successfully added ${debtsToAdd.length} outstanding item(s) to your payment list.`,
                duration: 4000
            });
        } else {
            toast.info("Already in Cart", {
                description: "Your outstanding balance is already in the payment list.",
                duration: 3000
            });
        }
    };

    const handleAddSchoolFees = () => {
        setShowAddFeesForm(true);
    };

    const handleDone = (grade: string, year: string, term: string, price: number) => {
        setShowAddFeesForm(false);
        // Parse term number
        const termNum = parseInt(term.replace(/\D/g, '')) || 1;
        const yearNum = parseInt(year) || new Date().getFullYear();

        const newService: Service = {
            id: `service-${Date.now()}`,
            description: `${grade} - ${term} ${year}`,
            amount: price,
            invoiceNo: "202",
            term: termNum,
            academicYear: yearNum,
            grade: grade
        };
        setStudentServices(prev => ({
            ...prev,
            [activeStudentId]: [...(prev[activeStudentId] || []), newService]
        }));
    };

    const handleAddOtherServices = () => {
        setShowOtherServicesPopup(true);
    };

    const handleOtherServicesDone = (services: Array<{
        id: string;
        name: string;
        amount: number;
        category: string;
        term: string;
        route?: string;
        paymentPeriod?: string;
        uniformItems?: string[];
    }>) => {
        setShowOtherServicesPopup(false);

        if (services.length === 0) return;

        // Get existing services for the active student
        const existingServices = studentServices[activeStudentId] || [];

        // Convert the school services to the Service format, filtering out duplicates
        const newServices: Service[] = services
            .filter(service => {
                // Create a signature for this service based on all key attributes
                const signature = `${service.name}-${service.term}${service.route ? `-${service.route}` : ''}${service.paymentPeriod ? `-${service.paymentPeriod}` : ''}${service.uniformItems ? `-${service.uniformItems.join(',')}` : ''}`;

                // Check if a service with this signature already exists
                const isDuplicate = existingServices.some(existing => {
                    const existingSignature = existing.description; // Simpler check for now
                    return existingSignature === signature;
                });

                return !isDuplicate;
            })
            .map((service, index) => {
                // Check if this service name matches a blocked service (to add debt instead of new service)
                const relevantDebt = [...pendingTransactions, ...invoicesWithBalance].find(item => {
                    if (activeCartRefs.has(item.reference)) return false;
                    const isTx = 'meta_data' in item;
                    const debtName = (isTx ? ((item as any).meta_data?.description || "Service") : (item as any).service_name)?.toLowerCase() || "";
                    const sName = service.name.toLowerCase();
                    return debtName === sName || debtName.startsWith(sName + " -") || debtName.startsWith(sName + " (");
                });

                if (relevantDebt) {
                    const isTx = 'meta_data' in relevantDebt;
                    const metadata = isTx ? (relevantDebt as any).meta_data as any : null;
                    const name = (isTx ? (metadata?.description || (metadata?.items && metadata.items[0]?.description)) : (relevantDebt as any).service_name) || service.name;

                    return {
                        id: relevantDebt.id || `debt-${relevantDebt.reference}`,
                        description: isTx ? name : `${name} (Balance)`,
                        amount: isTx ? (relevantDebt as any).total_amount : (relevantDebt as any).balance_remaining,
                        invoiceNo: relevantDebt.reference,
                        term: isTx ? (metadata?.term || (relevantDebt as any).term) : (relevantDebt as any).term,
                        academicYear: isTx ? (metadata?.academicYear || (relevantDebt as any).academicYear) : (relevantDebt as any).academic_year,
                        isDebt: true
                    };
                }

                // Generate a unique ID for new service
                const uniqueId = `${service.id}-${service.term.replace(/\s+/g, '-')}-${service.route ? service.route.replace(/\s+/g, '-') : 'no-route'}-${Date.now()}-${index}`;

                const buildServiceDescriptionLocal = (s: any) => {
                    let desc = s.name;
                    if (s.term) desc += ` - ${s.term}`;
                    if (s.route) desc += ` (${s.route})`;
                    return desc;
                };

                const newSvc: Service = {
                    id: uniqueId,
                    description: buildServiceDescriptionLocal(service),
                    amount: service.amount,
                    invoiceNo: "202",
                    term: parseInt(service.term.replace(/\D/g, '')) || 1,
                    academicYear: new Date().getFullYear(),
                    pricing_id: service.id, // PRESERVE THE ORIGINAL FEE ITEM ID
                    grade: activeStudent?.grade
                };

                return newSvc;
            });

        // Only add if there are new services (not all duplicates)
        if (newServices.length > 0) {
            setStudentServices(prev => ({
                ...prev,
                [activeStudentId]: [...(prev[activeStudentId] || []), ...newServices]
            }));
        }
    };

    const handleRemoveService = (serviceId: string) => {
        setStudentServices(prev => ({
            ...prev,
            [activeStudentId]: (prev[activeStudentId] || []).filter(s => s.id !== serviceId)
        }));
    };

    // Check if any services have been added
    const hasServices = Object.values(studentServices).some(services => services.length > 0);

    // Use the onCheckout prop passed from App.tsx to ensure history is updated
    // const navigateToPage = useAppStore(state => state.navigateToPage);

    const setCheckoutServices = useAppStore(state => state.setCheckoutServices);
    const setPaymentAmount = useAppStore(state => state.setPaymentAmount);

    const handleAddService = (service: Service) => {
        if (!activeStudentId) {
            console.error("No active student selected");
            toast.error("Please select a student first");
            return;
        }

        // Defensive check for service data
        const safeService = {
            ...service,
            amount: typeof service.amount === 'number' && !isNaN(service.amount) ? service.amount : 0,
            description: service.description || "Service Item",
            id: service.id || `fallback-${Date.now()}`
        };

        console.log(`[AddServicesPage] Adding service for ${activeStudentId}:`, safeService);

        setStudentServices(prev => {
            const current = (prev[activeStudentId] || []).filter(s => s && s.id);

            // Check for duplicates
            if (current.some(s => s.id === safeService.id)) {
                console.warn("Item already in cart:", safeService.id);
                toast.error("Item already in cart");
                return prev;
            }

            const updated = {
                ...prev,
                [activeStudentId]: [...current, safeService]
            };

            toast.success(`Added ${safeService.description}`);
            return updated;
        });
    };

    const handleNextOrCheckout = () => {
        haptics.success();

        // Final aggregation of all selected services for all students
        const allCheckoutServices: CheckoutService[] = [];

        Object.entries(studentServices).forEach(([studentId, services]) => {
            // Only aggregate services for students currently selected/active in this session
            if (!selectedStudentIds.includes(studentId)) {
                console.log(`[AddServicesPage] Skipping student ${studentId} as they are not in selectedStudentIds`);
                return;
            }

            const student = allStudents.find(s => s.id === studentId);
            const studentName = student ? student.name : "Student";

            services.forEach(s => {
                allCheckoutServices.push({
                    id: s.id,
                    description: s.description,
                    amount: s.amount,
                    invoiceNo: s.invoiceNo,
                    invoice_id: s.invoice_id,
                    pricing_id: s.pricing_id,
                    studentName: studentName,
                    studentId: studentId,
                    term: s.term,
                    academicYear: s.academicYear,
                    isDebt: s.isDebt,
                    categoryId: s.categoryId,
                    grade: s.grade || student?.grade,
                    studentId: student?.admissionNumber || studentId
                });
            });
        });

        // Update global store
        setCheckoutServices(allCheckoutServices);
        setPaymentAmount(totalAmount);

        // Navigate to checkout summary
        // Navigate to checkout summary using the prop that updates browser history
        if (onCheckout) {
            onCheckout(allCheckoutServices);
        } else {
            onNext();
        }

    };

    return (
        <div className="bg-white h-screen w-full overflow-hidden flex items-center justify-center gap-3">
            <div className="relative w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] h-screen mx-auto shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col">
                <LogoHeader showBackButton={false} onBack={() => {
                    haptics.selection();
                    onBack();
                }} />

                {/* Sticky Header: Cart Info & Student Tabs */}
                <div className="bg-white z-20 border-b border-gray-100/50 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)]">
                    {/* Header Card */}
                    <div className="px-[44px] pt-4 mb-2">
                        <div className="bg-[#f9fafb] rounded-[22px] p-[16px] shadow-inner flex flex-col gap-2">
                            <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] font-bold leading-tight not-italic text-[20px] text-black tracking-[-0.18px] flex items-center gap-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                                Products/Services Cart
                            </p>
                            <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] leading-relaxed not-italic text-[#6b7280] text-[13px] tracking-[-0.12px]">
                                Add the products and services you would like to pay for and proceed to checkout.
                            </p>
                        </div>
                    </div>

                    {/* Child Selection Section */}
                    <div className="px-[24px] pb-4 overflow-x-auto no-scrollbar">
                        <div className="flex gap-[10px] items-center relative w-max px-1">
                            {selectedStudents.map(student => (
                                <ChildPill
                                    key={student.id}
                                    name={student.name}
                                    id={student.id}
                                    isActive={activeStudentId === student.id}
                                    admissionNumber={student.admissionNumber}
                                    hasBalance={student.balances > 0}
                                    onClick={() => setActiveStudentId(student.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Container */}
                <div className="flex-1 flex flex-col pt-4 pb-[280px] overflow-y-auto no-scrollbar gap-4">
                    <div className="px-[24px] flex flex-col gap-4">
                        <div className="flex flex-col gap-[18px]">
                            {/* Child Services Empty State (when no popup is open) */}
                            {!showAddFeesForm && !showOtherServicesPopup && activeStudentServices.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-center bg-white/50 border border-dashed border-gray-300 rounded-[20px]">
                                    <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[#6b7280] text-[14px]">No services selected yet</p>
                                    <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[#9ca3af] text-[12px] mt-1">Add fees or services below</p>
                                </div>
                            )}

                            {/* Service Table - only visible when not adding stuff */}
                            {!showAddFeesForm && !showOtherServicesPopup && activeStudentServices.length > 0 && (
                                <div className="w-full">
                                    <ServiceTable services={activeStudentServices} onRemoveItem={handleRemoveService} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed Bottom */}
                <div className="fixed bottom-0 left-0 right-0 bg-white px-[20px] pt-[16px] pb-[32px] shadow-[0px_-4px_24px_rgba(0,0,0,0.08)] z-50 transition-all duration-300">
                    <div className="w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] mx-auto flex flex-col gap-[16px]">

                        {!showAddFeesForm && !showOtherServicesPopup && (
                            <div className="flex flex-col gap-[16px] w-full pt-4">
                                <div className="w-full h-[1.5px] bg-gray-200" />
                                <div className="flex items-center justify-between px-2 py-2">
                                    <p className="font-['Inter',sans-serif] font-black text-[20px] text-bold tracking-tight">Subtotal</p>
                                    <p className="font-['Inter',sans-serif] font-black text-[20px] text-bold tracking-tight">
                                        K{(studentServices[activeStudentId] || []).reduce((sum, s) => sum + s.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="w-full">
                                    <button
                                        onClick={() => {
                                            console.log("Add Products/Services clicked");
                                            haptics.buttonPress();
                                            setShowUnifiedPopup(true);
                                        }}
                                        className="h-[55px] w-full rounded-[14px] border border-[#e5e7eb] bg-[#f9fafb] flex items-center justify-center gap-3 px-5 active:scale-[0.98] transition-all group hover:border-[#003630]/20 hover:bg-white shadow-sm"
                                    >
                                        <div className="bg-[#003630]/5 p-1.5 rounded-xl group-active:bg-[#003630]/10 transition-colors">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 5v14M5 12h14" />
                                            </svg>
                                        </div>
                                        <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-[#003630] tracking-[-0.3px]">
                                            Add Products / Services
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Unified Checkout Bar */}
                        <div
                            className="bg-white rounded-[12px] p-2 flex items-center justify-between border-[2px] border-[#e2e8f0] h-[70px]"
                            style={{ boxShadow: '0px 25px 60px rgba(0,0,0,0.15), 0px 4px 12px rgba(0,0,0,0.08)' }}
                        >
                            <div className="flex items-center gap-[14px] pl-[16px]">
                                <div className="text-[#003630]">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
                                    </svg>
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-['Inter',sans-serif] font-bold text-[18px] text-black leading-none tracking-tight">
                                        K{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="font-['Inter',sans-serif] text-[10px] text-[#a1a1a1] font-light uppercase tracking-[0.8px] mt-1">GRAND TOTAL</p>
                                </div>
                            </div>

                            <div className="relative group p-2 z-20">
                                <button
                                    onClick={() => {
                                        if (hasServices) {
                                            haptics.buttonPress();
                                            handleNextOrCheckout();
                                        }
                                    }}
                                    disabled={!hasServices}
                                    className={`h-[50px] w-[155px] relative rounded-[14px] transition-all duration-300 flex items-center justify-center gap-[16px] z-30 ${hasServices
                                        ? 'bg-[#003630] touch-manipulation cursor-pointer active:scale-[0.97] drop-shadow-[0_15px_15px_rgba(0,0,0,0.4)]'
                                        : 'bg-gray-50 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-[16px] h-full w-full">
                                        <p className={`font-['Inter',sans-serif] font-extrabold text-[13px] ${hasServices ? 'text-white' : 'text-gray-300'}`}>
                                            {totalAmount > 0 ? "Checkout" : "Next"}
                                        </p>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={hasServices ? "text-[#95e36c]" : "text-gray-200"}>
                                            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    {hasServices && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>



            </div>

            {/* Unified Selection Popup - Rendered at top level to avoid clipping */}
            <AnimatePresence mode="wait">
                {showUnifiedPopup && (
                    <UnifiedServicesPopup
                        key="unified-popup"
                        onClose={() => setShowUnifiedPopup(false)}
                        onConfirm={(items) => {
                            // Ensure items are unique by ID to prevent key clashes
                            const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());
                            setStudentServices(prev => ({
                                ...prev,
                                [activeStudentId]: uniqueItems
                            }));
                            setShowUnifiedPopup(false);
                            toast.success(`Successfully updated ${uniqueItems.length} items in cart`);
                        }}
                        schoolName={schoolName}
                        activeStudent={activeStudent}
                        schoolData={schoolData}
                        invoices={invoicesWithBalance}
                        initialItems={activeStudentServices}
                        debtSummary={debtSummary}
                        activeStudentId={activeStudentId}
                        financialSummary={financialSummary}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * NEW Unified Services Popup
 * A plain slide-up for now to be customized
 */
const POPUP_TABS = [
    { id: 'fees', label: 'School Fees', icon: true },
    { id: 'transport', label: 'Transport' },
    { id: 'cafeteria', label: 'Cafeteria' },
    { id: 'uniforms', label: 'Uniforms' }
] as const;

function UnifiedServicesPopup({
    onClose,
    onConfirm,
    schoolName,
    activeStudent,
    invoices,
    schoolData,
    initialItems,
    debtSummary,
    activeStudentId,
    financialSummary
}: {
    onClose: () => void;
    onConfirm: (items: Service[]) => void;
    schoolName: string;
    activeStudent?: Student;
    invoices: PaymentHistoryRecord[];
    schoolData: School | null;
    initialItems: Service[];
    debtSummary: {
        fees: Service[];
        transport: Service[];
        cafeteria: Service[];
        uniforms: Service[];
    };
    activeStudentId: string;
    financialSummary?: any;
}) {
    const [stagedItems, setStagedItems] = useState<Service[]>(initialItems);

    const buildServiceDescription = (s: any) => {
        let desc = s.name || s.description;
        if (s.term) desc += ` - ${s.term}`;
        if (s.route) desc += ` (${s.route})`;
        if (s.paymentPeriod) desc += ` [${s.paymentPeriod}]`;
        return desc;
    };

    const detectFrequency = (name: string): "monthly" | "termly" | "yearly" | "weekly" | "daily" => {
        const low = name.toLowerCase();
        if (low.includes('month')) return 'monthly';
        if (low.includes('week')) return 'weekly';
        if (low.includes('day')) return 'daily';
        if (low.includes('year')) return 'yearly';
        return 'termly';
    };

    const handleStageService = (service: Service) => {
        setStagedItems(prev => {
            const exists = prev.some(s => s.id === service.id);
            if (exists) {
                return prev.filter(s => s.id !== service.id);
            }
            return [...prev, service];
        });
        haptics.selection();
    };

    const isStaged = (id: string) => stagedItems.some(s => s.id === id);


    // Dynamically build tabs based on non-empty services in schoolData
    const tabs = useMemo(() => {
        const simplify = (name: string) => {
            if (!name) return "";
            const lower = name.toLowerCase();
            if (lower.includes('tuition')) return 'School Fees';
            if (lower.includes('transport')) return 'Transport';
            if (lower.includes('cafeteria') || lower.includes('meals')) return 'Cafeteria';
            if (lower.includes('uniform')) return 'Uniforms';
            if (lower.includes('trip') || lower.includes('tour')) return 'Tours';
            if (lower.includes('sport') || lower.includes('club')) return 'Clubs';
            if (lower.includes('boarding')) return 'Boarding';
            return name;
        };

        const t: { id: string; label: string; count?: number }[] = [];

        // 1. School Fees
        t.push({
            id: 'fees',
            label: simplify(schoolData?.category_names?.tuition || 'School Fees'),
            count: stagedItems.filter(s => s.id.includes('fee')).length
        });

        // 2. Transport
        t.push({
            id: 'transport',
            label: simplify(schoolData?.category_names?.transport || 'Transport'),
            count: stagedItems.filter(s => s.id.includes('route')).length
        });

        // 3. Cafeteria
        t.push({
            id: 'cafeteria',
            label: simplify(schoolData?.category_names?.canteen || 'Cafeteria'),
            count: stagedItems.filter(s => s.id.includes('canteen')).length
        });

        // 4. Uniforms
        t.push({
            id: 'uniforms',
            label: 'Uniforms',
            count: stagedItems.filter(s => s.category?.toLowerCase() === 'uniform').length
        });

        // 5. Tours/Trips
        t.push({
            id: 'trips',
            label: 'Tours',
            count: stagedItems.filter(s => s.category?.toLowerCase() === 'trips').length
        });

        // 6. Clubs/Sports
        t.push({
            id: 'sports',
            label: 'Clubs',
            count: stagedItems.filter(s => s.category?.toLowerCase() === 'sports').length
        });

        // 7. Boarding
        t.push({
            id: 'boarding',
            label: 'Boarding',
        });

        return t;
    }, [schoolData, stagedItems, invoices]);

    const [activeTab, setActiveTab] = useState<string>('fees');

    // Ensure activeTab is valid if tabs change
    useEffect(() => {
        if (!tabs.find(t => t.id === activeTab)) {
            setActiveTab('fees');
        }
    }, [tabs, activeTab]);

    const [selectedGrade, setSelectedGrade] = useState<string>(activeStudent?.grade || "");
    const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(new Date().getFullYear());
    const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

    // Transport specific state
    const [selectedRouteId, setSelectedRouteId] = useState<string>("");
    const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);

    const selectedRoute = schoolData?.bus_routes?.find(r => r.id === selectedRouteId);

    // Cafeteria specific state
    const [selectedCanteenPlanId, setSelectedCanteenPlanId] = useState<string>("");
    const [isCanteenDropdownOpen, setIsCanteenDropdownOpen] = useState(false);
    const [isOtherDropdownOpen, setIsOtherDropdownOpen] = useState(false);
    const [isOthersMenuOpen, setIsOthersMenuOpen] = useState(false);
    const [selectedOtherCategory, setSelectedOtherCategory] = useState<string>("All");
    const [otherQuantities, setOtherQuantities] = useState<Record<string, number>>({});

    const extraCategories = useMemo(() => {
        if (!schoolData?.other_services) return ['All'];
        const cats = new Set(schoolData.other_services.map(s => s.category).filter(Boolean));
        return ['All', ...Array.from(cats)];
    }, [schoolData]);
    const selectedCanteenPlan = schoolData?.canteen_plans?.find(p => p.id === selectedCanteenPlanId);

    // Subscription Frequency state

    // Boarding specific state
    const [selectedBoardingRoomId, setSelectedBoardingRoomId] = useState<string>("");
    const [isBoardingDropdownOpen, setIsBoardingDropdownOpen] = useState(false);
    const selectedBoardingRoom = schoolData?.boarding_rooms?.find(r => r.id === selectedBoardingRoomId);
    const [boardingFrequency, setBoardingFrequency] = useState<'monthly' | 'termly' | 'yearly' | 'weekly' | 'daily'>('termly');
    const [transportFrequency, setTransportFrequency] = useState<'monthly' | 'termly' | 'yearly' | 'weekly' | 'daily'>('termly');
    const [cafeteriaFrequency, setCafeteriaFrequency] = useState<'monthly' | 'termly' | 'yearly' | 'weekly' | 'daily'>('termly');
    const [sportsFrequency, setSportsFrequency] = useState<'monthly' | 'termly' | 'yearly'>('termly');

    // Time-based filtering: Terms and months that have passed should not be visible
    const isPastDate = (monthOrTerm: string | number, year: number) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11
        
        // Past years are all past
        if (year < currentYear) return true;
        // Future years are never past
        if (year > currentYear) return false;
        
        // Current year: check month index
        if (typeof monthOrTerm === 'number') {
            // Term 1: Ends when April (index 3) starts
            if (monthOrTerm === 1 && currentMonth >= 3) return true;
            // Term 2: Ends when August (index 7) starts
            if (monthOrTerm === 2 && currentMonth >= 7) return true;
            // Term 3 (Sept-Dec): Never past if we are in the current year
            return false;
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const targetIndex = months.findIndex(m => m.startsWith(monthOrTerm as string));
        if (targetIndex === -1) return false;
        return currentMonth > targetIndex;
    };
    const [selectedSportsPlanId, setSelectedSportsPlanId] = useState<string>("");
    const [isSportsDropdownOpen, setIsSportsDropdownOpen] = useState(false);

    // Uniforms/Other state
    const [selectedOtherId, setSelectedOtherId] = useState<string>("");
    const selectedOther = schoolData?.other_services?.find(s => s.id === selectedOtherId);

    // Auto-select the student's grade when data loads or changes
    useEffect(() => {
        if (activeStudent?.grade && !selectedGrade) {
            setSelectedGrade(activeStudent.grade);
        }
    }, [activeStudent, selectedGrade]);

    // SMART AUTO-SELECT: Last used Transport & Cafeteria from history
    useEffect(() => {
        if (!financialSummary?.transactions || !schoolData) return;

        // 1. Auto-select last transport route
        if (!selectedRouteId) {
            const lastTransportTx = [...financialSummary.transactions]
                .sort((a, b) => new Date(b.initiated_at).getTime() - new Date(a.initiated_at).getTime())
                .find(tx => {
                    const meta = tx.meta_data || tx.metadata;
                    const services = meta?.services || meta?.items || [];
                    return services.some(s =>
                        s.category === 'transport' ||
                        (s.name || s.description || '').toLowerCase().includes('transport') ||
                        (s.name || s.description || '').toLowerCase().includes('bus')
                    );
                });

            if (lastTransportTx) {
                const meta = lastTransportTx.meta_data || lastTransportTx.metadata;
                const services = meta?.services || meta?.items || [];
                const transportSvc = services.find(s =>
                    s.category === 'transport' ||
                    (s.name || s.description || '').toLowerCase().includes('transport') ||
                    (s.name || s.description || '').toLowerCase().includes('bus')
                );

                if (transportSvc) {
                    const targetId = transportSvc.pricing_id || transportSvc.id;
                    const matchedRoute = schoolData.bus_routes?.find(r => r.id === targetId) ||
                        schoolData.bus_routes?.find(r => r.name === transportSvc.name);

                    if (matchedRoute) {
                        setSelectedRouteId(matchedRoute.id);
                        console.log(`[AutoSelect] Restored last transport route: ${matchedRoute.name}`);
                    }
                }
            }
        }

        // 2. Auto-select last cafeteria plan
        if (!selectedCanteenPlanId) {
            const lastCafeteriaTx = [...financialSummary.transactions]
                .sort((a, b) => new Date(b.initiated_at).getTime() - new Date(a.initiated_at).getTime())
                .find(tx => {
                    const meta = tx.meta_data || tx.metadata;
                    const services = meta?.services || meta?.items || [];
                    return services.some(s =>
                        s.category === 'canteen' ||
                        s.category === 'cafeteria' ||
                        (s.name || s.description || '').toLowerCase().includes('canteen') ||
                        (s.name || s.description || '').toLowerCase().includes('meal')
                    );
                });

            if (lastCafeteriaTx) {
                const meta = lastCafeteriaTx.meta_data || lastCafeteriaTx.metadata;
                const services = meta?.services || meta?.items || [];
                const cafeteriaSvc = services.find(s =>
                    s.category === 'canteen' ||
                    s.category === 'cafeteria' ||
                    (s.name || s.description || '').toLowerCase().includes('canteen') ||
                    (s.name || s.description || '').toLowerCase().includes('meal')
                );

                if (cafeteriaSvc) {
                    const targetId = cafeteriaSvc.pricing_id || cafeteriaSvc.id;
                    const matchedPlan = schoolData.canteen_plans?.find(p => p.id === targetId) ||
                        schoolData.canteen_plans?.find(p => p.name === cafeteriaSvc.name);

                    if (matchedPlan) {
                        setSelectedCanteenPlanId(matchedPlan.id);
                        console.log(`[AutoSelect] Restored last cafeteria plan: ${matchedPlan.name}`);
                    }
                }
            }
        }
    }, [financialSummary, schoolData, selectedRouteId, selectedCanteenPlanId]);

    // Filter institutional fees by selected grade
    const gradeFees = schoolData?.grade_pricing?.filter(gp =>
        selectedGrade ? gp.name.toLowerCase().includes(selectedGrade.toLowerCase()) : true
    ) || [];

    const selectedFee = schoolData?.grade_pricing?.find(gp =>
        gp.name.toLowerCase() === selectedGrade.toLowerCase()
    );

    // Debt Lock Logic: Hide new services if outstanding balance exists for current category
    const activeTabDebts = debtSummary[activeTab as keyof typeof debtSummary] || [];
    const isTabLocked = activeTabDebts.some(debt => !isStaged(debt.id));

    return (
        <>
            <motion.div
                className="absolute inset-0 w-full h-full z-[9999] bg-white flex flex-col overflow-hidden rounded-t-[40px] shadow-[0px_-20px_50px_rgba(0,0,0,0.1)]"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 350, mass: 0.8 }}
            >
                {/* Single Scrollable container for the entire page to let browser handle scroll native mapping */}
                <div className="flex-1 min-h-0 overflow-y-auto bg-[#fdfdfd] scroll-smooth touch-pan-y relative pb-2 rounded-t-[40px]">

                    {/* Sticky Header Section */}
                    <div
                        className="sticky top-0 px-6 pt-8 pb-4 bg-white border-b border-gray-100/60 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]"
                        style={{ zIndex: 99999, isolation: 'isolate' }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">

                                <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] font-bold text-black tracking-tight">
                                    Add Products/Services
                                </h2>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    haptics.selection();
                                    onClose();
                                }}
                                className="w-[28px] h-[28px] flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-700 active:scale-90 transition-all pointer-events-auto cursor-pointer"
                                style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12), 0px 2px 4px rgba(0,0,0,0.08)', zIndex: 999999 }}
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Multi-Row Tab Selector */}
                        <div className="self-stretch p-2 bg-[#FAFAFA] rounded-[20px] outline outline-[0.50px] outline-offset-[-0.50px] outline-[#E6E6E6] flex flex-col justify-start items-start gap-2 overflow-hidden"
                            style={{ boxShadow: 'inset 0px 4px 12px rgba(0,0,0,0.08), inset 0px 8px 24px rgba(0,0,0,0.05), inset 0px 1px 4px rgba(0,0,0,0.1)' }}>
                            {/* Row 1 */}
                            <div className="w-full h-12 relative flex">
                                {tabs.slice(0, 4).map((tab, idx) => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                haptics.selection();
                                                setActiveTab(tab.id);
                                            }}
                                            className={`flex-1 flex justify-center items-center h-full relative z-10`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeTabPill"
                                                    className="absolute inset-0 bg-white rounded-[12px] shadow-[0px_8px_24px_rgba(0,0,0,0.12),0px_2px_4px_rgba(0,0,0,0.08)] border-[1.5px] border-[#95e36c]"
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            <span className={`relative z-20 text-center text-[11px] font-['Inter',sans-serif] tracking-tight ${isActive ? 'text-black font-bold' : 'text-[#686868] font-normal'}`}>
                                                {tab.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {/* Row 2 */}
                            <div className="w-full h-12 relative flex">
                                {tabs.slice(4).map((tab, idx) => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                haptics.selection();
                                                setActiveTab(tab.id);
                                            }}
                                            className={`flex-1 flex justify-center items-center h-full relative z-10`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeTabPill"
                                                    className="absolute inset-0 bg-white rounded-[12px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.15)] border-[1.5px] border-[#95e36c]"
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            <span className={`relative z-20 text-center text-[11px] font-['Inter',sans-serif] tracking-tight ${isActive ? 'text-black font-bold' : 'text-[#686868] font-normal'}`}>
                                                {tab.label}
                                            </span>
                                        </button>
                                    );
                                })}
                                {/* Empty filler if row is not full */}
                                {tabs.slice(4).length < 4 && Array.from({ length: 4 - tabs.slice(4).length }).map((_, i) => (
                                    <div key={`filler-${i}`} className="flex-1 h-full" />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pt-4" style={{ position: 'relative', zIndex: 1, isolation: 'isolate' }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                {activeTab === 'fees' ? (
                                    <div className="flex flex-col gap-6">
                                        {/* Debt Alert Card (Unified) */}
                                        {debtSummary.fees.some(d => !isStaged(d.id)) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-[#FFF1F0] rounded-[24px] p-5 flex flex-col gap-4 border border-[#FFCCC7]/60 mb-6"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="text-[#FF4D4F] shrink-0 mt-0.5" size={20} strokeWidth={2.5} />
                                                    <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[15px] text-[#262626] leading-relaxed">
                                                        You have a balance for {schoolData?.category_names?.tuition?.toLowerCase() || 'school fees'} of <span className="font-bold font-['Inter:Bold',sans-serif]">K{debtSummary.fees.reduce((acc, d) => acc + d.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        haptics.success();
                                                        const itemsToAdd = debtSummary.fees;
                                                        setStagedItems(prev => {
                                                            const existingIds = new Set(prev.map(p => p.id));
                                                            const newItems = itemsToAdd.filter(item => !existingIds.has(item.id));
                                                            return [...prev, ...newItems];
                                                        });
                                                        toast.success(`Staged ${itemsToAdd.length} outstanding ${schoolData?.category_names?.tuition?.toLowerCase() || 'fee'} payments`);
                                                    }}
                                                    className="w-full h-[52px] bg-transparent border-[1.5px] border-[#FF4D4F]/80 text-[#FF4D4F] rounded-[16px] flex items-center justify-center gap-2.5 font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[15px] active:scale-[0.98] transition-all hover:bg-[#FF4D4F]/5"
                                                >
                                                    <div className="size-[22px] rounded-full border border-[#FF4D4F]/40 flex items-center justify-center">
                                                        <span className="text-[18px] leading-none mb-0.5">+</span>
                                                    </div>
                                                    <span>Add to Cart to Clear Balance</span>
                                                </button>
                                            </motion.div>
                                        )}

                                        {/* Available Fees for Selection - Gated */}
                                        {!isTabLocked && (
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[13px] font-semibold text-gray-500 mb-1 ml-1 text-left w-full">Select Grade</label>

                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setIsGradeDropdownOpen(!isGradeDropdownOpen);
                                                        }}
                                                        className="w-full h-[60px] bg-white border border-gray-100 rounded-[24px] px-6 flex items-center justify-between shadow-[0px_4px_16px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all group pointer-events-auto cursor-pointer"
                                                    >
                                                        <div className="flex flex-col items-start overflow-hidden">
                                                            <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-gray-900 truncate">
                                                                {selectedFee
                                                                    ? `${selectedFee.name} Tuition - K${selectedFee.price.toLocaleString()}`
                                                                    : "Choose a Grade..."
                                                                }
                                                            </span>
                                                        </div>
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${isGradeDropdownOpen ? 'rotate-180' : ''}`}>
                                                            <path d="m6 9 6 6 6-6" />
                                                        </svg>
                                                    </button>

                                                    <AnimatePresence>
                                                        {isGradeDropdownOpen && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                className="absolute top-full mt-3 left-0 right-0 bg-white border border-gray-100 rounded-[24px] shadow-[0px_20px_50px_rgba(0,0,0,0.18)] z-[90] overflow-hidden max-h-[300px] overflow-y-auto pointer-events-auto"
                                                            >
                                                                <div className="p-3 flex flex-col gap-1">
                                                                    {schoolData?.grade_pricing?.map((gp) => (
                                                                        <button
                                                                            key={gp.value}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setSelectedGrade(gp.name);
                                                                                setIsGradeDropdownOpen(false);
                                                                                haptics.selection();
                                                                            }}
                                                                            className={`w-full px-5 py-4 text-left rounded-[18px] transition-all flex items-center justify-between group pointer-events-auto cursor-pointer ${selectedGrade === gp.name ? 'bg-[#003630] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[10px] ${selectedGrade === gp.name ? 'text-white' : 'text-gray-900 group-hover:text-[#003630]'}`}>
                                                                                    {gp.name} Tuition
                                                                                </span>
                                                                                <span className={`text-[12px] ${selectedGrade === gp.name ? 'text-white/60' : 'text-gray-400'}`}>
                                                                                    Institutional Fee
                                                                                </span>
                                                                            </div>
                                                                            <span className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[10px] ${selectedGrade === gp.name ? 'text-white' : 'text-[#003630]'}`}>
                                                                                K{gp.price.toLocaleString()}
                                                                            </span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {!isGradeDropdownOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex flex-col"
                                                    >
                                                        <div className="mt-2 flex flex-col gap-3">
                                                            <label className="text-[13px] font-semibold text-gray-500 mb-1 ml-1 text-left w-full">Academic Year</label>
                                                            <div className="relative">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setIsYearDropdownOpen(!isYearDropdownOpen);
                                                                    }}
                                                                    className="w-full h-[60px] bg-white border border-gray-100 rounded-[24px] px-6 flex items-center justify-between shadow-[0px_4px_16px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all group pointer-events-auto cursor-pointer"
                                                                >
                                                                    <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-gray-900">
                                                                        {selectedAcademicYear}
                                                                    </span>
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${isYearDropdownOpen ? 'rotate-180' : ''}`}>
                                                                        <path d="m6 9 6 6 6-6" />
                                                                    </svg>
                                                                </button>

                                                                <AnimatePresence>
                                                                    {isYearDropdownOpen && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: -10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            exit={{ opacity: 0, y: -10 }}
                                                                            className="absolute top-full mt-3 left-0 right-0 bg-white border border-gray-100 rounded-[24px] shadow-[0px_20px_50px_rgba(0,0,0,0.18)] z-[90] overflow-hidden max-h-[300px] overflow-y-auto pointer-events-auto"
                                                                        >
                                                                            <div className="p-3 flex flex-col gap-1">
                                                                                {[new Date().getFullYear(), new Date().getFullYear() + 1].map((year) => (
                                                                                    <button
                                                                                        key={year}
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            setSelectedAcademicYear(year);
                                                                                            setIsYearDropdownOpen(false);
                                                                                            haptics.selection();
                                                                                        }}
                                                                                        className={`w-full px-5 py-4 text-left rounded-[18px] text-[13px] transition-all flex items-center justify-between group pointer-events-auto cursor-pointer ${selectedAcademicYear === year ? 'bg-[#003630] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                                                                                    >
                                                                                        <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[13px] ${selectedAcademicYear === year ? 'text-white' : 'text-gray-900 group-hover:text-[#003630]'}`}>
                                                                                            {year}
                                                                                        </span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>

                                                        <div className="h-8" aria-hidden="true" />

                                                        <div className="mb-6">
                                                            <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[10px] text-gray-500 uppercase tracking-[0.15em] ml-1 opacity-100 text-left w-full">Please Select the Periods to pay for</h3>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-4 mb-8">
                                                            {[1, 2, 3].filter(term => !isPastDate(term, selectedAcademicYear)).map((term) => {
                                                                const termId = selectedFee ? `fee-${selectedFee.value}-term-${term}` : `term-${term}`;
                                                                const isTermStaged = isStaged(termId);

                                                                return (
                                                                    <button
                                                                        key={term}
                                                                        disabled={!selectedFee}
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            if (!selectedFee) return;

                                                                            const newService = {
                                                                                id: termId,
                                                                                description: `${selectedGrade} Tuition - Term ${term}`,
                                                                                amount: selectedFee.price,
                                                                                invoiceNo: `T${term}-${selectedAcademicYear}`,
                                                                                term: term,
                                                                                academicYear: selectedAcademicYear,
                                                                                pricing_id: selectedFee.value,
                                                                                categoryId: schoolData?.category_ids?.tuition
                                                                            };

                                                                            setStagedItems(prev => {
                                                                                const isAlreadyStaged = prev.some(s => s.id === termId);

                                                                                // Keep everything that isn't a "fee-" item OR is a "fee-" item for the CURRENT grade
                                                                                const filtered = prev.filter(s => {
                                                                                    if (!s.id.startsWith("fee-")) return true;
                                                                                    return s.id.startsWith(`fee-${selectedFee.value}-`);
                                                                                });

                                                                                if (isAlreadyStaged) {
                                                                                    // Toggle off
                                                                                    return filtered.filter(s => s.id !== termId);
                                                                                } else {
                                                                                    // Accumulate (Multi-select)
                                                                                    return [...filtered, newService];
                                                                                }
                                                                            });
                                                                            haptics.selection();
                                                                        }}
                                                                        className={`h-[60px] rounded-[12px] border-[1.5px] px-4 flex items-center gap-3 transition-all active:scale-[0.95] ${isTermStaged
                                                                            ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]'
                                                                            : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'
                                                                            } ${!selectedFee ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                    >
                                                                        <div className={`size-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isTermStaged ? 'border-[#95e36c] bg-[#95e36c]' : 'border-gray-200 bg-transparent'
                                                                            }`}>
                                                                            {isTermStaged && (
                                                                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <polyline points="20 6 9 17 4 12" />
                                                                                </svg>
                                                                            )}
                                                                        </div>
                                                                        <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] whitespace-nowrap ${isTermStaged ? 'text-white' : 'text-gray-900'
                                                                            }`}>
                                                                            Term {term}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : activeTab === 'transport' ? (
                                    <div className="flex flex-col gap-2">
                                        {debtSummary.transport.some(d => !isStaged(d.id)) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="rounded-[24px] p-5 flex flex-col gap-4 border mb-6"
                                                style={{ backgroundColor: '#FFF1F0', borderColor: 'rgba(255, 204, 199, 0.6)' }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle style={{ color: '#FF4D4F' }} className="shrink-0 mt-0.5" size={20} strokeWidth={2.5} />
                                                    <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[15px] leading-relaxed" style={{ color: '#262626' }}>
                                                        You have an outstanding balance for {schoolData?.category_names?.transport?.toLowerCase() || 'transport'} of <span className="font-bold font-['Inter:Bold',sans-serif]">K{debtSummary.transport.reduce((acc, d) => acc + d.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        haptics.success();
                                                        const itemsToAdd = debtSummary.transport;
                                                        setStagedItems(prev => {
                                                            const existingIds = new Set(prev.map(p => p.id));
                                                            const newItems = itemsToAdd.filter(item => !existingIds.has(item.id));
                                                            return [...prev, ...newItems];
                                                        });
                                                        toast.success(`Staged ${itemsToAdd.length} ${schoolData?.category_names?.transport?.toLowerCase() || 'transport'} balance items`);
                                                    }}
                                                    className="w-full h-[52px] gap-2 bg-transparent border-[1.5px] rounded-[16px] flex items-center justify-center gap-2.5 font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[15px] active:scale-[0.98] transition-all hover:bg-[#FF4D4F]/5"
                                                    style={{ borderColor: 'rgba(255, 77, 79, 0.8)', color: '#FF4D4F' }}
                                                >
                                                    <div className="size-[20px] gap-3 rounded-full border flex items-center justify-center" style={{ borderColor: 'rgba(255, 77, 79, 0.4)' }}>
                                                        <span className="text-[18px] leading-none mb-0.5">+</span>
                                                    </div>
                                                    <span>Add All Arrears to Cart</span>
                                                </button>
                                            </motion.div>
                                        )}
                                        {!isTabLocked && (
                                            <>
                                                <label className="text-[13px] font-semibold text-gray-500 mb-1 ml-1 text-left w-full">Select Route</label>
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setIsRouteDropdownOpen(!isRouteDropdownOpen);
                                                        }}
                                                        className="w-full h-[60px] bg-white border border-gray-100 rounded-[24px] px-6 flex items-center justify-between shadow-[0px_4px_16px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all group pointer-events-auto cursor-pointer"
                                                    >
                                                        <div className="flex flex-col items-start overflow-hidden">
                                                            <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-gray-900 truncate">
                                                                {selectedRoute
                                                                    ? `${selectedRoute.name} - K${selectedRoute.price.toLocaleString()}`
                                                                    : "Choose a Route..."
                                                                }
                                                            </span>
                                                        </div>
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${isRouteDropdownOpen ? 'rotate-180' : ''}`}>
                                                            <path d="m6 9 6 6 6-6" />
                                                        </svg>
                                                    </button>

                                                    <AnimatePresence>
                                                        {isRouteDropdownOpen && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                className="absolute top-full mt-3 left-0 right-0 bg-white border border-gray-100 rounded-[24px] shadow-[0px_20px_50px_rgba(0,0,0,0.18)] z-[90] overflow-hidden max-h-[300px] overflow-y-auto pointer-events-auto"
                                                            >
                                                                <div className="p-3 flex flex-col gap-1">
                                                                    {schoolData?.bus_routes?.map((route) => (
                                                                        <button
                                                                            key={route.id}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setSelectedRouteId(route.id);
                                                                                setIsRouteDropdownOpen(false);

                                                                                // Smart Detection: Update frequency based on route name
                                                                                // Restricted to monthly/termly/yearly for transport
                                                                                const detected = detectFrequency(route.name);
                                                                                if (['monthly', 'termly', 'yearly'].includes(detected)) {
                                                                                    setTransportFrequency(detected as any);
                                                                                } else {
                                                                                    setTransportFrequency('monthly');
                                                                                }

                                                                                haptics.selection();
                                                                            }}
                                                                            className={`w-full px-5 py-4 text-left rounded-[18px] transition-all flex items-center justify-between group pointer-events-auto cursor-pointer ${selectedRouteId === route.id ? 'bg-[#003630] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[10px] ${selectedRouteId === route.id ? 'text-white' : 'text-gray-900 group-hover:text-[#003630]'}`}>
                                                                                    {route.name}
                                                                                </span>
                                                                                <span className={`text-[12px] ${selectedRouteId === route.id ? 'text-white/60' : 'text-gray-400'}`}>
                                                                                    Transport Service
                                                                                </span>
                                                                            </div>
                                                                            <span className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[10px] ${selectedRouteId === route.id ? 'text-white' : 'text-[#003630]'}`}>
                                                                                K{route.price.toLocaleString()}
                                                                            </span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {!isRouteDropdownOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex flex-col"
                                                    >
                                                        <div className="mt-2 flex flex-col gap-3">
                                                            <label className="text-[13px] font-semibold text-gray-500 mb-1 ml-1 text-left w-full">Academic Year</label>
                                                            <div className="relative">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setIsYearDropdownOpen(!isYearDropdownOpen);
                                                                    }}
                                                                    className="w-full h-[60px] bg-white border border-gray-100 rounded-[24px] px-6 flex items-center justify-between shadow-[0px_4px_16px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all group pointer-events-auto cursor-pointer"
                                                                >
                                                                    <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-gray-900">
                                                                        {selectedAcademicYear}
                                                                    </span>
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${isYearDropdownOpen ? 'rotate-180' : ''}`}>
                                                                        <path d="m6 9 6 6 6-6" />
                                                                    </svg>
                                                                </button>

                                                                <AnimatePresence>
                                                                    {isYearDropdownOpen && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: -10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            exit={{ opacity: 0, y: -10 }}
                                                                            className="absolute top-full mt-3 left-0 right-0 bg-white border border-gray-100 rounded-[24px] shadow-[0px_20px_50px_rgba(0,0,0,0.18)] z-[90] overflow-hidden pointer-events-auto"
                                                                        >
                                                                            <div className="p-3 flex flex-col gap-1">
                                                                                {[new Date().getFullYear(), new Date().getFullYear() + 1].map((year) => (
                                                                                    <button
                                                                                        key={year}
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            setSelectedAcademicYear(year);
                                                                                            setIsYearDropdownOpen(false);
                                                                                            haptics.selection();
                                                                                        }}
                                                                                        className={`w-full px-5 py-4 text-left rounded-[18px] transition-all flex items-center justify-between group pointer-events-auto cursor-pointer ${selectedAcademicYear === year ? 'bg-[#003630] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                                                                                    >
                                                                                        <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[13px] ${selectedAcademicYear === year ? 'text-white' : 'text-gray-900 group-hover:text-[#003630]'}`}>
                                                                                            {year}
                                                                                        </span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>

                                                        <div className="mt-8 flex flex-col gap-3">
                                                            <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[10px] text-gray-500 uppercase tracking-[0.15em] ml-1 opacity-100 text-left w-full">Subscription Frequency</h3>
                                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                                {['monthly', 'termly', 'yearly'].map((freq) => (
                                                                    <button
                                                                        key={freq}
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            haptics.selection();
                                                                            const oldFreq = transportFrequency;
                                                                            const newFreq = freq as any;
                                                                            if (oldFreq !== newFreq) {
                                                                                setTransportFrequency(newFreq);
                                                                                // Clear all TRANSPORT items when switching frequency to ensure exclusivity
                                                                                setStagedItems(prev => prev.filter(item => 
                                                                                    !item.id.includes("route-") && 
                                                                                    !(item.categoryId === schoolData?.category_ids?.transport)
                                                                                ));
                                                                            }
                                                                        }}
                                                                        className={`h-[48px] w-full rounded-[12px] border-[1.5px] transition-all active:scale-[0.95] flex items-center justify-center gap-3 ${transportFrequency === freq
                                                                            ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]'
                                                                            : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'
                                                                            }`}
                                                                    >
                                                                        <div className={`size-3.5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${transportFrequency === freq ? 'border-[#95e36c] bg-[#95e36c]' : 'border-gray-200 bg-transparent'}`}>
                                                                            {transportFrequency === freq && (
                                                                                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <polyline points="20 6 9 17 4 12" />
                                                                                </svg>
                                                                            )}
                                                                        </div>
                                                                        <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[11px] capitalize ${transportFrequency === freq ? 'text-white' : 'text-gray-900'}`}>
                                                                            {freq}
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="h-8" aria-hidden="true" />

                                                        <div className="mb-6">
                                                            <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[10px] text-gray-500 uppercase tracking-[0.15em] ml-1 opacity-100 text-left w-full">
                                                                {transportFrequency === 'monthly' ? 'Select Month' :
                                                                    transportFrequency === 'yearly' ? 'Confirm Academic Year' :
                                                                        transportFrequency === 'weekly' ? 'Select Week' :
                                                                            transportFrequency === 'daily' ? 'Select Day' :
                                                                                'Please Select the Periods to pay for'}
                                                            </h3>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-4 mb-8">
                                                            {transportFrequency === 'termly' ? (
                                                            [1, 2, 3].filter(term => !isPastDate(term, selectedAcademicYear)).map((term) => {
                                                                    const termId = selectedRoute ? `route-${selectedRouteId}-term-${term}` : `route-term-${term}`;
                                                                    const isTermStaged = isStaged(termId);

                                                                    return (
                                                                        <button
                                                                            key={term}
                                                                            disabled={!selectedRoute}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                if (!selectedRoute) return;

                                                                                const newService = {
                                                                                    id: termId,
                                                                                    description: `${selectedRoute.name} - Term ${term}`,
                                                                                    amount: selectedRoute.price * 3, // 3 months per term
                                                                                    invoiceNo: "203",
                                                                                    term: term,
                                                                                    academicYear: selectedAcademicYear,
                                                                                    pricing_id: selectedRouteId,
                                                                                    categoryId: schoolData?.category_ids?.transport
                                                                                };

                                                                                setStagedItems(prev => {
                                                                                    const isAlreadyStaged = prev.some(s => s.id === termId);
                                                                                    const filtered = prev.filter(s => {
                                                                                        if (!s.id.startsWith("route-")) return true;
                                                                                        return s.id.startsWith(`route-${selectedRouteId}-`);
                                                                                    });

                                                                                    if (isAlreadyStaged) {
                                                                                        return filtered.filter(s => s.id !== termId);
                                                                                    } else {
                                                                                        return [...filtered, newService];
                                                                                    }
                                                                                });
                                                                                haptics.selection();
                                                                            }}
                                                                            className={`h-[60px] rounded-[12px] border-[1.5px] px-4 flex items-center gap-3 transition-all active:scale-[0.95] ${isTermStaged
                                                                                ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]'
                                                                                : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'
                                                                                } ${!selectedRoute ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                        >
                                                                            <div className={`size-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isTermStaged ? 'border-[#95e36c] bg-[#95e36c]' : 'border-gray-200 bg-transparent'
                                                                                }`}>
                                                                                {isTermStaged && (
                                                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round">
                                                                                        <polyline points="20 6 9 17 4 12" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                            <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] whitespace-nowrap ${isTermStaged ? 'text-white' : 'text-gray-900'
                                                                                }`}>
                                                                                Term {term}
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })
                                                            ) : transportFrequency === 'monthly' ? (
                                                                ['Jan', 'Feb', 'Mar', 'May', 'Jun', 'Jul', 'Sep', 'Oct', 'Nov']
                                                                    .filter(month => !isPastDate(month, selectedAcademicYear))
                                                                    .map((month) => {
                                                                    const termId = selectedRoute ? `route-${selectedRouteId}-month-${month}` : `route-month-${month}`;
                                                                    const isTermStaged = isStaged(termId);

                                                                    // Map month to term for invoice metadata
                                                                    const monthMap: Record<string, number> = {
                                                                        'Jan': 1, 'Feb': 1, 'Mar': 1,
                                                                        'May': 2, 'Jun': 2, 'Jul': 2,
                                                                        'Sep': 3, 'Oct': 3, 'Nov': 3
                                                                    };

                                                                    return (
                                                                        <button
                                                                            key={month}
                                                                            disabled={!selectedRoute}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                if (!selectedRoute) return;

                                                                                const newService = {
                                                                                    id: termId,
                                                                                    description: `${selectedRoute.name} - ${month} ${selectedAcademicYear}`,
                                                                                    amount: selectedRoute.price, // Base monthly price
                                                                                    invoiceNo: "203",
                                                                                    term: monthMap[month],
                                                                                    academicYear: selectedAcademicYear,
                                                                                    pricing_id: selectedRouteId,
                                                                                    categoryId: schoolData?.category_ids?.transport
                                                                                };

                                                                                setStagedItems(prev => {
                                                                                    const exists = prev.some(s => s.id === termId);
                                                                                    return exists ? prev.filter(s => s.id !== termId) : [...prev, newService];
                                                                                });
                                                                                haptics.selection();
                                                                            }}
                                                                            className={`h-[60px] rounded-[12px] border-[1.5px] px-4 flex items-center gap-3 transition-all active:scale-[0.95] ${isTermStaged
                                                                                ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]'
                                                                                : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'
                                                                                } ${!selectedRoute ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                        >
                                                                            <div className={`size-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isTermStaged ? 'border-[#95e36c] bg-[#95e36c]' : 'border-gray-200 bg-transparent'}`}>
                                                                                {isTermStaged && (
                                                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round">
                                                                                        <polyline points="20 6 9 17 4 12" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                            <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] whitespace-nowrap ${isTermStaged ? 'text-white' : 'text-gray-900'}`}>{month}</span>
                                                                        </button>
                                                                    );
                                                                })
                                                            ) : (
                                                                <button
                                                                    disabled={!selectedRoute}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        if (!selectedRoute) return;
                                                                        const termId = `route-${selectedRouteId}-yearly-${selectedAcademicYear}`;
                                                                        const newService = {
                                                                            id: termId,
                                                                            description: `${selectedRoute.name} - Full Year ${selectedAcademicYear}`,
                                                                            amount: selectedRoute.price * 9, // 9 months per year
                                                                            invoiceNo: "203",
                                                                            academicYear: selectedAcademicYear,
                                                                            pricing_id: selectedRouteId,
                                                                            categoryId: schoolData?.category_ids?.transport
                                                                        };
                                                                        setStagedItems(prev => {
                                                                            const exists = prev.some(s => s.id === termId);
                                                                            return exists ? prev.filter(s => s.id !== termId) : [...prev, newService];
                                                                        });
                                                                        haptics.selection();
                                                                    }}
                                                                    className={`h-[60px] col-span-3 rounded-[12px] border-[1.5px] px-4 flex items-center gap-3 transition-all active:scale-[0.95] ${isStaged(`route-${selectedRouteId}-yearly-${selectedAcademicYear}`)
                                                                        ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]'
                                                                        : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'
                                                                        } ${!selectedRoute ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                >
                                                                    <div className={`size-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isStaged(`route-${selectedRouteId}-yearly-${selectedAcademicYear}`) ? 'border-[#95e36c] bg-[#95e36c]' : 'border-gray-200 bg-transparent'}`}>
                                                                        {isStaged(`route-${selectedRouteId}-yearly-${selectedAcademicYear}`) && (
                                                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round">
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                    <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] ${isStaged(`route-${selectedRouteId}-yearly-${selectedAcademicYear}`) ? 'text-white' : 'text-gray-900'}`}>
                                                                        Full Year ({selectedAcademicYear})
                                                                    </span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ) : activeTab === 'boarding' ? (
                                    <div className="flex flex-col gap-2">
                                        {debtSummary.boarding.some(d => !isStaged(d.id)) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="rounded-[24px] p-5 flex flex-col gap-4 border mb-6"
                                                style={{ backgroundColor: '#FFF1F0', borderColor: 'rgba(255, 204, 199, 0.6)' }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle style={{ color: '#FF4D4F' }} className="shrink-0 mt-0.5" size={20} strokeWidth={2.5} />
                                                    <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[15px] leading-relaxed" style={{ color: '#262626' }}>
                                                        You have an outstanding balance for {schoolData?.category_names?.boarding?.toLowerCase() || 'boarding'} of <span className="font-bold font-['Inter:Bold',sans-serif]">K{debtSummary.boarding.reduce((acc, d) => acc + d.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        haptics.success();
                                                        const itemsToAdd = debtSummary.boarding;
                                                        setStagedItems(prev => {
                                                            const existingIds = new Set(prev.map(p => p.id));
                                                            const newItems = itemsToAdd.filter(item => !existingIds.has(item.id));
                                                            return [...prev, ...newItems];
                                                        });
                                                        toast.success(`Staged ${itemsToAdd.length} ${schoolData?.category_names?.boarding?.toLowerCase() || 'boarding'} balance items`);
                                                    }}
                                                    className="w-full h-[52px] gap-2 bg-transparent border-[1.5px] rounded-[16px] flex items-center justify-center gap-2.5 font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[15px] active:scale-[0.98] transition-all hover:bg-[#FF4D4F]/5"
                                                    style={{ borderColor: 'rgba(255, 77, 79, 0.8)', color: '#FF4D4F' }}
                                                >
                                                    <div className="size-[20px] gap-3 rounded-full border flex items-center justify-center" style={{ borderColor: 'rgba(255, 77, 79, 0.4)' }}>
                                                        <span className="text-[18px] leading-none mb-0.5">+</span>
                                                    </div>
                                                    <span>Add All Arrears to Cart</span>
                                                </button>
                                            </motion.div>
                                        )}
                                        {!isTabLocked && (
                                            <>
                                                <label className="text-[13px] font-semibold text-gray-500 mb-1 ml-1 text-left w-full">Select Room</label>
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setIsBoardingDropdownOpen(!isBoardingDropdownOpen);
                                                        }}
                                                        className="w-full h-[60px] bg-white border border-gray-100 rounded-[24px] px-6 flex items-center justify-between shadow-[0px_4px_16px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all group pointer-events-auto cursor-pointer"
                                                    >
                                                        <div className="flex flex-col items-start overflow-hidden">
                                                            <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-gray-900 truncate">
                                                                {selectedBoardingRoom
                                                                    ? `${selectedBoardingRoom.name} - K${selectedBoardingRoom.price.toLocaleString()}`
                                                                    : "Choose a Room..."
                                                                }
                                                            </span>
                                                        </div>
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${isBoardingDropdownOpen ? 'rotate-180' : ''}`}>
                                                            <path d="m6 9 6 6 6-6" />
                                                        </svg>
                                                    </button>

                                                    <AnimatePresence>
                                                        {isBoardingDropdownOpen && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                className="absolute top-full mt-3 left-0 right-0 bg-white border border-gray-100 rounded-[24px] shadow-[0px_20px_50px_rgba(0,0,0,0.18)] z-[90] overflow-hidden max-h-[300px] overflow-y-auto pointer-events-auto"
                                                            >
                                                                <div className="p-3 flex flex-col gap-1">
                                                                    {schoolData?.boarding_rooms?.map((room) => (
                                                                        <button
                                                                            key={room.id}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setSelectedBoardingRoomId(room.id);
                                                                                setIsBoardingDropdownOpen(false);

                                                                                // Restricted to termly/yearly for boarding
                                                                                const detected = detectFrequency(room.name);
                                                                                if (['termly', 'yearly'].includes(detected)) {
                                                                                    setBoardingFrequency(detected as any);
                                                                                } else {
                                                                                    setBoardingFrequency('termly');
                                                                                }

                                                                                haptics.selection();
                                                                            }}
                                                                            className={`w-full px-5 py-4 text-left rounded-[18px] transition-all flex items-center justify-between group pointer-events-auto cursor-pointer ${selectedBoardingRoomId === room.id ? 'bg-[#003630] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[10px] ${selectedBoardingRoomId === room.id ? 'text-white' : 'text-gray-900 group-hover:text-[#003630]'}`}>
                                                                                    {room.name}
                                                                                </span>
                                                                                <span className={`text-[12px] ${selectedBoardingRoomId === room.id ? 'text-white/60' : 'text-gray-400'}`}>
                                                                                    Boarding Service
                                                                                </span>
                                                                            </div>
                                                                            <span className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[10px] ${selectedBoardingRoomId === room.id ? 'text-white' : 'text-[#003630]'}`}>
                                                                                K{room.price.toLocaleString()}
                                                                            </span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {!isBoardingDropdownOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex flex-col"
                                                    >
                                                        <div className="mt-2 flex flex-col gap-3">
                                                            <label className="text-[13px] font-semibold text-gray-500 mb-1 ml-1 text-left w-full">Academic Year</label>
                                                            <div className="relative">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setIsYearDropdownOpen(!isYearDropdownOpen);
                                                                    }}
                                                                    className="w-full h-[60px] bg-white border border-gray-100 rounded-[24px] px-6 flex items-center justify-between shadow-[0px_4px_16px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all group pointer-events-auto cursor-pointer"
                                                                >
                                                                    <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-gray-900">
                                                                        {selectedAcademicYear}
                                                                    </span>
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${isYearDropdownOpen ? 'rotate-180' : ''}`}>
                                                                        <path d="m6 9 6 6 6-6" />
                                                                    </svg>
                                                                </button>

                                                                <AnimatePresence>
                                                                    {isYearDropdownOpen && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: -10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            exit={{ opacity: 0, y: -10 }}
                                                                            className="absolute top-full mt-3 left-0 right-0 bg-white border border-gray-100 rounded-[24px] shadow-[0px_20px_50px_rgba(0,0,0,0.18)] z-[90] overflow-hidden pointer-events-auto"
                                                                        >
                                                                            <div className="p-3 flex flex-col gap-1">
                                                                                {[new Date().getFullYear(), new Date().getFullYear() + 1].map((year) => (
                                                                                    <button
                                                                                        key={year}
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            setSelectedAcademicYear(year);
                                                                                            setIsYearDropdownOpen(false);
                                                                                            haptics.selection();
                                                                                        }}
                                                                                        className={`w-full px-5 py-4 text-left rounded-[18px] transition-all flex items-center justify-between group pointer-events-auto cursor-pointer ${selectedAcademicYear === year ? 'bg-[#003630] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                                                                                    >
                                                                                        <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[13px] ${selectedAcademicYear === year ? 'text-white' : 'text-gray-900 group-hover:text-[#003630]'}`}>
                                                                                            {year}
                                                                                        </span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>

                                                        <div className="mt-8 flex flex-col gap-3">
                                                            <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[10px] text-gray-500 uppercase tracking-[0.15em] ml-1 opacity-100 text-left w-full">Subscription Frequency</h3>
                                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                                {['termly', 'yearly'].map((freq) => (
                                                                    <button
                                                                        key={freq}
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            haptics.selection();
                                                                            const oldFreq = boardingFrequency;
                                                                            const newFreq = freq as any;
                                                                            if (oldFreq !== newFreq) {
                                                                                setBoardingFrequency(newFreq);
                                                                                // Clear all BOARDING items when switching frequency
                                                                                setStagedItems(prev => prev.filter(item => 
                                                                                    !item.id.includes("room-") && 
                                                                                    !(item.categoryId === schoolData?.category_ids?.boarding)
                                                                                ));
                                                                            }
                                                                        }}
                                                                        className={`h-[48px] w-full rounded-[12px] border-[1.5px] transition-all active:scale-[0.95] flex items-center justify-center gap-3 ${boardingFrequency === freq
                                                                            ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]'
                                                                            : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'
                                                                            }`}
                                                                    >
                                                                        <div className={`size-3.5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${boardingFrequency === freq ? 'border-[#95e36c] bg-[#95e36c]' : 'border-gray-200 bg-transparent'}`}>
                                                                            {boardingFrequency === freq && (
                                                                                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <polyline points="20 6 9 17 4 12" />
                                                                                </svg>
                                                                            )}
                                                                        </div>
                                                                        <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[11px] capitalize ${boardingFrequency === freq ? 'text-white' : 'text-gray-900'}`}>
                                                                            {freq}
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="h-8" aria-hidden="true" />

                                                        <div className="mb-6">
                                                            <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[10px] text-gray-500 uppercase tracking-[0.15em] ml-1 opacity-100 text-left w-full">
                                                                {boardingFrequency === 'monthly' ? 'Select Month' :
                                                                    boardingFrequency === 'yearly' ? 'Confirm Academic Year' :
                                                                        boardingFrequency === 'weekly' ? 'Select Week' :
                                                                            boardingFrequency === 'daily' ? 'Select Day' :
                                                                                'Please Select the Periods to pay for'}
                                                            </h3>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-4 mb-8">
                                                            {boardingFrequency === 'termly' ? (
                                                            [1, 2, 3].filter(term => !isPastDate(term, selectedAcademicYear)).map((term) => {
                                                                    const termId = selectedBoardingRoom ? `room-${selectedBoardingRoomId}-term-${term}` : `room-term-${term}`;
                                                                    const isTermStaged = isStaged(termId);

                                                                    return (
                                                                        <button
                                                                            key={term}
                                                                            disabled={!selectedBoardingRoom}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                if (!selectedBoardingRoom) return;

                                                                                const newService = {
                                                                                    id: termId,
                                                                                    description: `${selectedBoardingRoom.name} - Term ${term}`,
                                                                                    amount: selectedBoardingRoom.price * 3, // 3 months per term
                                                                                    invoiceNo: "203",
                                                                                    term: term,
                                                                                    academicYear: selectedAcademicYear,
                                                                                    pricing_id: selectedBoardingRoomId,
                                                                                    categoryId: schoolData?.category_ids?.boarding
                                                                                };

                                                                                setStagedItems(prev => {
                                                                                    const isAlreadyStaged = prev.some(s => s.id === termId);
                                                                                    const filtered = prev.filter(s => {
                                                                                        if (!s.id.startsWith("room-")) return true;
                                                                                        return s.id.startsWith(`room-${selectedBoardingRoomId}-`);
                                                                                    });

                                                                                    if (isAlreadyStaged) {
                                                                                        return filtered.filter(s => s.id !== termId);
                                                                                    } else {
                                                                                        return [...filtered, newService];
                                                                                    }
                                                                                });
                                                                                haptics.selection();
                                                                            }}
                                                                            className={`h-[60px] rounded-[12px] border-[1.5px] px-4 flex items-center gap-3 transition-all active:scale-[0.95] ${isTermStaged
                                                                                ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]'
                                                                                : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'
                                                                                } ${!selectedBoardingRoom ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                        >
                                                                            <div className={`size-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isTermStaged ? 'border-[#95e36c] bg-[#95e36c]' : 'border-gray-200 bg-transparent'
                                                                                }`}>
                                                                                {isTermStaged && (
                                                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round">
                                                                                        <polyline points="20 6 9 17 4 12" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                            <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] whitespace-nowrap ${isTermStaged ? 'text-white' : 'text-gray-900'
                                                                                }`}>
                                                                                Term {term}
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })
                                                            ) : boardingFrequency === 'monthly' ? (
                                                                ['Jan', 'Feb', 'Mar', 'May', 'Jun', 'Jul', 'Sep', 'Oct', 'Nov']
                                                                    .filter(month => !isPastDate(month, selectedAcademicYear))
                                                                    .map((month) => {
                                                                    const termId = selectedBoardingRoom ? `room-${selectedBoardingRoomId}-month-${month}` : `room-month-${month}`;
                                                                    const isTermStaged = isStaged(termId);

                                                                    // Map month to term for invoice metadata
                                                                    const monthMap: Record<string, number> = {
                                                                        'Jan': 1, 'Feb': 1, 'Mar': 1,
                                                                        'May': 2, 'Jun': 2, 'Jul': 2,
                                                                        'Sep': 3, 'Oct': 3, 'Nov': 3
                                                                    };

                                                                    return (
                                                                        <button
                                                                            key={month}
                                                                            disabled={!selectedBoardingRoom}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                if (!selectedBoardingRoom) return;

                                                                                const newService = {
                                                                                    id: termId,
                                                                                    description: `${selectedBoardingRoom.name} - ${month} ${selectedAcademicYear}`,
                                                                                    amount: selectedBoardingRoom.price, // Base monthly price
                                                                                    invoiceNo: "203",
                                                                                    term: monthMap[month],
                                                                                    academicYear: selectedAcademicYear,
                                                                                    pricing_id: selectedBoardingRoomId,
                                                                                    categoryId: schoolData?.category_ids?.boarding
                                                                                };

                                                                                setStagedItems(prev => {
                                                                                    const exists = prev.some(s => s.id === termId);
                                                                                    return exists ? prev.filter(s => s.id !== termId) : [...prev, newService];
                                                                                });
                                                                                haptics.selection();
                                                                            }}
                                                                            className={`h-[60px] rounded-[12px] border-[1.5px] px-4 flex items-center gap-3 transition-all active:scale-[0.95] ${isTermStaged
                                                                                ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]'
                                                                                : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'
                                                                                } ${!selectedBoardingRoom ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                        >
                                                                            <div className={`size-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isTermStaged ? 'border-[#95e36c] bg-[#95e36c]' : 'border-gray-200 bg-transparent'}`}>
                                                                                {isTermStaged && (
                                                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round">
                                                                                        <polyline points="20 6 9 17 4 12" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                            <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] whitespace-nowrap ${isTermStaged ? 'text-white' : 'text-gray-900'}`}>{month}</span>
                                                                        </button>
                                                                    );
                                                                })
                                                            ) : (
                                                                <button
                                                                    disabled={!selectedBoardingRoom}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        if (!selectedBoardingRoom) return;
                                                                        const termId = `room-${selectedBoardingRoomId}-yearly-${selectedAcademicYear}`;
                                                                        const newService = {
                                                                            id: termId,
                                                                            description: `${selectedBoardingRoom.name} - Full Year ${selectedAcademicYear}`,
                                                                            amount: selectedBoardingRoom.price * 9, // 9 months per year
                                                                            invoiceNo: "203",
                                                                            academicYear: selectedAcademicYear,
                                                                            pricing_id: selectedBoardingRoomId,
                                                                            categoryId: schoolData?.category_ids?.boarding
                                                                        };
                                                                        setStagedItems(prev => {
                                                                            const exists = prev.some(s => s.id === termId);
                                                                            return exists ? prev.filter(s => s.id !== termId) : [...prev, newService];
                                                                        });
                                                                        haptics.selection();
                                                                    }}
                                                                    className={`h-[60px] col-span-3 rounded-[12px] border-[1.5px] px-4 flex items-center gap-3 transition-all active:scale-[0.95] ${isStaged(`room-${selectedBoardingRoomId}-yearly-${selectedAcademicYear}`)
                                                                        ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]'
                                                                        : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'
                                                                        } ${!selectedBoardingRoom ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                >
                                                                    <div className={`size-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isStaged(`room-${selectedBoardingRoomId}-yearly-${selectedAcademicYear}`) ? 'border-[#95e36c] bg-[#95e36c]' : 'border-gray-200 bg-transparent'}`}>
                                                                        {isStaged(`room-${selectedBoardingRoomId}-yearly-${selectedAcademicYear}`) && (
                                                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round">
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                    <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] ${isStaged(`room-${selectedBoardingRoomId}-yearly-${selectedAcademicYear}`) ? 'text-white' : 'text-gray-900'}`}>
                                                                        Pay Full Year ({selectedAcademicYear})
                                                                    </span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ) : activeTab === 'cafeteria' ? (
                                    <div className="flex flex-col gap-2">
                                        {debtSummary.cafeteria.some(d => !isStaged(d.id)) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-[#FFF1F0] rounded-[24px] p-5 flex flex-col gap-4 border border-[#FFCCC7]/60 mb-6"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="text-[#FF4D4F] shrink-0 mt-0.5" size={20} strokeWidth={2.5} />
                                                    <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[15px] text-[#262626] leading-relaxed">
                                                        You have an outstanding balance for cafeteria of <span className="font-bold font-['Inter:Bold',sans-serif]">K{debtSummary.cafeteria.reduce((acc, d) => acc + d.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        haptics.success();
                                                        const itemsToAdd = debtSummary.cafeteria;
                                                        setStagedItems(prev => {
                                                            const existingIds = new Set(prev.map(p => p.id));
                                                            const newItems = itemsToAdd.filter(item => !existingIds.has(item.id));
                                                            return [...prev, ...newItems];
                                                        });
                                                        toast.success(`Staged ${itemsToAdd.length} meal balance items`);
                                                    }}
                                                    className="w-full h-[52px] bg-transparent border-[1.5px] border-[#FF4D4F]/80 text-[#FF4D4F] rounded-[16px] flex items-center justify-center gap-2.5 font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[15px] active:scale-[0.98] transition-all hover:bg-[#FF4D4F]/5"
                                                >
                                                    <div className="size-[22px] rounded-full border border-[#FF4D4F]/40 flex items-center justify-center">
                                                        <span className="text-[18px] leading-none mb-0.5">+</span>
                                                    </div>
                                                    <span>Add All Arrears to Cart</span>
                                                </button>
                                            </motion.div>
                                        )}
                                        {!isTabLocked && (
                                            <>
                                                <label className="text-[13px] font-semibold text-gray-500 mb-1 ml-1 text-left w-full">Select Meal Plan</label>
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setIsCanteenDropdownOpen(!isCanteenDropdownOpen);
                                                        }}
                                                        className="w-full h-[60px] bg-white border border-gray-100 rounded-[24px] px-6 flex items-center justify-between shadow-[0px_4px_16px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all group pointer-events-auto cursor-pointer"
                                                    >
                                                        <div className="flex flex-col items-start overflow-hidden">
                                                            <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-gray-900 truncate">
                                                                {selectedCanteenPlan
                                                                    ? `${selectedCanteenPlan.name} - K${selectedCanteenPlan.price.toLocaleString()}`
                                                                    : "Choose a Plan..."
                                                                }
                                                            </span>
                                                        </div>
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${isCanteenDropdownOpen ? 'rotate-180' : ''}`}>
                                                            <path d="m6 9 6 6 6-6" />
                                                        </svg>
                                                    </button>

                                                    <AnimatePresence>
                                                        {isCanteenDropdownOpen && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                className="absolute top-full mt-3 left-0 right-0 bg-white border border-gray-100 rounded-[24px] shadow-[0px_20px_50px_rgba(0,0,0,0.18)] z-[90] overflow-hidden max-h-[300px] overflow-y-auto pointer-events-auto"
                                                            >
                                                                <div className="p-3 flex flex-col gap-1">
                                                                    {schoolData?.canteen_plans?.map((plan) => (
                                                                        <button
                                                                            key={plan.id}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setSelectedCanteenPlanId(plan.id);
                                                                                setIsCanteenDropdownOpen(false);

                                                                                // Smart Detection: Update frequency based on plan name
                                                                                // Restricted to daily/weekly/monthly/termly for canteen
                                                                                const detected = detectFrequency(plan.name);
                                                                                if (['daily', 'weekly', 'monthly', 'termly'].includes(detected)) {
                                                                                    setCafeteriaFrequency(detected as any);
                                                                                } else {
                                                                                    setCafeteriaFrequency('monthly');
                                                                                }

                                                                                haptics.selection();
                                                                            }}
                                                                            className={`w-full px-5 py-4 text-left rounded-[18px] transition-all flex items-center justify-between group pointer-events-auto cursor-pointer ${selectedCanteenPlanId === plan.id ? 'bg-[#003630] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[10px] ${selectedCanteenPlanId === plan.id ? 'text-white' : 'text-gray-900 group-hover:text-[#003630]'}`}>
                                                                                    {plan.name}
                                                                                </span>
                                                                                <span className={`text-[12px] ${selectedCanteenPlanId === plan.id ? 'text-white/60' : 'text-gray-400'}`}>
                                                                                    Cafeteria Service
                                                                                </span>
                                                                            </div>
                                                                            <span className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[10px] ${selectedCanteenPlanId === plan.id ? 'text-white' : 'text-[#003630]'}`}>
                                                                                K{plan.price.toLocaleString()}
                                                                            </span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {!isCanteenDropdownOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex flex-col"
                                                    >
                                                        <div className="mt-2 flex flex-col gap-3">
                                                            <label className="text-[13px] font-semibold text-gray-500 mb-1 ml-1 text-left w-full">Academic Year</label>
                                                            <div className="relative">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setIsYearDropdownOpen(!isYearDropdownOpen);
                                                                    }}
                                                                    className="w-full h-[60px] bg-white border border-gray-100 rounded-[24px] px-6 flex items-center justify-between shadow-[0px_4px_16px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all group pointer-events-auto cursor-pointer"
                                                                >
                                                                    <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-gray-900">
                                                                        {selectedAcademicYear}
                                                                    </span>
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${isYearDropdownOpen ? 'rotate-180' : ''}`}>
                                                                        <path d="m6 9 6 6 6-6" />
                                                                    </svg>
                                                                </button>

                                                                <AnimatePresence>
                                                                    {isYearDropdownOpen && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: -10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            exit={{ opacity: 0, y: -10 }}
                                                                            className="absolute top-full mt-3 left-0 right-0 bg-white border border-gray-100 rounded-[24px] shadow-[0px_20px_50px_rgba(0,0,0,0.18)] z-[90] overflow-hidden pointer-events-auto"
                                                                        >
                                                                            <div className="p-3 flex flex-col gap-1">
                                                                                {[new Date().getFullYear(), new Date().getFullYear() + 1].map((year) => (
                                                                                    <button
                                                                                        key={year}
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            setSelectedAcademicYear(year);
                                                                                            setIsYearDropdownOpen(false);
                                                                                            haptics.selection();
                                                                                        }}
                                                                                        className={`w-full px-5 py-4 text-left rounded-[18px] transition-all flex items-center justify-between group pointer-events-auto cursor-pointer ${selectedAcademicYear === year ? 'bg-[#003630] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                                                                                    >
                                                                                        <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[13px] ${selectedAcademicYear === year ? 'text-white' : 'text-gray-900 group-hover:text-[#003630]'}`}>
                                                                                            {year}
                                                                                        </span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>

                                                        <div className="mt-8 flex flex-col gap-3">
                                                            <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[10px] text-gray-500 uppercase tracking-[0.15em] ml-1 opacity-100 text-left w-full">Subscription Frequency</h3>
                                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                                {['daily', 'weekly', 'monthly', 'termly'].map((freq) => (
                                                                    <button
                                                                        key={freq}
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            haptics.selection();
                                                                            const oldFreq = cafeteriaFrequency;
                                                                            const newFreq = freq as any;
                                                                            if (oldFreq !== newFreq) {
                                                                                setCafeteriaFrequency(newFreq);
                                                                                // Clear all CAFETERIA items when switching frequency
                                                                                setStagedItems(prev => prev.filter(item => 
                                                                                    !item.id.includes("canteen-") && 
                                                                                    !(item.categoryId === schoolData?.category_ids?.canteen)
                                                                                ));
                                                                            }
                                                                        }}
                                                                        className={`h-[48px] w-full rounded-[12px] border-[1.5px] transition-all active:scale-[0.95] flex items-center justify-center gap-3 ${cafeteriaFrequency === freq
                                                                            ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]'
                                                                            : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'
                                                                            }`}
                                                                    >
                                                                        <div className={`size-3.5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${cafeteriaFrequency === freq ? 'border-[#95e36c] bg-[#95e36c]' : 'border-gray-200 bg-transparent'}`}>
                                                                            {cafeteriaFrequency === freq && (
                                                                                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <polyline points="20 6 9 17 4 12" />
                                                                                </svg>
                                                                            )}
                                                                        </div>
                                                                        <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[11px] capitalize ${cafeteriaFrequency === freq ? 'text-white' : 'text-gray-900'}`}>
                                                                            {freq}
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="h-4" aria-hidden="true" />

                                                        <div className="mb-6">
                                                            <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[10px] text-gray-500 uppercase tracking-[0.15em] ml-1 opacity-100 text-left w-full">
                                                                {cafeteriaFrequency === 'monthly' ? 'Select Month' :
                                                                    cafeteriaFrequency === 'weekly' ? 'Select Week' :
                                                                        cafeteriaFrequency === 'daily' ? 'Select Day' :
                                                                            'Please Select the Periods to pay for'}
                                                            </h3>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-4 mb-8">
                                                            {cafeteriaFrequency === 'termly' ? (
                                                            [1, 2, 3].filter(term => !isPastDate(term, selectedAcademicYear)).map((term) => {
                                                                    const termId = selectedCanteenPlan ? `canteen-${selectedCanteenPlanId}-term-${term}` : `canteen-term-${term}`;
                                                                    const isTermStaged = isStaged(termId);

                                                                    return (
                                                                        <button
                                                                            key={term}
                                                                            disabled={!selectedCanteenPlan}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                if (!selectedCanteenPlan) return;

                                                                                const newService = {
                                                                                    id: termId,
                                                                                    description: `${selectedCanteenPlan.name} - Term ${term}`,
                                                                                    amount: selectedCanteenPlan.price * 3, // 3 months per term
                                                                                    invoiceNo: "204",
                                                                                    term: term,
                                                                                    academicYear: selectedAcademicYear,
                                                                                    pricing_id: selectedCanteenPlanId,
                                                                                    categoryId: schoolData?.category_ids?.canteen
                                                                                };

                                                                                setStagedItems(prev => {
                                                                                    const isAlreadyStaged = prev.some(s => s.id === termId);
                                                                                    const filtered = prev.filter(s => {
                                                                                        if (!s.id.startsWith("canteen-")) return true;
                                                                                        return s.id.startsWith(`canteen-${selectedCanteenPlanId}-`);
                                                                                    });

                                                                                    if (isAlreadyStaged) {
                                                                                        return filtered.filter(s => s.id !== termId);
                                                                                    } else {
                                                                                        return [...filtered, newService];
                                                                                    }
                                                                                });
                                                                                haptics.selection();
                                                                            }}
                                                                            className={`h-[60px] rounded-[12px] border-[1.5px] px-4 flex items-center gap-3 transition-all active:scale-[0.95] ${isTermStaged
                                                                                ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]'
                                                                                : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'
                                                                                } ${!selectedCanteenPlan ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                        >
                                                                            <div className={`size-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isTermStaged ? 'border-[#95e36c] bg-[#95e36c]' : 'border-gray-200 bg-transparent'
                                                                                }`}>
                                                                                {isTermStaged && (
                                                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round">
                                                                                        <polyline points="20 6 9 17 4 12" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                            <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] whitespace-nowrap ${isTermStaged ? 'text-white' : 'text-gray-900'
                                                                                }`}>
                                                                                Term {term}
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })
                                                            ) : cafeteriaFrequency === 'weekly' ? (
                                                                ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week) => {
                                                                    const termId = `canteen-${selectedCanteenPlanId}-week-${week}`;
                                                                    const isTermStaged = isStaged(termId);
                                                                    return (
                                                                        <button
                                                                            key={week}
                                                                            disabled={!selectedCanteenPlan}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                if (!selectedCanteenPlan) return;
                                                                                const newService = {
                                                                                    id: termId,
                                                                                    description: `${selectedCanteenPlan.name} - ${week}`,
                                                                                    amount: selectedCanteenPlan.price / 4,
                                                                                    invoiceNo: "204",
                                                                                    academicYear: selectedAcademicYear,
                                                                                    pricing_id: selectedCanteenPlanId,
                                                                                    categoryId: schoolData?.category_ids?.canteen
                                                                                };
                                                                                setStagedItems(prev => {
                                                                                    const exists = prev.some(s => s.id === termId);
                                                                                    return exists ? prev.filter(s => s.id !== termId) : [...prev, newService];
                                                                                });
                                                                                haptics.selection();
                                                                            }}
                                                                            className={`h-[60px] rounded-[12px] border-[1.5px] px-4 flex items-center gap-3 transition-all active:scale-[0.95] ${isTermStaged ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]' : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'} ${!selectedCanteenPlan ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                        >
                                                                            <div className={`size-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isTermStaged ? 'border-[#95e36c] bg-[#95e36c]' : 'border-gray-200 bg-transparent'}`}>
                                                                                {isTermStaged && (
                                                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round">
                                                                                        <polyline points="20 6 9 17 4 12" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                            <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] whitespace-nowrap ${isTermStaged ? 'text-white' : 'text-gray-900'}`}>{week}</span>
                                                                        </button>
                                                                    );
                                                                })
                                                            ) : cafeteriaFrequency === 'daily' ? (
                                                                ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => {
                                                                    const termId = `canteen-${selectedCanteenPlanId}-day-${day}`;
                                                                    const isTermStaged = isStaged(termId);
                                                                    return (
                                                                        <button
                                                                            key={day}
                                                                            disabled={!selectedCanteenPlan}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                if (!selectedCanteenPlan) return;
                                                                                const newService = {
                                                                                    id: termId,
                                                                                    description: `${selectedCanteenPlan.name} - ${day}`,
                                                                                    amount: selectedCanteenPlan.price / 20,
                                                                                    invoiceNo: "204",
                                                                                    academicYear: selectedAcademicYear,
                                                                                    pricing_id: selectedCanteenPlanId,
                                                                                    categoryId: schoolData?.category_ids?.canteen
                                                                                };
                                                                                setStagedItems(prev => {
                                                                                    const exists = prev.some(s => s.id === termId);
                                                                                    return exists ? prev.filter(s => s.id !== termId) : [...prev, newService];
                                                                                });
                                                                                haptics.selection();
                                                                            }}
                                                                            className={`h-[60px] rounded-[12px] border-[1.5px] px-4 flex items-center gap-3 transition-all active:scale-[0.95] ${isTermStaged ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]' : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'} ${!selectedCanteenPlan ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                        >
                                                                            <div className={`size-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isTermStaged ? 'border-[#95e36c] bg-[#95e36c]' : 'border-gray-200 bg-transparent'}`}>
                                                                                {isTermStaged && (
                                                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round">
                                                                                        <polyline points="20 6 9 17 4 12" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                            <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] whitespace-nowrap ${isTermStaged ? 'text-white' : 'text-gray-900'}`}>{day}</span>
                                                                        </button>
                                                                    );
                                                                })
                                                            ) : cafeteriaFrequency === 'monthly' ? (
                                                                ['Jan', 'Feb', 'Mar', 'May', 'Jun', 'Jul', 'Sep', 'Oct', 'Nov']
                                                                    .filter(month => !isPastDate(month, selectedAcademicYear))
                                                                    .map((month) => {
                                                                    const termId = selectedCanteenPlan ? `canteen-${selectedCanteenPlanId}-month-${month}` : `canteen-month-${month}`;
                                                                    const isTermStaged = isStaged(termId);

                                                                    // Map month to term for invoice metadata
                                                                    const monthMap: Record<string, number> = {
                                                                        'Jan': 1, 'Feb': 1, 'Mar': 1,
                                                                        'May': 2, 'Jun': 2, 'Jul': 2,
                                                                        'Sep': 3, 'Oct': 3, 'Nov': 3
                                                                    };

                                                                    return (
                                                                        <button
                                                                            key={month}
                                                                            disabled={!selectedCanteenPlan}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                if (!selectedCanteenPlan) return;

                                                                                const newService = {
                                                                                    id: termId,
                                                                                    description: `${selectedCanteenPlan.name} - ${month} ${selectedAcademicYear}`,
                                                                                    amount: selectedCanteenPlan.price, // Base monthly price
                                                                                    invoiceNo: "204",
                                                                                    term: monthMap[month],
                                                                                    academicYear: selectedAcademicYear,
                                                                                    pricing_id: selectedCanteenPlanId,
                                                                                    categoryId: schoolData?.category_ids?.canteen
                                                                                };

                                                                                setStagedItems(prev => {
                                                                                    const exists = prev.some(s => s.id === termId);
                                                                                    return exists ? prev.filter(s => s.id !== termId) : [...prev, newService];
                                                                                });
                                                                                haptics.selection();
                                                                            }}
                                                                            className={`h-[60px] rounded-[12px] border-[1.5px] px-4 flex items-center gap-3 transition-all active:scale-[0.95] ${isTermStaged
                                                                                ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]'
                                                                                : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'
                                                                                } ${!selectedCanteenPlan ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                        >
                                                                            <div className={`size-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isTermStaged ? 'border-[#95e36c] bg-[#95e36c]' : 'border-gray-200 bg-transparent'}`}>
                                                                                {isTermStaged && (
                                                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round">
                                                                                        <polyline points="20 6 9 17 4 12" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                            <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] whitespace-nowrap ${isTermStaged ? 'text-white' : 'text-gray-900'}`}>{month}</span>
                                                                        </button>
                                                                    );
                                                                })
                                                            ) : null}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ) : ['uniforms', 'trips', 'sports'].includes(activeTab) ? (
                                    <div className="flex flex-col gap-4">
                                        {/* Top Label */}
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-[#808080] text-[12px] font-['Inter',sans-serif] font-bold">
                                                Select Product Type - {Object.values(otherQuantities).filter(q => q > 0).length} Selected
                                            </span>
                                        </div>

                                        {(() => {
                                            const filtered = schoolData?.other_services?.filter(s => {
                                                const cat = s.category?.toLowerCase() || '';
                                                if (activeTab === 'uniforms') return cat.includes('uniform');
                                                if (activeTab === 'trips') return cat.includes('trip') || cat.includes('tour');
                                                if (activeTab === 'sports') return cat.includes('sport') || cat.includes('club');
                                                if (activeTab === 'boarding') return cat.includes('boarding');
                                                return true;
                                            }) || [];

                                            const grouped = filtered.reduce((acc, s) => {
                                                const name = s.category_name || 'Other';
                                                if (!acc[name]) acc[name] = [];
                                                acc[name].push(s);
                                                return acc;
                                            }, {} as Record<string, any[]>);

                                            if (filtered.length === 0) {
                                                return (
                                                    <div className="w-full bg-white rounded-[20px] outline outline-[1px] outline-offset-[-1px] outline-gray-200 p-8 flex flex-col items-center justify-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-gray-400 text-sm font-medium">No items available</span>
                                                    </div>
                                                );
                                            }

                                            return Object.entries(grouped).map(([catName, items], catIdx) => {
                                                const hasActiveItems = items.some(svc => (otherQuantities[svc.id] || 0) > 0);

                                                if (activeTab === 'trips') {
                                                    return (
                                                        <div key={`trips-${catName}-${catIdx}`} className="w-full flex flex-col gap-5">
                                                            {items.map((svc) => {
                                                                const qty = otherQuantities[svc.id] || 0;
                                                                const itemId = `other-${svc.id}`;

                                                                const handleQtyChange = (newQty: number) => {
                                                                    setOtherQuantities(prev => ({ ...prev, [svc.id]: newQty }));
                                                                    haptics.selection();
                                                                    if (newQty === 0) {
                                                                        setStagedItems(prev => prev.filter(p => p.id !== itemId));
                                                                    } else {
                                                                        setStagedItems(prev => {
                                                                            const exists = prev.find(p => p.id === itemId);
                                                                            if (exists) {
                                                                                return prev.map(p => p.id === itemId ? { ...p, amount: svc.price * newQty, quantity: newQty } : p);
                                                                            }
                                                                            return [...prev, {
                                                                                id: itemId,
                                                                                description: svc.name,
                                                                                amount: svc.price * newQty,
                                                                                quantity: newQty,
                                                                                invoiceNo: "205",
                                                                                pricing_id: svc.id,
                                                                                categoryId: schoolData?.category_ids?.trips || schoolData?.category_ids?.other
                                                                            }];
                                                                        });
                                                                    }
                                                                };

                                                                return (
                                                                    <div key={svc.id} className="relative w-full bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-row items-stretch overflow-visible transition-all active:scale-[0.98]">
                                                                        {/* Left Side: Destination Info */}
                                                                        <div className="flex-1 p-5 flex flex-col justify-center">
                                                                            <div className="flex items-center gap-4 mb-2.5">
                                                                                <Plane className="text-[#003630] shrink-0" size={14} strokeWidth={2.5} />
                                                                                <span className="text-[13px] uppercase tracking-widest text-[#003630] font-bold font-['Inter',sans-serif]">Trip Destination</span>
                                                                            </div>
                                                                            <h3 className="text-black text-[10px] font-bold font-['Inter',sans-serif] leading-tight mb-1.5 pr-2">{svc.name}</h3>
                                                                            <div className="flex items-center gap-3">
                                                                                <MapPin className="text-gray-400 shrink-0" size={12} />
                                                                                <span className="text-gray-500 text-[10px] font-medium font-['Inter',sans-serif]">{catName}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Right Side: The stub */}
                                                                        <div className="w-[110px] bg-[#f8f8f8] border-l-[2px] border-dashed border-gray-200 flex flex-col items-center justify-center p-3 relative rounded-r-[20px]">
                                                                            {/* Semi-circle cutouts (Boarding Pass effect) */}
                                                                            <div className="absolute -top-[11px] -left-[11px] w-[20px] h-[20px] bg-[#fdfdfd] rounded-full border-b border-gray-100 shadow-inner" style={{ clipPath: 'inset(50% 0 0 50%)' }} />
                                                                            <div className="absolute -bottom-[11px] -left-[11px] w-[20px] h-[20px] bg-[#fdfdfd] rounded-full border-t border-gray-100 shadow-inner" style={{ clipPath: 'inset(0 0 50% 50%)' }} />

                                                                            <span className="text-black font-extrabold font-['Inter',sans-serif] text-[12px] mb-3">K{svc.price.toLocaleString()}</span>

                                                                            {qty === 0 ? (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleQtyChange(1); }}
                                                                                    className="w-full h-9 rounded-[12px] bg-[#003630] text-white text-[12px] font-bold shadow-[0_4px_12px_rgba(0,54,48,0.2)] active:opacity-80"
                                                                                >
                                                                                    Book
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleQtyChange(0); }}
                                                                                    className="w-full h-9 rounded-[12px] bg-white border-[1.5px] border-[#95e36c] text-[#003630] text-[12px] font-bold shadow-[0_2px_8px_rgba(149,227,108,0.1)] active:opacity-80 flex items-center justify-center gap-2"
                                                                                >

                                                                                    Booked
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                }

                                                if (activeTab === 'sports') {
                                                    const sportsItems = schoolData?.other_services?.filter(s => {
                                                        const cat = s.category?.toLowerCase() || '';
                                                        return cat.includes('sport') || cat.includes('club');
                                                    }) || [];

                                                    const selectedSportsPlan = sportsItems.find(s => s.id === selectedSportsPlanId);

                                                    return (
                                                        <div key={`sports-group-${catIdx}`} className="flex flex-col gap-6">
                                                            {/* Plan Selection */}
                                                            <div className="flex flex-col gap-3">
                                                                <label className="text-[13px] font-semibold text-gray-500 mb-1 ml-1 text-left w-full">Select Club / Sport</label>
                                                                <div className="relative">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setIsSportsDropdownOpen(!isSportsDropdownOpen);
                                                                        }}
                                                                        className="w-full h-[60px] bg-white border border-gray-100 rounded-[24px] px-6 flex items-center justify-between shadow-[0px_4px_16px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all group pointer-events-auto cursor-pointer"
                                                                    >
                                                                        <div className="flex flex-col items-start">
                                                                            <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-gray-900">
                                                                                {selectedSportsPlan?.name || "Choose a Club or Sport"}
                                                                            </span>
                                                                            {selectedSportsPlan && (
                                                                                <span className="text-[11px] text-gray-400">
                                                                                    K{selectedSportsPlan.price.toLocaleString()} per month
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${isSportsDropdownOpen ? 'rotate-180' : ''}`}>
                                                                            <path d="m6 9 6 6 6-6" />
                                                                        </svg>
                                                                    </button>

                                                                    <AnimatePresence>
                                                                        {isSportsDropdownOpen && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0, y: -10 }}
                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                exit={{ opacity: 0, y: -10 }}
                                                                                className="absolute top-full mt-3 left-0 right-0 bg-white border border-gray-100 rounded-[24px] shadow-[0px_20px_50px_rgba(0,0,0,0.18)] z-[100] overflow-hidden max-h-[300px] overflow-y-auto pointer-events-auto"
                                                                            >
                                                                                <div className="p-3 flex flex-col gap-1">
                                                                                    {sportsItems.map((item) => (
                                                                                        <button
                                                                                            key={item.id}
                                                                                            onClick={(e) => {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                                setSelectedSportsPlanId(item.id);
                                                                                                setIsSportsDropdownOpen(false);
                                                                                                haptics.selection();
                                                                                            }}
                                                                                            className={`w-full px-5 py-4 text-left rounded-[18px] transition-all flex items-center justify-between group pointer-events-auto cursor-pointer ${selectedSportsPlanId === item.id ? 'bg-[#003630] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                                                                                        >
                                                                                            <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[13px] ${selectedSportsPlanId === item.id ? 'text-white' : 'text-gray-900'}`}>
                                                                                                {item.name}
                                                                                            </span>
                                                                                            <span className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[11px] ${selectedSportsPlanId === item.id ? 'text-white' : 'text-[#003630]'}`}>
                                                                                                K{item.price.toLocaleString()}
                                                                                            </span>
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            </div>

                                                            {/* Academic Year Selector */}
                                                            {!isSportsDropdownOpen && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    className="flex flex-col gap-6"
                                                                >
                                                                    <div className="flex flex-col gap-3">
                                                                        <label className="text-[13px] font-semibold text-gray-500 mb-1 ml-1 text-left w-full">Academic Year</label>
                                                                        <div className="relative">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    setIsYearDropdownOpen(!isYearDropdownOpen);
                                                                                }}
                                                                                className="w-full h-[60px] bg-white border border-gray-100 rounded-[24px] px-6 flex items-center justify-between shadow-[0px_4px_16px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all group pointer-events-auto cursor-pointer"
                                                                            >
                                                                                <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-gray-900">
                                                                                    {selectedAcademicYear}
                                                                                </span>
                                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 group-hover:text-black transition-transform duration-300 ${isYearDropdownOpen ? 'rotate-180' : ''}`}>
                                                                                    <path d="m6 9 6 6 6-6" />
                                                                                </svg>
                                                                            </button>

                                                                            <AnimatePresence>
                                                                                {isYearDropdownOpen && (
                                                                                    <motion.div
                                                                                        initial={{ opacity: 0, y: -10 }}
                                                                                        animate={{ opacity: 1, y: 0 }}
                                                                                        exit={{ opacity: 0, y: -10 }}
                                                                                        className="absolute top-full mt-3 left-0 right-0 bg-white border border-gray-100 rounded-[24px] shadow-[0px_20px_50px_rgba(0,0,0,0.18)] z-[90] overflow-hidden pointer-events-auto"
                                                                                    >
                                                                                        <div className="p-3 flex flex-col gap-1">
                                                                                            {[new Date().getFullYear(), new Date().getFullYear() + 1].map((year) => (
                                                                                                <button
                                                                                                    key={year}
                                                                                                    onClick={(e) => {
                                                                                                        e.preventDefault();
                                                                                                        e.stopPropagation();
                                                                                                        setSelectedAcademicYear(year);
                                                                                                        setIsYearDropdownOpen(false);
                                                                                                        haptics.selection();
                                                                                                    }}
                                                                                                    className={`w-full px-5 py-4 text-left rounded-[18px] transition-all flex items-center justify-between group pointer-events-auto cursor-pointer ${selectedAcademicYear === year ? 'bg-[#003630] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                                                                                                >
                                                                                                    <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[13px] ${selectedAcademicYear === year ? 'text-white' : 'text-gray-900'}`}>
                                                                                                        {year}
                                                                                                    </span>
                                                                                                </button>
                                                                                            ))}
                                                                                        </div>
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    </div>

                                                                    {/* Frequency Selector */}
                                                                    <div className="flex flex-col gap-3">
                                                                        <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[10px] text-gray-500 uppercase tracking-[0.15em] ml-1 text-left w-full">Subscription Frequency</h3>
                                                                        <div className="grid grid-cols-3 gap-3">
                                                                            {['monthly', 'termly', 'yearly'].map((freq) => (
                                                                                <button
                                                                                    key={freq}
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        haptics.selection();
                                                                                        setSportsFrequency(freq as any);
                                                                                    }}
                                                                                    className={`h-[48px] rounded-[12px] border-[1.5px] transition-all active:scale-[0.95] flex items-center justify-center gap-2 ${sportsFrequency === freq
                                                                                        ? 'bg-[#003630] border-[#003630] shadow-[0px_8px_25px_rgba(0,54,48,0.25)]'
                                                                                        : 'bg-white border-gray-100 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]'
                                                                                        }`}
                                                                                >
                                                                                    <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[11px] capitalize ${sportsFrequency === freq ? 'text-white' : 'text-gray-900'}`}>
                                                                                        {freq}
                                                                                    </span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* Period Selection Grid */}
                                                                    <div className="flex flex-col gap-4">
                                                                        <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[10px] text-gray-500 uppercase tracking-[0.15em] ml-1 text-left w-full">
                                                                            {sportsFrequency === 'monthly' ? 'Select Months' : sportsFrequency === 'termly' ? 'Select Terms' : 'One Year Membership'}
                                                                        </h3>

                                                                        <div className="grid grid-cols-3 gap-4">
                                                                            {sportsFrequency === 'termly' ? (
                                                                                [1, 2, 3].filter(term => !isPastDate(term, selectedAcademicYear)).map((term) => {
                                                                                    const termId = selectedSportsPlan ? `sports-${selectedSportsPlanId}-term-${term}` : `sports-term-${term}`;
                                                                                    const isTermStaged = isStaged(termId);

                                                                                    return (
                                                                                        <button
                                                                                            key={term}
                                                                                            disabled={!selectedSportsPlan}
                                                                                            onClick={(e) => {
                                                                                                e.preventDefault();
                                                                                                if (!selectedSportsPlan) return;

                                                                                                const newService = {
                                                                                                    id: termId,
                                                                                                    description: `${selectedSportsPlan.name} Membership - Term ${term}`,
                                                                                                    amount: selectedSportsPlan.price * 3,
                                                                                                    invoiceNo: "205",
                                                                                                    term: term,
                                                                                                    academicYear: selectedAcademicYear,
                                                                                                    pricing_id: selectedSportsPlanId,
                                                                                                    categoryId: schoolData?.category_ids?.other
                                                                                                };

                                                                                                setStagedItems(prev => {
                                                                                                    const exists = prev.some(s => s.id === termId);
                                                                                                    return exists ? prev.filter(s => s.id !== termId) : [...prev, newService];
                                                                                                });
                                                                                                haptics.selection();
                                                                                            }}
                                                                                            className={`h-[60px] rounded-[12px] border-[1.5px] px-2 flex items-center justify-center gap-2 transition-all active:scale-[0.95] ${isTermStaged ? 'bg-[#003630] border-[#003630] text-white shadow-[0px_8px_25px_rgba(0,54,48,0.25)]' : 'bg-white border-gray-100 text-gray-900'} ${!selectedSportsPlan ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                                        >
                                                                                            <span className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px]">Term {term}</span>
                                                                                        </button>
                                                                                    );
                                                                                })
                                                                            ) : sportsFrequency === 'monthly' ? (
                                                                                ['Jan', 'Feb', 'Mar', 'May', 'Jun', 'Jul', 'Sep', 'Oct', 'Nov']
                                                                                    .filter(month => !isPastDate(month, selectedAcademicYear))
                                                                                    .map((month) => {
                                                                                    const termId = `sports-${selectedSportsPlanId}-month-${month}`;
                                                                                    const isTermStaged = isStaged(termId);

                                                                                    return (
                                                                                        <button
                                                                                            key={month}
                                                                                            disabled={!selectedSportsPlan}
                                                                                            onClick={(e) => {
                                                                                                e.preventDefault();
                                                                                                if (!selectedSportsPlan) return;

                                                                                                const newService = {
                                                                                                    id: termId,
                                                                                                    description: `${selectedSportsPlan.name} - ${month} ${selectedAcademicYear}`,
                                                                                                    amount: selectedSportsPlan.price,
                                                                                                    invoiceNo: "205",
                                                                                                    academicYear: selectedAcademicYear,
                                                                                                    pricing_id: selectedSportsPlanId,
                                                                                                    categoryId: schoolData?.category_ids?.other
                                                                                                };

                                                                                                setStagedItems(prev => {
                                                                                                    const exists = prev.some(s => s.id === termId);
                                                                                                    return exists ? prev.filter(s => s.id !== termId) : [...prev, newService];
                                                                                                });
                                                                                                haptics.selection();
                                                                                            }}
                                                                                            className={`h-[60px] rounded-[12px] border-[1.5px] flex items-center justify-center transition-all active:scale-[0.95] ${isTermStaged ? 'bg-[#003630] border-[#003630] text-white shadow-[0px_8px_25px_rgba(0,54,48,0.25)]' : 'bg-white border-gray-100 text-gray-900'} ${!selectedSportsPlan ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                                        >
                                                                                            <span className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px]">{month}</span>
                                                                                        </button>
                                                                                    );
                                                                                })
                                                                            ) : (
                                                                                <button
                                                                                    disabled={!selectedSportsPlan}
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        if (!selectedSportsPlan) return;
                                                                                        const termId = `sports-${selectedSportsPlanId}-year`;
                                                                                        const newService = {
                                                                                            id: termId,
                                                                                            description: `${selectedSportsPlan.name} - Full Year ${selectedAcademicYear}`,
                                                                                            amount: selectedSportsPlan.price * 9,
                                                                                            invoiceNo: "205",
                                                                                            academicYear: selectedAcademicYear,
                                                                                            pricing_id: selectedSportsPlanId,
                                                                                            categoryId: schoolData?.category_ids?.other
                                                                                        };
                                                                                        setStagedItems(prev => {
                                                                                            const exists = prev.some(s => s.id === termId);
                                                                                            return exists ? prev.filter(s => s.id !== termId) : [...prev, newService];
                                                                                        });
                                                                                        haptics.selection();
                                                                                    }}
                                                                                    className={`col-span-3 h-[60px] rounded-[12px] border-[1.5px] flex items-center justify-center transition-all active:scale-[0.95] ${isStaged(`sports-${selectedSportsPlanId}-year`) ? 'bg-[#003630] border-[#003630] text-white shadow-[0px_8px_25px_rgba(0,54,48,0.25)]' : 'bg-white border-gray-100 text-gray-900'} ${!selectedSportsPlan ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                                >
                                                                                    <span className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px]">Pay for Full Academic Year</span>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                // Default Standard Category List Layout
                                                return (
                                                    <div
                                                        key={catName}
                                                        className="w-full bg-[#fdfdfd] rounded-[24px] outline outline-[1px] outline-offset-[-1px] outline-[#e6e6e6] p-5 flex flex-col gap-5 transition-all duration-300"
                                                        style={{
                                                            boxShadow: hasActiveItems ? '0 12px 32px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)' : '0 4px 12px rgba(0,0,0,0.03)'
                                                        }}
                                                    >
                                                        <div className="flex items-center px-1">
                                                            <span className="text-black text-[13px] font-['Inter',sans-serif] font-normal">
                                                                {catName}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            {items.map((svc, idx, arr) => {
                                                                const qty = otherQuantities[svc.id] || 0;
                                                                return (
                                                                    <Fragment key={svc.id}>
                                                                        <div className="flex items-start gap-3 w-full pl-1">
                                                                            <div className="pt-0.5 shrink-0">
                                                                                {(() => {
                                                                                    const catLower = catName.toLowerCase();
                                                                                    const svcNameLower = svc.name.toLowerCase();
                                                                                    let IconComponent = Package;
                                                                                    const iconColor = "#8C8C8C"; // Medium Grey color matching the required aesthetic
                                                                                    const shadowColor = "transparent";

                                                                                    if (catLower.includes('jersey') || catLower.includes('uniform') || catLower.includes('shirt')) {
                                                                                        IconComponent = Shirt;
                                                                                    } else if (catLower.includes('trip') || catLower.includes('bus') || catLower.includes('transport')) {
                                                                                        IconComponent = Bus;
                                                                                    } else if (catLower.includes('club') || catLower.includes('activities') || catLower.includes('sport')) {
                                                                                        IconComponent = Users;
                                                                                    } else if (catLower.includes('board') || catLower.includes('hostel') || catLower.includes('bed')) {
                                                                                        IconComponent = Home;
                                                                                    } else if (catLower.includes('book') || catLower.includes('stationery')) {
                                                                                        IconComponent = BookOpen;
                                                                                    } else if (catLower.includes('meal') || catLower.includes('canteen') || catLower.includes('food') || catLower.includes('lunch')) {
                                                                                        IconComponent = Coffee;
                                                                                    }

                                                                                    return <IconComponent
                                                                                        strokeWidth={2}
                                                                                        size={22}
                                                                                        color={iconColor}
                                                                                        style={shadowColor !== 'transparent' ? { filter: `drop-shadow(0px 3px 6px ${shadowColor})` } : undefined}
                                                                                    />;
                                                                                })()}
                                                                            </div>

                                                                            <div className="flex-1 flex flex-col justify-center items-start">
                                                                                <div className="flex flex-row items-baseline gap-2 flex-wrap">
                                                                                    <div className="text-black text-[12px] font-normal leading-tight font-['Inter',sans-serif]">
                                                                                        {svc.name}
                                                                                    </div>
                                                                                    <div className="text-black text-[12px] font-bold font-['Inter',sans-serif]">
                                                                                        K{svc.price.toLocaleString()}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="mt-4 rounded-[2px] inline-flex items-center justify-between h-7 px-1 min-w-[72px]">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const newQty = Math.max(0, qty - 1);
                                                                                            setOtherQuantities(prev => ({ ...prev, [svc.id]: newQty }));
                                                                                            haptics.selection();
                                                                                            const itemId = `other-${svc.id}`;
                                                                                            if (newQty === 0) {
                                                                                                setStagedItems(prev => prev.filter(p => p.id !== itemId));
                                                                                            } else {
                                                                                                setStagedItems(prev => {
                                                                                                    const exists = prev.find(p => p.id === itemId);
                                                                                                    if (exists) {
                                                                                                        return prev.map(p => p.id === itemId ? { ...p, amount: svc.price * newQty, quantity: newQty } : p);
                                                                                                    }
                                                                                                    return [...prev, {
                                                                                                        id: itemId,
                                                                                                        description: svc.name,
                                                                                                        amount: svc.price * newQty,
                                                                                                        quantity: newQty,
                                                                                                        invoiceNo: "205",
                                                                                                        pricing_id: svc.id,
                                                                                                        categoryId: svc.category_name?.toLowerCase() === 'uniforms' ? schoolData?.category_ids?.uniforms : (svc.category_name?.toLowerCase() === 'trips' ? schoolData?.category_ids?.trips : schoolData?.category_ids?.other)
                                                                                                    }];
                                                                                                });
                                                                                            }
                                                                                        }}
                                                                                        className="w-[22px] h-[22px] flex items-center justify-center text-[#95e36c] active:scale-[0.85] transition-all"
                                                                                    >
                                                                                        <span className="font-['Inter',sans-serif] font-bold text-[18px] leading-none mb-[2px] block">-</span>
                                                                                    </button>
                                                                                    <div className="flex-1 flex items-center justify-center font-['Inter',sans-serif] font-bold text-[13px] text-black shrink-0 px-2 leading-none">
                                                                                        {qty}
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const newQty = qty + 1;
                                                                                            setOtherQuantities(prev => ({ ...prev, [svc.id]: newQty }));
                                                                                            haptics.selection();
                                                                                            const itemId = `other-${svc.id}`;
                                                                                            setStagedItems(prev => {
                                                                                                const exists = prev.find(p => p.id === itemId);
                                                                                                if (exists) {
                                                                                                    return prev.map(p => p.id === itemId ? { ...p, amount: svc.price * newQty, quantity: newQty } : p);
                                                                                                }
                                                                                                return [...prev, {
                                                                                                    id: itemId,
                                                                                                    description: svc.name,
                                                                                                    amount: svc.price * newQty,
                                                                                                    quantity: newQty,
                                                                                                    invoiceNo: "205",
                                                                                                    pricing_id: svc.id,
                                                                                                    categoryId: svc.category_name?.toLowerCase() === 'uniforms' ? schoolData?.category_ids?.uniforms : (svc.category_name?.toLowerCase() === 'trips' ? schoolData?.category_ids?.trips : schoolData?.category_ids?.other)
                                                                                                }];
                                                                                            });
                                                                                        }}
                                                                                        className="w-[22px] h-[22px] flex items-center justify-center text-[#003630] active:scale-[0.85] transition-all"
                                                                                    >
                                                                                        <span className="font-['Inter',sans-serif] font-bold text-[16px] leading-none mb-[2px] block">+</span>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        {idx < items.length - 1 && (
                                                                            <div className="h-[12px]" />
                                                                        )}
                                                                    </Fragment>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            });

                                        })()}
                                    </div>
                                ) : null}
                            </motion.div>
                        </AnimatePresence>

                    </div>
                </div>

                {/* Standard Flex Footer - High Fidelity Design */}
                <div className="w-full shrink-0 bg-white pt-5 border-t border-gray-100 shadow-[0px_-20px_50px_rgba(0,0,0,0.05)] z-[80] pb-[env(safe-area-inset-bottom)] pb-6 relative">
                    <div className="flex items-center justify-between mb-5 px-6">
                        <span className="text-[17px] font-bold text-black tracking-tight font-['Inter',sans-serif]">Subtotal</span>
                        <span className="text-[17px] font-bold text-black tracking-tight uppercase font-['Inter',sans-serif]">
                            K{stagedItems.reduce((sum, s) => sum + s.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="px-6">
                        <button
                            disabled={isTabLocked}
                            onClick={() => {
                                if (isTabLocked) return;
                                console.log("[UnifiedServicesPopup] Confirming staged selection of", stagedItems.length, "items");
                                haptics.success();
                                onConfirm(stagedItems);
                            }}
                            className={`w-full h-[60px] flex items-center justify-center rounded-[20px] transition-all pointer-events-auto ${isTabLocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-[#003630] text-white active:scale-[0.98] shadow-[0px_8px_24px_rgba(0,54,48,0.2)]'}`}
                        >
                            <span className="font-['Inter',sans-serif] font-bold text-[15px]">
                                {isTabLocked ? 'Please Settle Arrears First' : `Confirm & Add ${stagedItems.length} ${stagedItems.length === 1 ? 'Item' : 'Items'}`}
                            </span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
