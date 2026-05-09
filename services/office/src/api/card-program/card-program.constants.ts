import { CardProgramProfile } from './card-program.interface';
import { CardProgramPartner, CardProgramProfileCodes } from './card-program.enums';

export const SANDBOX_VERVE_CARD_PROFILE: CardProgramProfile = {
    partner: CardProgramPartner.Interswitch,
    code: CardProgramProfileCodes.VerveSandbox,
    panPrefix: '40001233',
    panLen: 19,
    accountPrefix: '001',
    accountLen: 10,
};

export const LIVE_VERVE_CARD_PROFILE: CardProgramProfile = {
    partner: CardProgramPartner.Interswitch,
    code: CardProgramProfileCodes.VerveLive,
    panPrefix: '506146241', // 50614624 from interswitch, 1 for contactless,
    panLen: 19,
    accountPrefix: '01',
    accountLen: 10,
};

export const SANDBOX_PAVILION_MASTERCARD_CARD_PROFILE: CardProgramProfile = {
    partner: CardProgramPartner.Providus,
    code: CardProgramProfileCodes.PavilionMastercardSandbox,
    panPrefix: '524910100',
    panLen: 16,
    accountPrefix: '002',
    accountLen: 10,
};

export const LIVE_PAVILION_MASTERCARD_CARD_PROFILE: CardProgramProfile = {
    partner: CardProgramPartner.Providus,
    code: CardProgramProfileCodes.PavilionMastercardLive,
    panPrefix: '524910301',
    panLen: 16,
    accountPrefix: '02',
    accountLen: 10,
};

export const SANDBOX_PAVILION_VERVE_CARD_PROFILE: CardProgramProfile = {
    partner: CardProgramPartner.Providus,
    code: CardProgramProfileCodes.PavilionVerveSandbox,
    panPrefix: '40001233',
    panLen: 19,
    accountPrefix: '001',
    accountLen: 10,
};

export const LIVE_PAVILION_VERVE_CARD_PROFILE: CardProgramProfile = {
    partner: CardProgramPartner.Providus,
    code: CardProgramProfileCodes.PavilionVerveLive,
    panPrefix: '506146241', // 50614624 from interswitch, 1 for contactless,
    panLen: 19,
    accountPrefix: '01',
    accountLen: 10,
};
