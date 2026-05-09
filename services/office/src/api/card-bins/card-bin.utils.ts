import { HttpStatus } from '@nestjs/common';
import { CardBinErrors, CardBinLength } from './card-bin.enums';
import { CardBinException } from './card-bin.exception';

/**
 * Maps each CardBinLength enum value to its exact range size as a BigInt.
 * BigInt is required because 19-digit PAN ranges exceed Number.MAX_SAFE_INTEGER.
 */
const BIN_LENGTH_SIZE_MAP: Record<CardBinLength, bigint> = {
    [CardBinLength.HundredThousands]: BigInt(100_000),
    [CardBinLength.OneMillion]: BigInt(1_000_000),
    [CardBinLength.TenMillion]: BigInt(10_000_000),
    [CardBinLength.HundredMillion]: BigInt(100_000_000),
    [CardBinLength.OneBillion]: BigInt(1_000_000_000),
};

/**
 * Derives the CardBinLength from a [start, end] bin range pair.
 * Uses BigInt arithmetic to safely handle 19-digit PAN strings.
 *
 * Example:
 *   calculateBinLength(['5249103030000000', '5249103039999999'])
 *   // → CardBinLength.TenMillion  (10,000,000 cards)
 *
 *   calculateBinLength(['5061465010000000000', '5061465010999999999'])
 *   // → CardBinLength.OneBillion  (1,000,000,000 cards)
 *
 * @throws CardBinException if the range size does not match any known CardBinLength
 */
export function calculateBinLength(binRange: [string, string]): CardBinLength {
    const [start, end] = binRange;
    const size = BigInt(end) - BigInt(start) + BigInt(1);

    for (const [length, value] of Object.entries(BIN_LENGTH_SIZE_MAP) as [CardBinLength, bigint][]) {
        if (size === value) return length;
    }

    const known = Object.values(CardBinLength).join(', ');
    throw new CardBinException(
        `BIN range size ${size.toString()} does not map to any known BIN length. Known sizes: ${known}`,
        CardBinErrors.InvalidBinRange,
        HttpStatus.UNPROCESSABLE_ENTITY,
    );
}

/**
 * Derives the BIN (PAN prefix) from a [start, end] bin range pair by
 * finding the longest common character prefix of the two strings.
 *
 * Example:
 *   calculateBin(['5249103030000000', '5249103039999999'])
 *   // → '524910303'
 *
 *   calculateBin(['5061465010000000000', '5061465010999999999'])
 *   // → '5061465010'
 */
export function calculateBin(binRange: [string, string]): string {
    const [start, end] = binRange;
    let i = 0;
    while (i < start.length && i < end.length && start[i] === end[i]) {
        i++;
    }
    return start.slice(0, i);
}
