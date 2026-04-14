import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { getStudentsByPhone, getInstitutionType } from "../data/students";
import type { Student } from "../data/students";
import { getPendingTransactionsForStudent, getInvoicesWithBalanceForStudent, getStudentFinancialSummary } from "../lib/supabase/api/transactions";
import type { Transaction } from "../types";
import type { PaymentHistoryRecord } from "../lib/supabase/types";


import { haptics } from "../utils/haptics";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import LogoHeader from "./common/LogoHeader";

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
}



function ChildPill({ name, isActive, hasBalance, onClick }: { name: string; id: string; admissionNumber?: string; isActive: boolean; hasBalance?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                haptics.selection();
                onClick();
            }}
            className={`h-[60px] relative rounded-[16px] shrink-0 transition-all ${isActive
                ? 'bg-[#95e36c]/40 text-[#003630] border-[1.5px] border-[#95e36c]/50 shadow-sm z-10'
                : 'bg-white border-[1.2px] border-gray-100 text-gray-500 hover:bg-gray-50'}`}
        >
            <div className="flex flex-row items-center justify-center h-full">
                <div className="flex gap-[10px] items-center justify-center px-[25px] py-[4px] relative h-full">
                    {isActive && (
                        <div className="w-[8px] h-[8px] rounded-full bg-[#95e36c] shrink-0 shadow-[0_0_8px_rgba(149,227,108,0.5)] animate-pulse" />
                    )}
                    <div className={`flex flex-col justify-end leading-[normal] relative shrink-0 text-[14px] whitespace-nowrap ${isActive ? "font-['Space_Grotesk',sans-serif] font-bold text-[#003630]" : "font-['Space_Grotesk',sans-serif] font-medium text-black/40"}`}>
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
                        ZMW {serviceTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                            ZMW {student.balances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                            key={service.id}
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
                                    <p className="leading-[1.4] whitespace-pre">K{service.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
    const [studentServices, setStudentServices] = useState<Record<string, Service[]>>({});

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
                    academicYear: year
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
                    academicYear: year
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
                    academicYear: new Date().getFullYear()
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
                        academicYear: isTx ? (metadata?.academicYear || (relevantDebt as any).academicYear) : (relevantDebt as any).academic_year
                    };
                }

                // Generate a unique ID for new service
                const uniqueId = `${service.id}-${service.term.replace(/\s+/g, '-')}-${service.route ? service.route.replace(/\s+/g, '-') : 'no-route'}-${Date.now()}-${index}`;

                const newSvc: Service = {
                    id: uniqueId,
                    description: buildServiceDescription(service),
                    amount: service.amount,
                    invoiceNo: "202",
                    term: parseInt(service.term.replace(/\D/g, '')) || 1,
                    academicYear: new Date().getFullYear(),
                    pricing_id: service.id // PRESERVE THE ORIGINAL FEE ITEM ID
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

    const handleNextOrCheckout = () => {
        haptics.heavy();
        if (totalAmount > 0 && onCheckout) {
            // Flatten all services with student names
            const allServicesWithStudents = Object.entries(studentServices).flatMap(([studentId, services]) => {
                const student = selectedStudents.find(s => s.id === studentId);
                const studentName = student?.name || 'Unknown Student';
                return services.map(service => ({
                    ...service,
                    studentName,
                    studentId,
                    term: service.term,
                    academicYear: service.academicYear,
                    grade: student?.grade
                }));
            });
            if (onCheckout) {
                onCheckout(allServicesWithStudents);
            }
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

                <div className="flex-1 flex flex-col pt-[48px] pb-[280px] overflow-y-auto no-scrollbar gap-4">
                    {/* Header Card */}
                    <div className="px-[44px]">
                        <div className="bg-[#f9fafb] rounded-[22px] p-[20px] shadow-inner flex flex-col gap-4">
                            <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] font-bold leading-[34px] not-italic text-[24px] text-black tracking-[-0.18px] flex items-center gap-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                                Products/Services Cart
                            </p>
                            <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] leading-[1.5] not-italic text-[#4b5563] text-[14px] tracking-[-0.12px] ">
                                Add the products and services you would like to pay for and proceed to checkout.
                            </p>
                        </div>
                    </div>

                    <div className="px-[24px] flex flex-col gap-4">
                        {/* Child Selection Section */}
                        <div className="mt-[12px] mb-[10px] flex flex-col items-center gap-4">
                            <div className="flex gap-[10px] items-center relative w-full overflow-x-auto no-scrollbar pb-1 px-1">
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
                                    <p className="font-['Inter',sans-serif] font-black text-[20px] text-black tracking-tight">Subtotal</p>
                                    <p className="font-['Inter',sans-serif] font-black text-[20px] text-black tracking-tight">
                                        K{(studentServices[activeStudentId] || []).reduce((sum, s) => sum + s.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="w-full">
                                    <button
                                        onClick={() => {
                                            haptics.buttonPress();
                                            // Handle opening the new unified interface
                                            toast.info("Opening Products & Services selection...");
                                        }}
                                        className="h-[80px] w-full rounded-[14px] border border-[#e5e7eb] bg-[#f9fafb] flex items-center justify-center gap-3 px-5 active:scale-[0.98] transition-all group hover:border-[#003630]/20 hover:bg-white shadow-sm"
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
                        <div className="bg-white rounded-[12px] p-2 flex items-center justify-between border-[2px] border-[#e2e8f0] shadow-[0px_25px_60px_rgba(0,0,0,0.15)] h-[80px]">
                            <div className="flex items-center gap-[14px] pl-[16px]">
                                <div className="text-[#003630]">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
                                    </svg>
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-['Inter',sans-serif] font-bold text-[24px] text-black leading-none tracking-tight">
                                        K{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
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
                                    className={`h-[60px] w-[180px] relative rounded-[14px] transition-all duration-300 flex items-center justify-center gap-[16px] z-30 ${hasServices
                                        ? 'bg-[#003630] touch-manipulation cursor-pointer active:scale-[0.97] drop-shadow-[0_15px_15px_rgba(0,0,0,0.4)]'
                                        : 'bg-gray-50 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-[16px] h-full w-full">
                                        <p className={`font-['Inter',sans-serif] font-extrabold text-[17px] ${hasServices ? 'text-white' : 'text-gray-300'}`}>
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
        </div>
    );
}
