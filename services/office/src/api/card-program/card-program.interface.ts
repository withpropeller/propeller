import { CardProgramPartner, CardProgramProfileCodes } from './card-program.enums';

export interface CardProgramProfile {
    code: CardProgramProfileCodes;
    partner: CardProgramPartner;
    accountPrefix: string;
    accountLen: number;
    panPrefix: string;
    panLen: number;
}
