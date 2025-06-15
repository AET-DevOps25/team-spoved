import axios from 'axios';
import type { MediaDto } from '../types/MediaDto';

const BASE_URL = import.meta.env.VITE_SERVER_API_URL + '/media';

export const createMedia = async (formData: FormData) => {
    const response = await axios.post(BASE_URL, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getMediaById = async (id: number): Promise<MediaDto> => {
  const response = await axios.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const getMedia = async (): Promise<MediaDto[]> => {
  const response = await axios.get(BASE_URL);
  return response.data;
};
