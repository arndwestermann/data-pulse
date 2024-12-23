import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Action, Resource, Role } from './entities';
import { Permission } from './entities/permission.entity';
import { User } from '../user/entities/user.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Action, Resource, Role, Permission, User])],
	controllers: [RoleController],
	providers: [RoleService],
	exports: [RoleService],
})
export class RoleModule {}
