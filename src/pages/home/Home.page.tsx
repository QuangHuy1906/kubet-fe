"use client";

import React, { useState, useEffect } from "react";
import WebRTCClient from "@/utils/WebRTCClient";

const HomePage = () => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Khởi tạo WebRTC client
    const client = new WebRTCClient("http://localhost:3000");

    // Thiết lập callback khi nhận track từ peer
    client.onTrack((stream) => {
      console.log("Remote stream received:", stream);
      setRemoteStream(stream); // Lưu stream vào state
    });

    return () => {
      client.closeConnection(); // Dọn dẹp kết nối khi component bị unmount
    };
  }, []);

  return (
    <div>
      <h1>Home Page</h1>
      {remoteStream ? (
        <video
          autoPlay
          muted
          ref={(ref) => {
            if (ref) {
              ref.srcObject = remoteStream; // Gán stream vào video element
            }
          }}
        ></video>
      ) : (
        <p>Đang chờ kết nối...</p>
      )}
    </div>
  );
};

export default HomePage;
