'use client';

import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, StopCircle, Paperclip, Zap, X, Image, Music, Mic, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { FileAttachment } from '../types/chat';
import { apiClient } from '../utils/api';
import toast from 'react-hot-toast';

interface MessageInputProps {
  onSendMessage: (message: string, files?: FileAttachment[]) => void;
  onStopGeneration?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  enableFunctionCalling?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onStopGeneration,
  disabled = false,
  isLoading = false,
  enableFunctionCalling = false,
}) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], "voice-recording.webm", { type: "audio/webm" });

        // Stop media stream tracks
        stream.getTracks().forEach(track => track.stop());

        setIsTranscribing(true);
        try {
          const { transcription } = await apiClient.transcribeAudio(audioFile);
          setMessage(prev => prev ? `${prev} ${transcription}` : transcription);
        } catch (error) {
            console.error("Error transcribing audio:", error);
            toast.error("Failed to transcribe audio. Please try again.");
        } finally {
            setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please ensure you have given permission.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };


  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSend = () => {
    if ((message.trim() || attachments.length > 0) && !disabled && !isComposing) {
      onSendMessage(message, attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: FileAttachment[] = [];

    Array.from(files).forEach((file) => {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');

      if (!isImage && !isAudio) {
        alert(`Unsupported file type: ${file.type}. Please select image or audio files.`);
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      // Create attachment
      const attachment: FileAttachment = {
        id: `${Date.now()}-${Math.random()}`,
        file: file,
        type: isImage ? 'image' : 'audio',
        name: file.name,
        size: file.size,
        mimeType: file.type,
        url: URL.createObjectURL(file), // For preview
      };

      newAttachments.push(attachment);
    });

    setAttachments((prev) => [...prev, ...newAttachments]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find(a => a.id === id);
      if (attachment?.url) {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const isSendDisabled = (!message.trim() && attachments.length === 0) || disabled || isComposing;

  const getPlaceholderText = () => {
    if (enableFunctionCalling) {
      return "Ask me anything! I can help with weather, math, time, and currency conversion... You can also attach images or audio files. (Press Enter to send, Shift+Enter for new line)";
    }
    return "Type your message or attach files... (Press Enter to send, Shift+Enter for new line)";
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      {/* Function Calling Status */}
      {enableFunctionCalling && (
        <div className="flex items-center gap-2 mb-3 text-sm text-blue-600">
          <Zap className="w-4 h-4" />
          <span>Function calling enabled - I can help with weather, calculations, time, and currency conversion!</span>
        </div>
      )}

      {/* File Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group bg-gray-100 rounded-lg p-2 flex items-center gap-2 max-w-xs"
            >
              {attachment.type === 'image' && attachment.url ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  {attachment.type === 'image' ? (
                    <Image className="w-6 h-6 text-gray-500" />
                  ) : (
                    <Music className="w-6 h-6 text-gray-500" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(attachment.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end space-x-3">
        {/* File upload button */}
        <button
          onClick={openFileDialog}
          disabled={disabled}
          className={cn(
            "p-3 rounded-lg transition-all duration-200 flex-shrink-0",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
            "bg-gray-100 text-gray-600 hover:bg-gray-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Microphone button */}
        <button
          onClick={handleMicClick}
          disabled={disabled || isTranscribing}
          className={cn(
            "p-3 rounded-lg transition-all duration-200 flex-shrink-0",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            isRecording
              ? "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isTranscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={getPlaceholderText()}
            disabled={disabled}
            className={cn(
              "w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "placeholder:text-gray-400",
              "transition-all duration-200",
              enableFunctionCalling && "border-blue-200 bg-blue-50/30"
            )}
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
            aria-label="Message input"
          />

          {/* Character count */}
          {message.length > 0 && (
            <div className="absolute bottom-1 right-2 text-xs text-gray-400">
              {message.length}/5000
            </div>
          )}
        </div>

        {/* Send/Stop button */}
        <button
          onClick={isLoading ? onStopGeneration : handleSend}
          disabled={isLoading ? false : isSendDisabled}
          className={cn(
            "p-3 rounded-lg transition-all duration-200 flex-shrink-0",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            isLoading
              ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label={isLoading ? "Stop generation" : "Send message"}
        >
          {isLoading ? (
            <StopCircle className="w-5 h-5" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;