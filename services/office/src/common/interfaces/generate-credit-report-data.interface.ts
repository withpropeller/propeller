export interface GenerateCreditReportData {
    readonly bvn: string;
    readonly refresh?: boolean;
}

export interface GenerateCreditReportPDF {
    readonly reportId: string;
}
