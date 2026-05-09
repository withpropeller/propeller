import { HydratedDocument } from 'mongoose';
import { Customer, CustomerType } from './customer.schema';
import { CustomerException } from './customer.exception';

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

export function ensureCustomerCustomerLegalAgeClaim(customer: HydratedDocument<Customer>): void {
    if (!validatesCustomerLegalAgeClaim(customer)) {
        throw CustomerException.ClaimsIncomplete.setMessage('Customer Legal Age is required');
    }
}

export function ensureCustomerLegalName(customer: HydratedDocument<Customer>): void {
    if (customer.type == CustomerType.Business && !customer.claims?.businessInformation?.registrationName) {
        throw CustomerException.ClaimsIncomplete.setMessage('Customer Legal Name is required for Business customers');
    }

    if (
        customer.type == CustomerType.Individual &&
        !customer.claims?.individualInformation?.firstName &&
        !customer.claims?.individualInformation?.lastName
    ) {
        throw CustomerException.ClaimsIncomplete.setMessage('Customer Legal Name is required for Individual customers');
    }
}

export function ensureIndividualCustomerLegalAddress(customer: HydratedDocument<Customer>): void {
    if (customer.type == CustomerType.Individual && !customer.claims?.individualAddress) {
        throw CustomerException.ClaimsIncomplete.setMessage(
            'Customer Individual Address required for creating virtual card',
        );
    }
}

export function ensureCustomerLegalAddress(customer: HydratedDocument<Customer>): void {
    if (customer.type == CustomerType.Individual && !customer.claims?.individualAddress) {
        throw CustomerException.ClaimsIncomplete.setMessage(
            'Customer Individual Address required for creating virtual card',
        );
    }

    if (customer.type == CustomerType.Business && !customer.claims?.businessAddress) {
        throw CustomerException.ClaimsIncomplete.setMessage(
            'Customer Business Address required for creating virtual card',
        );
    }
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
