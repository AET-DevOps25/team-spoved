export type Role =
	| 'WORKER'
	| 'SUPERVISOR';

export interface UserDto {
	userId: number;
	name: string;
	role: Role;
	password: string;
}

export type LoginUserRequest = Omit<UserDto, 'userId' | 'password' | 'role'>;
export type RegisterUserRequest = Omit<UserDto, 'userId'>;