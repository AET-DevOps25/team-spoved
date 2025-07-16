import React from 'react';
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import MicrophoneView from '../../views/MicrophoneView';

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

// ----------------------------------------------------------------
let mockState: any = {};
vi.mock('../../hooks/MicrophoneHook', () => ({
  useVoiceToVoice: () => mockState,
}));

describe('MicrophoneView – integration', () => {
  const user = userEvent.setup();
  let startVoiceConversation: any, stopRecording: any, clearConversation: any, handleSendMessage: any;

  beforeEach(() => {
    startVoiceConversation = vi.fn();
    stopRecording          = vi.fn();
    clearConversation      = vi.fn();
    handleSendMessage      = vi.fn();

    mockState = {
      messages:             [],
      isRecording:          false,
      isPlaying:            false,
      isProcessing:         false,
      errorMsg:             '',
      conversationHistoric: '',
      completed:            false,
      recordingTimeLeft:    30,
      audioLevel:           0,
      startRecording:       vi.fn(),                  // not used by this view
      stopRecording,
      clearConversation,
      startVoiceConversation,
      handleSendMessage,
    };
  });

  it('starts a voice conversation when mic button clicked', async () => {
    renderWithRouter(<MicrophoneView />);
    await user.click(screen.getByRole('button', { name: /start voice conversation/i }));
    expect(startVoiceConversation).toHaveBeenCalledTimes(1);
  });

  it('stops recording when stop button clicked', async () => {
    mockState.isRecording = true;        // makes Stop button visible
    renderWithRouter(<MicrophoneView />);
    await user.click(screen.getByRole('button', { name: /stop recording/i }));
    expect(stopRecording).toHaveBeenCalledTimes(1);
  });

  it('clears conversation when trash button clicked', async () => {
    mockState.messages = [{ type: 'user', text: 'hi', timestamp: new Date() }];
    renderWithRouter(<MicrophoneView />);
    await user.click(screen.getByRole('button', { name: /clear conversation/i }));
    expect(clearConversation).toHaveBeenCalledTimes(1);
  });

  it('sends conversation when completed', async () => {
    Object.assign(mockState, { completed: true });
    renderWithRouter(<MicrophoneView />);
    await user.click(screen.getByRole('button', { name: /send conversation/i }));
    expect(handleSendMessage).toHaveBeenCalledTimes(1);
  });
});