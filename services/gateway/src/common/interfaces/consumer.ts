import { Report } from './report';

export interface Customer {
    allaweeId: string;

    identity: {
        bvn: string;
    };

    report: Report;
}
