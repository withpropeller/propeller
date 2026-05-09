import { TenantDataSource } from '@core/helpers';
import { CardProgramPartner } from './card-program.enums';
import {
    LIVE_PAVILION_MASTERCARD_CARD_PROFILE,
    LIVE_PAVILION_VERVE_CARD_PROFILE,
    LIVE_VERVE_CARD_PROFILE,
    SANDBOX_PAVILION_MASTERCARD_CARD_PROFILE,
    SANDBOX_PAVILION_VERVE_CARD_PROFILE,
    SANDBOX_VERVE_CARD_PROFILE,
} from './card-program.constants';
import { CardProgramProfile } from './card-program.interface';
import { CardNetwork } from '@api/cards/cards.enums';

export function getCardProgramProfile(
    tenant: TenantDataSource,
    partner: CardProgramPartner,
    network: CardNetwork,
): CardProgramProfile {
    if (tenant === TenantDataSource.Sandbox && partner === CardProgramPartner.Interswitch) {
        return SANDBOX_VERVE_CARD_PROFILE;
    }

    if (tenant === TenantDataSource.Live && partner === CardProgramPartner.Interswitch) {
        return LIVE_VERVE_CARD_PROFILE;
    }

    if (
        tenant === TenantDataSource.Sandbox &&
        partner === CardProgramPartner.Providus &&
        network === CardNetwork.MasterCard
    ) {
        return SANDBOX_PAVILION_MASTERCARD_CARD_PROFILE;
    }

    if (
        tenant === TenantDataSource.Live &&
        partner === CardProgramPartner.Providus &&
        network === CardNetwork.MasterCard
    ) {
        return LIVE_PAVILION_MASTERCARD_CARD_PROFILE;
    }

    if (
        tenant === TenantDataSource.Sandbox &&
        partner === CardProgramPartner.Providus &&
        network === CardNetwork.Verve
    ) {
        return SANDBOX_PAVILION_VERVE_CARD_PROFILE;
    }

    if (tenant === TenantDataSource.Live && partner === CardProgramPartner.Providus && network === CardNetwork.Verve) {
        return LIVE_PAVILION_VERVE_CARD_PROFILE;
    }

    throw new TypeError(`Invalid tenant and partner combination: ${tenant} ${partner} ${network}`);
}
