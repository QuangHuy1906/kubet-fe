"use client";

import React, { useState, useEffect } from "react";
import WebRTCClient from "@/utils/WebRTCClient";

type RemoteStream = {
  id: string; // ID của peer gửi stream
  stream: MediaStream; // Luồng video từ peer
};

const HomePage = () => {
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]); // Danh sách các stream từ peer

  useEffect(() => {
    // Khởi tạo WebRTC client
    const client = new WebRTCClient("http://localhost:3000");

    // Thiết lập callback khi nhận track từ peer
    // client.onTrack((stream, from) => {
    //   console.log(`Remote stream received from peer ${from}:`, stream);

    //   // Thêm stream mới vào danh sách nếu chưa tồn tại
    //   setRemoteStreams((prevStreams) => {
    //     const exists = prevStreams.some((s) => s.id === from);
    //     if (exists) return prevStreams; // Nếu đã tồn tại, không thêm nữa
    //     return [...prevStreams, { id: from, stream }];
    //   });
    // });

    client.onTrack((stream, from) => {
      console.log(`Received stream from peer: ${from}`);

      setRemoteStreams((prev) => {
        // Kiểm tra xem ID đã tồn tại trong danh sách hay chưa
        const exists = prev.some((s) => s.id === from);
        if (exists) {
          console.warn(`Stream from peer ${from} already exists. Skipping.`);
          return prev; // Không thêm nếu đã tồn tại
        }

        // Thêm stream mới
        return [...prev, { id: from, stream }];
      });
    });

    return () => {
      client.closeConnection(); // Dọn dẹp kết nối khi component bị unmount
    };
  }, []);

  console.log("remoteStreams", remoteStreams);

  return (
    <div>
      <h1>Home Page</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {remoteStreams.map((remote) => (
          <div key={remote.id}>
            <h3>Màn hình từ peer: {remote.id}</h3>
            <video
              autoPlay
              muted
              ref={(ref) => {
                if (ref) {
                  ref.srcObject = remote.stream; // Gán stream vào video element
                }
              }}
              style={{ width: "400px", border: "1px solid black" }}
            ></video>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
