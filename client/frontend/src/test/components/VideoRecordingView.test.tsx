import React from 'react';
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import VideoRecordingView from '../../views/VideoRecordingView';

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

// ----------------------------------------------------------------
// dynamic mock – we mutate `mockState` inside individual tests
let mockState: any = {};
vi.mock('../../hooks/VideoHook', () => ({
  useVideoRecorder: () => mockState,
}));

describe('VideoRecordingView – integration', () => {
  const user = userEvent.setup();
  let startRecording: any, stopRecording: any, handleSendVideo: any, handleReRecord: any;

  beforeEach(() => {
    // fresh spies for every test
    startRecording   = vi.fn();
    stopRecording    = vi.fn();
    handleSendVideo  = vi.fn();
    handleReRecord   = vi.fn();

    // base shape shared by all variants
    mockState = {
      videoRef: { current: null },
      cameras: [
        { deviceId: 'cam-1', label: 'Mock Cam', kind: 'videoinput', groupId: '' } as unknown as MediaDeviceInfo,
      ],
      selectedCamera:  'cam-1',
      isRecording:     false,
      isPreviewMode:   false,
      previewUrl:      null,
      uploading:       false,
      errorMsg:        '',
      startRecording,
      stopRecording,
      handleCameraChange: vi.fn(),
      handleSendVideo,
      handleReRecord,
    };
  });

  it('starts recording when button clicked', async () => {
    mockState.isRecording = false;
    renderWithRouter(<VideoRecordingView />);

    await user.click(screen.getByRole('button', { name: /start recording/i }));
    expect(startRecording).toHaveBeenCalledTimes(1);
  });

  it('stops recording when already recording', async () => {
    mockState.isRecording = true;
    renderWithRouter(<VideoRecordingView />);

    await user.click(screen.getByRole('button', { name: /stop recording/i }));
    expect(stopRecording).toHaveBeenCalledTimes(1);
  });

  it('sends video in preview mode', async () => {
    Object.assign(mockState, { isPreviewMode: true, previewUrl: 'blob:dummy' });
    renderWithRouter(<VideoRecordingView />);

    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(handleSendVideo).toHaveBeenCalledTimes(1);
  });
});