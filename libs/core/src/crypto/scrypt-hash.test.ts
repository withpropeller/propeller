import { describe, expect, it } from 'vitest';
import { DefaultOptions as HashDefaultOptions, type HashOptions, SCryptHash } from './scrypt-hash.js';

describe('SCryptHash', () => {
  const testPasswordCorrect = 'PaS$w0rD';
  const testPasswordIncorrect = 'PaS$w0rD_';

  const expectLength = (saltLen: number, hashLen: number): number =>
    1 + // gluing dot
    Buffer.from(' '.repeat(saltLen)).toString('base64').length +
    Buffer.from(' '.repeat(hashLen)).toString('base64').length;

  it('hash should be generated from password with correct length', async () => {
    const hash = await SCryptHash.hash(testPasswordCorrect);
    const expected = expectLength(HashDefaultOptions.saltLen, HashDefaultOptions.hashLen);
    expect(hash).toContain('.');
    expect(hash.length).toEqual(expected);
  });

  it('hash should be verifiable', async () => {
    const hash = await SCryptHash.hash(testPasswordCorrect);
    expect(await SCryptHash.verify(testPasswordCorrect, hash)).toBe(true);
    expect(await SCryptHash.verify(testPasswordIncorrect, hash)).toBe(false);
  });

  it('should accept custom options', async () => {
    const saltLen = 32;
    const hashLen = 48;
    const cost = 2 ** 16;
    const blockSize = 16;
    const parallelize = 2;
    const maxmem = 256 * cost * blockSize;

    const customOptions: HashOptions = { N: cost, r: blockSize, p: parallelize, maxmem, saltLen, hashLen };

    const hash = await SCryptHash.hash(testPasswordCorrect, customOptions);
    const expected = expectLength(saltLen, hashLen);

    expect(hash.length).toEqual(expected);
    expect(await SCryptHash.verify(testPasswordCorrect, hash)).toBe(false);
    expect(await SCryptHash.verify(testPasswordCorrect, hash, customOptions)).toBe(true);
    expect(await SCryptHash.verify(testPasswordIncorrect, hash, customOptions)).toBe(false);
  }, 10000);

  it('should ignore unknown options', async () => {
    const saltLen = 32;
    const hashLen = 48;
    const wrongOptions = {
      blockSize: 0,
      parallelization: -1,
      something: 'WRONG',
      saltLen,
      hashLen,
    } as HashOptions;

    const hash = await SCryptHash.hash(testPasswordCorrect, wrongOptions);
    const expected = expectLength(saltLen, hashLen);

    expect(hash.length).toEqual(expected);
    expect(await SCryptHash.verify(testPasswordCorrect, hash)).toBe(false);
    expect(await SCryptHash.verify(testPasswordCorrect, hash, { saltLen, hashLen })).toBe(true);
  });
});
