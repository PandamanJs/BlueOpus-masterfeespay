
export interface School {
    id: string;
    school_id?: string;
    name: string;
    school_name?: string;
    logo_url?: string;
    address?: string;
}

export interface StudentWithSchool {
    student_id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    name: string;
    grade: string;
    class?: string;
    verification_status?: 'unverified' | null;
    school: School;
}

export interface Parent {
    id: string;
    parent_id: string;
    name: string;
    phone_number: string;
    phone: string;
    email?: string | null;
}

export interface ParentWithStudents extends Parent {
    students: StudentWithSchool[];
}

export interface PaymentHistoryRecord {
    id: string;
    payment_date: string;
    reference: string;
    total_amount: number;
    base_amount: number;
    service_fee: number;
    status: string;
    payment_method: string;
    student_name: string;
    admission_number: string;
    school_name: string;
    parent_phone: string;
    parent_id: string;
    student_id: string;
    school_id: string;
    term: number;
    academic_year: number;
    services: any[];
    completed_at: string;
    initiated_at: string;
    parent_name?: string;
    transaction_type?: string;
    linked_invoice_id?: string;
    amount_paid?: number;
    balance_remaining?: number;
    invoice_number?: string;
    service_name?: string;
}


