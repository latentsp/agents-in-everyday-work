'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '../types/chat';
import { User, Bot, Loader2, RefreshCw, AlertCircle, Image, Music, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onRetry?: () => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onRetry }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2">Welcome to LLM Chat Demo!</h3>
          <p className="text-gray-400 mb-4">Start a conversation with the AI assistant.</p>
          <div className="flex flex-col space-y-2 text-sm text-gray-400">
            <p>💡 Try asking questions, requesting explanations, or having a casual chat.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message.message_id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className={`max-w-[80%] p-4 rounded-lg shadow-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              }`}
            >
              {/* File attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {message.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className={`border rounded-lg p-2 ${
                        message.role === 'user'
                          ? 'border-blue-300 bg-blue-500/20'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {attachment.type === 'image' && attachment.url ? (
                        <div className="space-y-2">
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="max-w-full h-auto rounded max-h-64 object-contain"
                          />
                          <div className="flex items-center justify-between text-xs">
                            <span className={message.role === 'user' ? 'text-blue-100' : 'text-gray-600'}>
                              {attachment.name}
                            </span>
                            <span className={message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}>
                              {(attachment.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                          </div>
                        </div>
                      ) : attachment.type === 'audio' && attachment.url ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Music className={`w-4 h-4 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`} />
                            <span className={`text-sm ${message.role === 'user' ? 'text-blue-100' : 'text-gray-700'}`}>
                              {attachment.name}
                            </span>
                          </div>
                          <audio
                            controls
                            className="w-full max-w-sm"
                            preload="metadata"
                          >
                            <source src={attachment.url} type={attachment.mimeType} />
                            Your browser does not support the audio element.
                          </audio>
                          <div className="text-xs">
                            <span className={message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}>
                              {(attachment.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <div className={`w-8 h-8 rounded flex items-center justify-center ${
                            message.role === 'user' ? 'bg-blue-500/30' : 'bg-gray-200'
                          }`}>
                            {attachment.type === 'image' ? (
                              <Image className={`w-4 h-4 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`} />
                            ) : (
                              <Music className={`w-4 h-4 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className={message.role === 'user' ? 'text-blue-100' : 'text-gray-700'}>
                              {attachment.name}
                            </div>
                            <div className={`text-xs ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                              {(attachment.size / 1024 / 1024).toFixed(1)} MB
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="prose prose-sm max-w-none">
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                    components={{
                      code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <SyntaxHighlighter
                            style={tomorrow as any}
                            language={match[1]}
                            PreTag="div"
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                )}
              </div>

              {message.timestamp && (
                <div
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              )}

              {/* Error indicator for assistant messages */}
              {message.role === 'assistant' && message.content.includes('Sorry, I encountered an error') && (
                <div className="flex items-center space-x-2 mt-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <button
                    onClick={onRetry}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                </div>
              )}
            </motion.div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start space-x-3"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div className="bg-gray-100 p-4 rounded-lg rounded-bl-sm">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              <span className="text-sm text-gray-600">AI is typing...</span>
            </div>
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;