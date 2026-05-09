import { SetMetadata } from '@nestjs/common';

export const Secure = () => SetMetadata('isSecure', true);
