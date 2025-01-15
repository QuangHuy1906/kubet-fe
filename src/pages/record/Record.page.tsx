"use client";

import React, { useState, useEffect } from "react";
import WebRTCClient from "@/utils/WebRTCClient";

type SharedScreen = {
  id: number; // ID duy nhất cho mỗi màn hình
  stream: MediaStream; // Luồng video của màn hình
};

const RecordPage = () => {
  const [sharedScreens, setSharedScreens] = useState<SharedScreen[]>([]); // Danh sách các màn hình được chia sẻ
  const [webrtcClient, setWebrtcClient] = useState<WebRTCClient | null>(null); // Kết nối WebRTC
  const [screenId, setScreenId] = useState<number>(0); // Tạo ID duy nhất cho từng màn hình

  useEffect(() => {
    // Khởi tạo WebRTC client
    const client = new WebRTCClient("http://localhost:3000");
    setWebrtcClient(client);

    return () => {
      // Dọn dẹp tất cả kết nối khi component bị hủy
      client.closeConnection();
      sharedScreens.forEach((screen) => {
        screen.stream.getTracks().forEach((track) => track.stop());
      });
      setSharedScreens([]); // Dọn dẹp sharedScreens chỉ khi component bị hủy
    };
  }, []); // Loại bỏ sharedScreens khỏi dependency array

  const startSharing = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      setScreenId(screenId + 1);

      // Thêm màn hình mới vào danh sách
      setSharedScreens((prev) => [
        ...prev,
        { id: screenId + 1, stream: mediaStream },
      ]);

      // Gửi offer qua WebRTC
      if (webrtcClient) {
        console.log("Sending offer...");
        const targetId = `receiver-id-${screenId + 1}`; // Thay bằng ID thực tế của client mục tiêu
        await webrtcClient.sendOffer(mediaStream, targetId);
      }
    } catch (err) {
      console.error("Lỗi khi chia sẻ màn hình:", err);
    }
  };

  const stopSharing = (id: number) => {
    // Dừng stream của màn hình có ID tương ứng
    const screen = sharedScreens.find((s) => s.id === id);
    if (screen) {
      screen.stream.getTracks().forEach((track) => track.stop());
    }

    // Cập nhật danh sách màn hình
    setSharedScreens((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div>
      <h1>Record Page</h1>
      <button onClick={startSharing}>Thêm màn hình chia sẻ</button>
      <div>
        {sharedScreens.map((screen) => (
          <div key={screen.id}>
            <h3>Màn hình {screen.id}</h3>
            <video
              autoPlay
              muted
              ref={(ref) => {
                if (ref) {
                  ref.srcObject = screen.stream;
                }
              }}
              style={{ width: "400px", margin: "10px" }}
            ></video>
            <button onClick={() => stopSharing(screen.id)}>
              Dừng chia sẻ màn hình này
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecordPage;
