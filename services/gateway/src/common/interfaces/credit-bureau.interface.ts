export enum BureauSource {
    CRC = 'CRC',
    FC = 'FIRST_CENTRAL',
    CR = 'CREDIT_REGISTRY',
}

export interface BureauCreditReport {
    source: BureauSource;
    errored?: boolean;
    data: {
        identity: BureauCreditIdentity;
        accounts: BureauCreditAccount[];
        summary: BureauCreditSummary;
        score: BureauCreditScore;
    };
}

export interface BureauCreditAccount {
    providerName: string;
    creditType: string;
    currency: string;
    date: Date;
    maturityDate: Date;
    loanAmount: number;
    outstandingBalance: number;
    overdueAmount: number;
    status: 'OPEN' | 'CLOSED' | 'WRITTEN_OFF';
    performanceStatus: 'Performing' | 'Non Performing' | 'Watchlist' | 'Sub Standard' | 'Doubtful' | 'Lost';
    lastUpdated: Date;
    dateReported: Date;
    delinquencyStatus: string;
}

export interface BureauCreditIdentity {
    name: string;
    phone: string;
    gender: string;
    dateOfBirth: string;
    email: string;
    address: string;
}

export interface BureauCreditSummary {
    totalAccounts: number;
    totalBorrowed: number;
    totalOutstanding: number;
    totalOverdue: number;
    performing: number;
    performingAmount: number;
    nonPerforming: number;
    nonPerformingAmount: number;
    highestLoanAmount: number;
    paidOff: number;
    paidOffAmount: number;
    delinquencies: number;
}

export interface BureauCreditScore {
    score: number;
    rating: string;
    reasons: string[];
}
