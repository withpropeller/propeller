export interface RemitaSalaryHistoryData {
    customerId: string;
    accountNumber: string;
    bankCode: string;
    bvn: string;
    companyName: string;
    customerName: string;
    category: any;
    firstPaymentDate: string;
    salaryCount: string;
    salaryPaymentDetails: RemitaSalaryPaymentDetails[];
    loanHistoryDetails: RemitaLoanHistoryDetails[];
    authorisationCode: string;
    authorisationChannel: string;
    phoneNumber: string;
}

export interface RemitaSalaryPaymentDetails {
    paymentDate: string;
    amount: string;
    accountNumber: string;
    bankCode: string;
}

export interface RemitaLoanHistoryDetails {
    loanProvider: string;
    loanAmount: number;
    outstandingAmount: number;
    loanDisbursementDate: string;
    status: 'NEW';
    repaymentAmount: number;
    repaymentFreq: 'MONTHLY';
}

export interface RemitaMandateData {
    authorisationCode: string;
    accountNumber: string;
    bankCode: string;
    amount: string;
    customerId: string;
    status: string;
    mandateReference: string;
    paymentDate: string;
}

export type RemitaMandateDataUpdate = Pick<RemitaMandateData, 'status' | 'paymentDate' | 'amount'>;

export interface RemitaStopMandateResponse {
    amount: string;
    status: string;
    paymentDate: string;
}
