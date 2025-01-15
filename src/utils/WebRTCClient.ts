import { io, Socket } from "socket.io-client";

class WebRTCClient {
  private socket: Socket;
  private peerConnections: Map<string, RTCPeerConnection>; // Lưu trữ nhiều RTCPeerConnection
  private onTrackCallback?: (stream: MediaStream, from: string) => void; // Callback xử lý track, thêm 'from'

  constructor(signalingServerUrl: string) {
    this.socket = io(signalingServerUrl);
    this.peerConnections = new Map();

    // Lắng nghe các sự kiện từ signaling server
    this.socket.on("offer", this.handleOffer.bind(this));
    this.socket.on("answer", this.handleAnswer.bind(this));
    this.socket.on("ice-candidate", this.handleIceCandidate.bind(this));
  }

  private createPeerConnection(peerId: string) {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Khi có ICE candidate, gửi đến server kèm theo ID mục tiêu
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", {
          candidate: event.candidate,
          to: peerId,
        });

        this.socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: peerId, // Gửi đến client mục tiêu
        });
      }
    };

    // Khi nhận được track từ peer, truyền cả stream và ID của peer
    peerConnection.ontrack = (event) => {
      console.log("Track received from peer:", peerId, event.streams[0]);
      if (this.onTrackCallback) {
        this.onTrackCallback(event.streams[0], peerId); // Truyền stream và ID của peer
      }
    };

    return peerConnection;
  }

  onTrack(callback: (stream: MediaStream, from: string) => void) {
    this.onTrackCallback = callback;
  }

  async sendOffer(stream: MediaStream, targetId: string) {
    const peerConnection = this.createPeerConnection(targetId);
    this.peerConnections.set(targetId, peerConnection);

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    console.log("Sending offer to:", targetId);
    this.socket.emit("offer", { sdp: offer.sdp, to: targetId });
  }

  async handleOffer({ sdp, from }: { sdp: string; from: string }) {
    console.log("Received offer from:", from);

    const peerConnection = this.createPeerConnection(from);
    this.peerConnections.set(from, peerConnection);

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: "offer", sdp })
    );

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    console.log("Sending answer to:", from);
    this.socket.emit("answer", { sdp: answer.sdp, to: from });
  }

  async handleAnswer({ sdp, from }: { sdp: string; from: string }) {
    console.log("Received answer from:", from);

    const peerConnection = this.peerConnections.get(from);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp })
      );
    }
  }

  async handleIceCandidate({
    candidate,
    from,
  }: {
    candidate: RTCIceCandidateInit;
    from: string;
  }) {
    console.log("Received ICE candidate from:", from);

    const peerConnection = this.peerConnections.get(from);
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  closeConnection() {
    this.peerConnections.forEach((peerConnection) => {
      peerConnection.close();
    });
    this.peerConnections.clear();
    this.socket.disconnect();
  }
}

export default WebRTCClient;
