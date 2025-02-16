"use client"
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React, { useRef, FormEvent, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Upload } from 'lucide-react';
import ReactMarkdown from "react-markdown"

interface Message {
  role: string;
  content: string;
  timestamp?: Date;
}

const ChatMessage: React.FC<Message> = ({ role, content, timestamp }) => (
  <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`
      flex items-start gap-2.5 max-w-[80%]
      ${role === 'user' ? 'flex-row-reverse' : 'flex-row'}
    `}>
      <div className={`
          w-10 h-10 rounded-full flex items-center justify-center shadow-lg
          border-2 ${role === 'user' ? 'bg-gray-800 border-white' : 'bg-gray-100 border-gray-300'}
          shrink-0`}>
        {role === 'user' ? '🤵' : '🤖'}
      </div>
      <div className={`
        flex flex-col gap-1 
        ${role === 'user' ? 'items-end' : 'items-start'}
      `}>
        <div className={`
          rounded-lg p-4 break-words
          ${role === 'user'
            ? 'bg-gray-800 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-800 rounded-bl-none'}
        `}>
          {role === 'assistant' ? (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
              <ReactMarkdown
                components={{
                  h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2 break-words">{children}</h3>,
                  ul: ({ children }) => <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="break-words">{children}</li>,
                  p: ({ children }) => <p className="mb-2 break-words whitespace-pre-wrap">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => (
                    <code className="bg-gray-200 px-1 rounded break-words whitespace-pre-wrap inline-block max-w-full">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-200 p-2 rounded my-2 overflow-x-auto max-w-full whitespace-pre-wrap">
                      {children}
                    </pre>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          )}
        </div>
        {timestamp && (
          <span className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  </div>
);

const InputField: React.FC = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      toast.success("Resume uploaded successfully!", {
        position: "top-right", // Adjust position as needed
        autoClose: 5000, // 5 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark", // Or "dark"
      });
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!textareaRef.current?.value.trim()) return;

    const jobDescription = textareaRef.current.value;
    setIsLoading(true);

    const newUserMessage: Message = {
      role: "user",
      content: jobDescription,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);

    if (fileInputRef.current?.files?.length) {
      const file = fileInputRef.current.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('job_description', jobDescription);

      try {
        const response = await fetch('http://localhost:5000/upload-resume/', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();

        const aiMessage: Message = {
          role: "assistant",
          content: data.analysis.analysis,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);



      } catch (error) {
        const errorMessage: Message = {
          role: "assistant",
          content: error instanceof Error ? error.message : "An error occurred",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }

    setIsLoading(false);
    textareaRef.current.value = "";
    scrollToBottom();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gray-900 text-white py-4 px-6 shadow-md">
        <div className="max-w-full mx-auto flex items-start justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            <h1 className="text-xl font-semibold">Resume AI Analysis</h1>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 px-4 pb-4" ref={chatContainerRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <ChatMessage key={index} {...message} />
          ))}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-pulse text-gray-500">Analyzing...</div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 backdrop-blur-lg backdrop-filter">
          <div className="flex items-end gap-2">
            <Label
              htmlFor="fileInput"
              className="cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <input
                type="file"
                id="fileInput"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
              />
              <Upload className="w-6 h-6 text-gray-500" />
            </Label>
            <div className="flex-1">
              <Input
                ref={textareaRef}
                placeholder="Enter the job description..."
                className="min-h-[44px] px-4 py-3 rounded-lg border-gray-200 focus:border-black focus:ring-black"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-black hover:scale-105 text-white px-6 py-2 rounded-lg transition duration-300"
            >
              {isLoading ? 'Analyzing...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
      <div className="h-32" />
      <ToastContainer />
    </div>
  );
};

export default InputField;
