export type UserType =
	| 'WORKER'
	| 'SUPERVISOR';

export interface UserDto {
	id: string;
	user_id: string;
	name: string;
	supervisor: UserType;
}

export type UserDtoInput = Omit<UserDto, 'id'>;
