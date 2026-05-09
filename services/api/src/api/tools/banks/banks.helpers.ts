import { CommercialBank } from './banks.interface';

export class BankAccountChecksum {
    static resolveShortList(accountNumber: string, banks: CommercialBank[]): CommercialBank[] {
        const banksList = [];

        for (let i = 0; i < banks.length; i++) {
            if (!banks[i].processorCode) {
                continue;
            }
            const digitValid = BankAccountChecksum.checkDigits(accountNumber, banks[i].processorCode);
            if (digitValid) {
                banksList.push({
                    name: banks[i].name,
                    code: banks[i].code,
                    abbr: banks[i].abbr,
                    rank: banks[i].rank,
                    imageUrl: banks[i].imageUrl,
                });
            }
        }

        banksList.sort(function (a, b) {
            if (a.rank > b.rank) return -1;
            if (a.rank < b.rank) return 1;
            return 0;
        });

        if (banksList.length > 5) {
            banksList.splice(5);
        }

        return banksList;
    }

    /**
     * TODO: Fix bank code with 6 digits
     *
     * @param accountNumber
     * @param bankCode
     * @returns
     */
    static checkDigits(accountNumber: string, bankCode: string) {
        let checkBankCode = 0;
        if (bankCode.length === 6) {
            checkBankCode =
                3 * Number(bankCode[0]) +
                7 * Number(bankCode[1]) +
                3 * Number(bankCode[2]) +
                3 * Number(bankCode[3]) +
                7 * Number(bankCode[4]) +
                3 * Number(bankCode[5]);
        } else if (bankCode.length === 5) {
            checkBankCode =
                3 * 9 +
                7 * Number(bankCode[0]) +
                3 * Number(bankCode[1]) +
                3 * Number(bankCode[2]) +
                7 * Number(bankCode[3]) +
                3 * Number(bankCode[4]);
        } else if (bankCode.length === 3) {
            checkBankCode =
                3 * 0 + 7 * 0 + 3 * 0 + 3 * Number(bankCode[0]) + 7 * Number(bankCode[1]) + 3 * Number(bankCode[2]);
        }
        const multiplication =
            checkBankCode +
            3 * Number(accountNumber[0]) +
            7 * Number(accountNumber[1]) +
            3 * Number(accountNumber[2]) +
            3 * Number(accountNumber[3]) +
            7 * Number(accountNumber[4]) +
            3 * Number(accountNumber[5]) +
            3 * Number(accountNumber[6]) +
            7 * Number(accountNumber[7]) +
            3 * Number(accountNumber[8]);
        const modulus = 10 - (multiplication % 10);

        if (modulus == Number(accountNumber[9])) {
            return true;
        }
        return false;
    }
}
