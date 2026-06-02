import { Module } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { BusinessModule } from '@api/business/business.module';
import { UsersModule } from '@api/users';
import { CommonModule } from '@common/common.module';

@Module({
    imports: [CommonModule, BusinessModule, UsersModule],
    providers: [TeamService],
    controllers: [TeamController],
    exports: [TeamService],
})
export class TeamModule {}
