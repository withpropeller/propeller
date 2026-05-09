import { SetMetadata } from '@nestjs/common';

export const DryRunAware = () => SetMetadata('dryRunAware', true);
