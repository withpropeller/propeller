export interface IBillOptions {
    biller_code?: string;
    data_bundle?: number;
    airtime?: number;
    power?: number;
    internet?: number;
    toll?: number;
    cables?: number;
}

export interface IBillCategoriesData {
    id: number;
    biller_code: string;
    name: string;
    default_commission: number;
    date_added: string;
    country: string;
    is_airtime: boolean;
    biller_name: string;
    item_code: string;
    short_name: string;
    fee: number;
    commission_on_fee: boolean;
    label_name: string;
    amount: number;
}

export interface IBillPaymentData {
    phone: string;
    amount: number;
    network: string;
    rawData: any;
}

export interface IBillServices {
    serviceID: string;
    name: string;
    minimium_amount: string;
    maximum_amount: string;
    convinience_fee: string;
    product_type: string;
    image: string;
}

export interface IBillVariation {
    variation_code: string;
    name: string;
    variation_amount: string;
    fixedPrice: string;
}

export interface IBillVariationCodes {
    ServiceName: string;
    serviceID: string;
    convinience_fee: string;
    variations: IBillVariation[];
}

export interface IBillsPayment {
    code: string;
    content: {
        transactions: {
            status: string;
            product_name: string;
            unique_element: string;
            unit_price: string;
            quantity: string;
            service_verification: string;
            channel: string;
            commission: string;
            total_amount: string;
            discount: string;
            type: string;
            email: string;
            phone: string;
            name: string;
            convinience_fee: string;
            amount: string;
            platform: string;
            method: string;
            transactionId: string;
        };
    };
    response_description: string;
    requestId: string;
    amount: string;
    transaction_date: Record<string, string>;
    purchased_code: string;
}
