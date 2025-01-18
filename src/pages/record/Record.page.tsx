/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import WebRTCClient from "@/utils/WebRTCClient";

const RecordPage = () => {
  const [stream, setStream] = useState<MediaStream | null>(null); // Luồng video chia sẻ
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]); // Các phần video đã ghi
  const [webrtcClient, setWebrtcClient] = useState<WebRTCClient | null>(null); // Kết nối WebRTC
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  ); // Trình ghi video

  useEffect(() => {
    // Khởi tạo WebRTC client
    const client = new WebRTCClient("https://record-be-lnz8.onrender.com");
    setWebrtcClient(client);

    return () => {
      // Dọn dẹp kết nối khi component bị hủy
      client.closeConnection();
    };
  }, []);

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      setStream(mediaStream);

      // Gửi offer qua WebRTC
      if (webrtcClient) {
        console.log("Sending offer...");
        const targetId = "receiver-id"; // Thay 'receiver-id' bằng ID client mục tiêu
        await webrtcClient.sendOffer(mediaStream, targetId);
      }
    } catch (err) {
      console.error("Lỗi khi chia sẻ màn hình:", err);
    }
  };

  const stopRecording = () => {
    // Dừng ghi
    if (mediaRecorder) {
      mediaRecorder.stop();
    }

    // Dừng các track của stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    setStream(null);
  };

  const downloadRecording = () => {
    // Tạo Blob từ các đoạn video đã ghi
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    // Tạo link để tải về
    const a = document.createElement("a");
    a.href = url;
    a.download = "recording.webm";
    a.click();

    // Dọn dẹp URL
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 style={{ textAlign: "center", fontWeight: "bold", fontSize: "50px" }}>
        Record Page
      </h1>
      <button
        onClick={startRecording}
        style={{
          background: "Green",
          padding: "10px 5px",
          color: "white",
          margin: "20px",
          borderRadius: "10px",
        }}
      >
        Bắt đầu chia sẻ màn hình
      </button>
      {stream && (
        <div>
          <video
            autoPlay
            muted
            ref={(ref) => {
              if (ref) {
                ref.srcObject = stream;
              }
            }}
          ></video>
          <button
            onClick={stopRecording}
            style={{
              background: "#EB5A3E",
              padding: "10px 5px",
              color: "white",
              margin: "20px",
              borderRadius: "10px",
            }}
          >
            Dừng chia sẻ màn hình
          </button>
          {/* <button onClick={downloadRecording}>Tải xuống video</button> */}
        </div>
      )}
    </div>
  );
};

export default RecordPage;
