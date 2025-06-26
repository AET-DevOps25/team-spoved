import axios from 'axios';
import type { MediaDto } from '../types/MediaDto';
import { getAuthHeaders } from './utils';

const BASE_URL = import.meta.env.VITE_SERVER_API_URL + '/media';
const GENAI_URL = import.meta.env.VITE_GENAI_API_URL;

export const createMedia = async (formData: FormData) => {
  const response = await axios.post(BASE_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...getAuthHeaders()
    },
  });
    
    // After successful media upload, trigger automation
    const mediaData = response.data;
    const userId = localStorage.getItem('userId');
    
    if (mediaData.mediaId && userId) {
        try {
            await triggerAutoTicketGeneration(
                mediaData.mediaId, 
                mediaData.mediaType, 
                parseInt(userId)
            );
        } catch (error) {
            console.warn('Auto ticket generation failed:', error);
            // Don't throw error here - media upload was successful
        }
    }
    
    return response.data;
};

// New function to trigger automation
export const triggerAutoTicketGeneration = async (
    mediaId: number, 
    mediaType: string, 
    uploadedBy: number
) => {
    const response = await axios.post(`${GENAI_URL}/automation/webhook/media-uploaded`, {
        media_id: mediaId,
        media_type: mediaType,
        uploaded_by: uploadedBy
    }, { headers : getAuthHeaders() });
  return response.data;
};


export const getMediaById = async (id: number): Promise<MediaDto> => {
  const response = await axios.get(`${BASE_URL}/${id}`, {headers : getAuthHeaders()});
  return response.data;
};

export const getMedia = async (): Promise<MediaDto[]> => {
  const response = await axios.get(BASE_URL, {headers : getAuthHeaders()});
  return response.data;
};
