export type MediaType =
    | 'PHOTO'
    | 'VIDEO'
    | 'AUDIO';

export interface MediaDto {
    mediaId: number;
    mediaType: MediaType;
    content: string;
    blobType: string;
}

export type CreateMediaRequest = Omit<MediaDto, 'mediaId'>;