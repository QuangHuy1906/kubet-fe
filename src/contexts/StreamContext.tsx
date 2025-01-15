"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

type StreamContextType = {
  streams: MediaStream[];
  addStream: (stream: MediaStream) => void;
  removeStream: (stream: MediaStream) => void;
};

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export const StreamProvider = ({ children }: { children: ReactNode }) => {
  const [streams, setStreams] = useState<MediaStream[]>([]);

  const addStream = (stream: MediaStream) => {
    setStreams((prevStreams) => [...prevStreams, stream]);
  };

  const removeStream = (stream: MediaStream) => {
    setStreams((prevStreams) => prevStreams.filter((s) => s.id !== stream.id));
  };

  return (
    <StreamContext.Provider value={{ streams, addStream, removeStream }}>
      {children}
    </StreamContext.Provider>
  );
};

export const useStreamContext = () => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};
