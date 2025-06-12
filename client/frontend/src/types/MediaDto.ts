export type MediaType =
    | 'photo'
    | 'video'
    | 'audio';

export interface MediaDto {
    mediaId: number;
    mediaType: MediaType;
    content: Blob;
    blobType: string;
}

export type CreateMediaRequest = Omit<MediaDto, 'mediaId'>;