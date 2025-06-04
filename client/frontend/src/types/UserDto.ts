export type Role =
	| 'WORKER'
	| 'SUPERVISOR';

export interface UserDto {
	userId: number;
	name: string;
	role: Role;
}

export type UserDtoInput = Omit<UserDto, 'userId'>;