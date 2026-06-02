import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { UsersModule } from '@api/users';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';

@Module({
    imports: [CommonModule, UsersModule, AuthModule],
    controllers: [ProfileController],
    providers: [],
})
export class ProfileModule {}
