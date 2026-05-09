import { HydratedDocument } from 'mongoose';
import { MerchantCategoryMap } from './merchant.enums';
import { Merchant } from './merchant.schema';

export interface MerchantPattern {
    keywords: string[];
    affix: string;
}

export function ExtractMerchantCategory(merchantMcc: string): string {
    const merchantCategoriesMcc: { [key: string]: string[] } = {};

    for (const [category, mccGroups] of Object.entries(MerchantCategoryMap)) {
        const mcc = Array.from(new Set(ExtractMccFromMccGroups([mccGroups])));
        merchantCategoriesMcc[category] = mcc;
    }

    const foundCategories: string[] = [];
    for (const [category, mccSlice] of Object.entries(merchantCategoriesMcc)) {
        if (mccSlice.includes(merchantMcc)) {
            foundCategories.push(category);
        }
    }

    //sort found categories by length
    foundCategories.sort((a, b) => merchantCategoriesMcc[a].length - merchantCategoriesMcc[b].length);

    if (foundCategories.length > 0) {
        return foundCategories[0];
    }

    return null;
}

function ExtractMccFromMccGroups(mccArr: string[]): string[] {
    const mccSlice: string[] = [];
    mccArr.forEach((mccStr) => {
        const commaSplit = mccStr.split(',');
        commaSplit.forEach((c) => {
            const dashSplit = c.split('-');
            if (dashSplit.length == 1) {
                if (c.length == 4) {
                    mccSlice.push(c);
                }
                return;
            }

            const ints = parseArrOfInt(...dashSplit);
            if (!ints) {
                return;
            }

            for (let i = ints[0]; i <= ints[1]; i++) {
                let mcc = i.toString();
                if (mcc.length < 4) {
                    mcc = '0' + mcc;
                }
                if (mcc.length == 4) {
                    mccSlice.push(mcc);
                }
            }
        });
    });

    return mccSlice;
}

function parseArrOfInt(...arr: string[]): number[] {
    const result: number[] = [];
    for (const s of arr) {
        const i = parseInt(s);
        if (isNaN(i)) {
            return null;
        }
        result.push(i);
    }

    return result;
}

// Utility functions
export function extractMerchantAffix(str: string): string[] {
    const words = str.split(' ');
    const prefix = sanitizeAffix(words[0]);
    if (words.length == 1) {
        return [prefix];
    }
    const suffix = sanitizeAffix(words[words.length - 1]);
    return [prefix, suffix];
}

function sanitizeAffix(str: string): string {
    const nonAlphanumericRegex = /[^a-zA-Z0-9 ]+/g;
    const sanitized = str.replace(nonAlphanumericRegex, ' ');
    return sanitized.split(' ')[0];
}

function sanitizePhrase(str: string): string {
    const sanitized = str.replace(/\s+/g, ' ').trim();
    return sanitized.toLowerCase();
}

export function findMatchingMerchant(
    merchants: HydratedDocument<Merchant>[],
    description: string,
    affix: string,
): HydratedDocument<Merchant> | null {
    const phrase = sanitizePhrase(description);
    let filteredMerchant: HydratedDocument<Merchant> | null = null;
    let curPattern = '';

    for (const merchant of merchants) {
        const pattern = merchant.patterns.find((p: MerchantPattern) => p.affix.toLowerCase() === affix.toLowerCase());

        for (const keyword of pattern?.keywords || []) {
            if (keyword && phrase.includes(keyword.toLowerCase())) {
                if (keyword.length > curPattern.length) {
                    filteredMerchant = merchant;
                    curPattern = keyword;
                }
                break;
            }
        }
    }

    return filteredMerchant;
}
