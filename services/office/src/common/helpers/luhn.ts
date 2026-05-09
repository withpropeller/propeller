// Information about the algorithm is available on Wikipedia
//
// https://en.wikipedia.org/wiki/Luhn_algorithm
//
export class Luhn {
    static asciiZero = 48;
    static asciiTen = 57;

    static validateLuhn(number: string): boolean {
        const p = number.length % 2;
        const sum = this.calculateLuhnSum(number, p);
        if (sum === null) {
            return false;
        }
        return sum % 10 === 0;
    }

    static calculateLuhn(number: string): [string, string] | null {
        const p = (number.length + 1) % 2;
        const sum = this.calculateLuhnSum(number, p);
        if (sum === null) {
            return null;
        }
        let luhn = sum % 10;
        if (luhn !== 0) {
            luhn = 10 - luhn;
        }
        return [luhn.toString(), `${number}${luhn}`];
    }

    static generateLuhn(length: number): string {
        let s = '';
        for (let i = 0; i < length - 1; i++) {
            s += Math.floor(Math.random() * 9).toString();
        }
        const res = this.calculateLuhn(s);
        return res ? res[1] : '';
    }

    static calculateLuhnSum(number: string, parity: number): number | null {
        let sum = 0;
        for (let i = 0; i < number.length; i++) {
            let d = number.charCodeAt(i);
            if (d < this.asciiZero || d > this.asciiTen) {
                return null;
            }
            d -= this.asciiZero;
            if (i % 2 === parity) {
                d *= 2;
                if (d > 9) {
                    d -= 9;
                }
            }
            sum += d;
        }
        return sum;
    }

    static generateWithPrefix(prefix: string, length: number): string {
        let s = prefix;
        length -= prefix.length;
        for (let i = 0; i < length - 1; i++) {
            s += Math.floor(Math.random() * 9).toString();
        }
        const res = this.calculateLuhn(s);
        return res ? res[1] : '';
    }
}
