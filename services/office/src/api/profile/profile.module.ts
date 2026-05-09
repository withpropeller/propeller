import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { AdminsModule } from '@api/admins/admin.module';

@Module({
    imports: [CommonModule, AdminsModule, AuthModule],
    controllers: [ProfileController],
    providers: [],
})
export class ProfileModule {}
