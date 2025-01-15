import { io, Socket } from "socket.io-client";

class WebRTCClient {
  private socket: Socket;
  private peerConnection: RTCPeerConnection | null = null;
  private peerId: string | null = null; // ID của client mục tiêu
  private onTrackCallback?: (stream: MediaStream) => void; // Thuộc tính callback để xử lý track

  constructor(signalingServerUrl: string) {
    this.socket = io(signalingServerUrl);

    // Lắng nghe các sự kiện từ signaling server
    this.socket.on("offer", this.handleOffer.bind(this));
    this.socket.on("answer", this.handleAnswer.bind(this));
    this.socket.on("ice-candidate", this.handleIceCandidate.bind(this));
  }

  private createPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Khi có ICE candidate, gửi đến server kèm theo ID mục tiêu (peerId)
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.peerId) {
        console.log("Sending ICE candidate:", {
          candidate: event.candidate,
          to: this.peerId,
        });

        this.socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: this.peerId, // Gửi đến ID của client mục tiêu
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log("Track received:", event.streams[0]);
      if (this.onTrackCallback) {
        this.onTrackCallback(event.streams[0]);
      }
    };

    return this.peerConnection;
  }

  onTrack(callback: (stream: MediaStream) => void) {
    this.onTrackCallback = callback;
  }

  async sendOffer(stream: MediaStream, targetId: string) {
    this.peerId = targetId; // Lưu ID của client mục tiêu

    if (!this.peerConnection) {
      this.peerConnection = this.createPeerConnection();
    }

    stream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, stream);
    });

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.socket.emit("offer", { sdp: offer.sdp });
  }

  async handleOffer({ sdp, from }: { sdp: string; from: string }) {
    console.log("Received offer:", sdp, "from:", from);

    if (!this.peerConnection) {
      this.peerConnection = this.createPeerConnection();
      this.peerId = from; // Lưu ID của peer đã gửi offer
    }

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: "offer", sdp })
    );

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    console.log("Sending answer...");
    this.socket.emit("answer", { sdp: answer.sdp, to: from });
  }

  async handleAnswer({ sdp }: { sdp: string }) {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp })
      );
    }
  }

  async handleIceCandidate({ candidate }: { candidate: RTCIceCandidateInit }) {
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  closeConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.socket.disconnect();
  }
}

export default WebRTCClient;
