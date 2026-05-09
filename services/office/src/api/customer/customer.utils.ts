import { HydratedDocument } from 'mongoose';
import { Customer, CustomerType } from './customer.schema';

/**
 * Validates if the customer is of legal age
 */
export function validatesCustomerLegalAgeClaim(customer: HydratedDocument<Customer>): boolean {
    if (customer.type == CustomerType.Business) {
        return true;
    }
    if (!customer.claims.individualInformation?.dateOfBirth) {
        return false;
    }

    return validatesLegalAge(customer.claims.individualInformation.dateOfBirth);
}

/**
 * dateOfBirth in the format of YYYY-MM-DD
 * @param dateOfBirth
 * @returns boolean
 */
export function validatesLegalAge(dateOfBirth: string): boolean {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);

    // Calculate age considering leap years
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    // Check if age is 18 or older
    return age >= 18;
}
