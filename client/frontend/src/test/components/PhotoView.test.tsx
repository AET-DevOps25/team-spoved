import React from 'react';
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PhotoView from '../../views/PhotoView';

// --- helper to mount with router -----------------------------
const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

// --- hook mock ------------------------------------------------
const takePhoto          = vi.fn();
const handleSendPhoto    = vi.fn();
const handleCameraChange = vi.fn();
const removePhoto        = vi.fn();

vi.mock('../../hooks/PhotoHook', () => ({
  usePhotoCapture: () => ({
    videoRef:   { current: null },
    canvasRef:  { current: null },
    photos:     ['dummyPhoto'],
    cameras:    [
      { deviceId: 'cam-1', label: 'Mock Camera', kind: 'videoinput', groupId: '' } as unknown as MediaDeviceInfo,
    ],
    selectedCamera: 'cam-1',
    uploading:      false,
    errorMsg:       '',
    autoTicketStatus: 'idle',
    handleCameraChange,
    takePhoto,
    handleSendPhoto,
    removePhoto,
  }),
}));

// --- tests ----------------------------------------------------
describe('PhotoView – integration', () => {
  const user = userEvent.setup();

  it('renders basic UI and triggers capture / send actions', async () => {
    renderWithRouter(<PhotoView />);

    // camera option present
    expect(screen.getByRole('option', { name: /mock camera/i })).toBeInTheDocument();

    // capture click calls hook
    await user.click(screen.getByRole('button', { name: /capture photo/i }));
    expect(takePhoto).toHaveBeenCalledTimes(1);

    // send click calls hook (photos array mocked with 1 element)
    const sendBtn = screen.getByRole('button', { name: /send photo\(s\)/i });
    expect(sendBtn).toBeEnabled();
    await user.click(sendBtn);
    expect(handleSendPhoto).toHaveBeenCalledTimes(1);
  });
});