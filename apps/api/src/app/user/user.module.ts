import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Role } from '../role/entities';
import { RoleModule } from '../role/role.module';
import { UserHasRefreshToken } from './entities/user-has-refresh-token.entity';

@Module({
	imports: [TypeOrmModule.forFeature([User, Role, UserHasRefreshToken]), RoleModule],
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
