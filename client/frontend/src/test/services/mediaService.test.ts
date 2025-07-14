import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  createMedia,
  triggerAutoTicketGeneration,
  getMediaById,
  getMedia,
} from '../../api/mediaService';
import type { MediaDto } from '../../types/MediaDto';

describe('MediaService Tests', () => {
  let mockAxios: MockAdapter;

  // Common URLs used by the service
  const BASE_MEDIA_URL = 'http://localhost:8083/api/v1/media';
  const AUTOMATION_URL = 'http://localhost:8000/automation/webhook/media-uploaded';

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    jest.clearAllMocks();

    // Provide JWT + userId for auth headers / automation payload
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue('mock.jwt.token');
    (window.localStorage.getItem as jest.Mock).mockReturnValue('1');
  });

  afterEach(() => {
    mockAxios.restore();
  });

  /* ------------------------------------------------------------------ *
   * createMedia
   * ------------------------------------------------------------------ */
  describe('createMedia', () => {
    const dummyFormData = new FormData();
    dummyFormData.append('file', new Blob(['dummy'], { type: 'image/png' }), 'photo.png');
    dummyFormData.append('mediaType', 'PHOTO');
    dummyFormData.append('blobType', 'image/png');

    const mockMediaResponse: MediaDto = {
      mediaId: 10,
      mediaType: 'PHOTO',
      content: 'https://cdn.example.com/photo.png',
      blobType: 'image/png',
    };

    it('uploads media and triggers automation on success', async () => {
      mockAxios
        .onPost(BASE_MEDIA_URL)
        .reply(201, mockMediaResponse);
      mockAxios
        .onPost(AUTOMATION_URL)
        .reply(200, { status: 'ok' });

      const result = await createMedia(dummyFormData);

      expect(result).toEqual(mockMediaResponse);
      expect(mockAxios.history.post).toHaveLength(2);
      expect(mockAxios.history.post[0].url).toBe(BASE_MEDIA_URL);
      expect(mockAxios.history.post[1].url).toBe(AUTOMATION_URL);
    });

    it('still resolves when automation call fails', async () => {
      mockAxios
        .onPost(BASE_MEDIA_URL)
        .reply(201, mockMediaResponse);
      mockAxios
        .onPost(AUTOMATION_URL)
        .reply(500);

      const result = await createMedia(dummyFormData);

      expect(result).toEqual(mockMediaResponse);
      expect(mockAxios.history.post).toHaveLength(2);
    });
  });

  /* ------------------------------------------------------------------ *
   * triggerAutoTicketGeneration
   * ------------------------------------------------------------------ */
  describe('triggerAutoTicketGeneration', () => {
    it('sends automation payload successfully', async () => {
      mockAxios
        .onPost(AUTOMATION_URL)
        .reply(200, { status: 'ok' });

      const result = await triggerAutoTicketGeneration(1, 'PHOTO', 1);

      expect(result).toEqual({ status: 'ok' });
      expect(mockAxios.history.post).toHaveLength(1);
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({
        media_id: 1,
        media_type: 'PHOTO',
        uploaded_by: 1,
      });
    });

    it('throws on network error', async () => {
      mockAxios.onPost(AUTOMATION_URL).networkError();

      await expect(
        triggerAutoTicketGeneration(1, 'PHOTO', 1)
      ).rejects.toThrow();
    });
  });

  /* ------------------------------------------------------------------ *
   * getMediaById / getMedia
   * ------------------------------------------------------------------ */
  describe('Retrieval functions', () => {
    it('gets media by id', async () => {
      const media: MediaDto = {
        mediaId: 5,
        mediaType: 'PHOTO',
        content: 'https://cdn.example.com/pic.png',
        blobType: 'image/png',
      };
      mockAxios.onGet(`${BASE_MEDIA_URL}/5`).reply(200, media);

      const result = await getMediaById(5);

      expect(result).toEqual(media);
    });

    it('throws when service down for getMediaById', async () => {
      mockAxios.onGet(`${BASE_MEDIA_URL}/5`).networkError();

      await expect(getMediaById(5)).rejects.toThrow();
    });

    it('gets the complete media list', async () => {
      const list: MediaDto[] = [
        { mediaId: 1, mediaType: 'PHOTO', content: 'a', blobType: 'image/png' },
        { mediaId: 2, mediaType: 'VIDEO', content: 'b', blobType: 'video/mp4' },
      ];
      mockAxios.onGet(BASE_MEDIA_URL).reply(200, list);

      const result = await getMedia();

      expect(result).toEqual(list);
      expect(result).toHaveLength(2);
    });

    it('throws when service down for getMedia', async () => {
      mockAxios.onGet(BASE_MEDIA_URL).networkError();

      await expect(getMedia()).rejects.toThrow();
    });
  });


  describe('Video Upload via MediaService', () => {
    it('uploads a video and triggers automation', async () => {
      /* ---------- Arrange ---------- */

      (window.localStorage.getItem as jest.Mock).mockReturnValue('42');
      const videoForm = new FormData();
      videoForm.append(
        'file',
        new Blob(['dummy video'], { type: 'video/webm' }),
        'video.webm' 
      );
      videoForm.append('mediaType', 'VIDEO');
      videoForm.append('blobType', 'video/webm');

      const mockMediaResponse: MediaDto = {
        mediaId: 99,
        mediaType: 'VIDEO',
        content: 'https://cdn.example.com/video.webm',
        blobType: 'video/webm',
      };

      mockAxios.onPost(BASE_MEDIA_URL).reply(201, mockMediaResponse);
      mockAxios.onPost(AUTOMATION_URL).reply(200, { status: 'ok' });

      /* ---------- Act ---------- */
      const result = await createMedia(videoForm);

      /* ---------- Assert ---------- */
      expect(result).toEqual(mockMediaResponse);

      // Two POSTs: 1) media upload, 2) automation webhook
      expect(mockAxios.history.post).toHaveLength(2);

      // Validate second request payload
      const automationPayload = JSON.parse(mockAxios.history.post[1].data);
      expect(automationPayload).toEqual({
        media_id: 99,
        media_type: 'VIDEO',
        uploaded_by: 42,
      });
    });

    it('still resolves when automation webhook fails', async () => {
      const videoForm = new FormData();
      videoForm.append('file', new Blob(['dummy'], { type: 'video/webm' }), 'video.webm');
      videoForm.append('mediaType', 'VIDEO');
      videoForm.append('blobType', 'video/webm');

      const mockMediaResponse: MediaDto = {
        mediaId: 100,
        mediaType: 'VIDEO',
        content: 'https://cdn.example.com/video.webm',
        blobType: 'video/webm',
      };

      mockAxios.onPost(BASE_MEDIA_URL).reply(201, mockMediaResponse);
      mockAxios.onPost(AUTOMATION_URL).reply(500); // webhook error

      const result = await createMedia(videoForm);

      expect(result).toEqual(mockMediaResponse);
      expect(mockAxios.history.post).toHaveLength(2);
    });

    it('propagates network errors from the media upload itself', async () => {
      const videoForm = new FormData();
      videoForm.append('file', new Blob(['dummy'], { type: 'video/webm' }), 'video.webm');
      videoForm.append('mediaType', 'VIDEO');
      videoForm.append('blobType', 'video/webm');

      mockAxios.onPost(BASE_MEDIA_URL).networkError();

      await expect(createMedia(videoForm)).rejects.toThrow();
    });
  }); 
}); 