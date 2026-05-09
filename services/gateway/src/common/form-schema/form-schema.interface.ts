import { FormInputTypes } from './form-schema.enums';

export interface FormSchemaField {
    label: string;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    description?: string;
    validators: IFormValidators[];
    column?: number;
    inputType: FormInputTypes;
    options?: string[];
}

export interface IFormValidators {
    name: string;
    args?: any[];
}

export interface IFormSchema {
    name: string;
    fields: FormSchemaField[];
}
