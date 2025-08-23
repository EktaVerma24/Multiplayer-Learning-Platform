import { Phone } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { FaPhone, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaDesktop, FaShareSquare, FaPhoneSlash, FaSun, FaMoon } from 'react-icons/fa';

const socket = io("http://localhost:5000");

export default function VideoCall() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const pendingCandidates = useRef([]);

  // State variables for call management and UI
  const [isCaller, setIsCaller] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [showIncomingNotification, setShowIncomingNotification] = useState(false);
  const [callerId, setCallerId] = useState(null);
  const [classroomId] = useState("room-123");
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [stream, setStream] = useState(null);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isLight, setIsLight] = useState(true); // New state for light theme

  useEffect(() => {
    socket.emit("joinClassroom", { classroomId });

    socket.on("webrtc:incoming-call", ({ from, offer }) => {
      console.log("📞 Incoming call from:", from);
      setIncomingCall(true);
      setCallerId(from);
      setShowIncomingNotification(true);

      if (!pcRef.current) createPeerConnection();
      pcRef.current.remoteOffer = offer;
    });

    socket.on("webrtc:answer", async ({ from, answer }) => {
      console.log("✅ Answer received from:", from);
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        pendingCandidates.current.forEach(async (c) => {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
        });
        pendingCandidates.current = [];
      }
    });

    socket.on("webrtc:ice-candidate", async ({ candidate }) => {
      if (!candidate) return;
      if (pcRef.current?.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      } else {
        pendingCandidates.current.push(candidate);
      }
    });

    socket.on("webrtc:hangup", () => {
      console.log("Peer has hung up.");
      hangUpCall(false);
    });

    return () => {
      socket.off("webrtc:incoming-call");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice-candidate");
      socket.off("webrtc:hangup");
      hangUpCall(true);
    };
  }, [classroomId]);

  const createPeerConnection = () => {
    pcRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pcRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc:ice-candidate", { classroomId, candidate: event.candidate });
      }
    };

    pcRef.current.ontrack = (event) => {
      console.log("🎥 Remote stream added");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pcRef.current.onconnectionstatechange = () => {
      console.log("PC state:", pcRef.current.connectionState);
      if (pcRef.current.connectionState === 'disconnected' || pcRef.current.connectionState === 'failed' || pcRef.current.connectionState === 'closed') {
        hangUpCall(false);
      }
    };
  };

  const startCall = async () => {
    setIsCaller(true);
    setIsInCall(true);
    createPeerConnection();
    await enableCameraAndMic();
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    socket.emit("webrtc:offer", { classroomId, offer, to: null });
  };

  const answerCall = async () => {
    setIncomingCall(false);
    setShowIncomingNotification(false);
    setIsInCall(true);
    if (!pcRef.current) createPeerConnection();
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(pcRef.current.remoteOffer));
    pendingCandidates.current.forEach(async (c) => {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
    });
    pendingCandidates.current = [];

    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);
    socket.emit("webrtc:answer", { classroomId, answer, to: callerId });
    await enableCameraAndMic();
  };

  const enableCameraAndMic = async () => {
    if (!stream) {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(localStream);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
        localStream.getTracks().forEach((track) => pcRef.current.addTrack(track, localStream));
        setCameraOn(true);
        setMicOn(true);
      } catch (error) {
        console.error("Error accessing camera and mic:", error);
      }
    } else {
      stream.getVideoTracks().forEach((track) => (track.enabled = true));
      stream.getAudioTracks().forEach((track) => (track.enabled = true));
      setCameraOn(true);
      setMicOn(true);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
      setCameraOn((prev) => !prev);
    }
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
      setMicOn((prev) => !prev);
    }
  };

  const shareScreen = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");

        if (sender) {
          await sender.replaceTrack(screenTrack);
          setScreenSharing(true);
          
          screenTrack.onended = () => {
            const currentSender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
            if (currentSender && stream) {
              currentSender.replaceTrack(stream.getVideoTracks()[0]);
            }
            setScreenSharing(false);
          };
        } else {
          console.warn("No video sender found to replace track.");
        }
      } catch (err) {
        console.error("Screen share failed:", err);
      }
    } else {
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
      if (sender && stream) {
        await sender.replaceTrack(stream.getVideoTracks()[0]);
      }
      setScreenSharing(false);
    }
  };

  const hangUpCall = (isLocalInitiated = true) => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setIsCaller(false);
    setIncomingCall(false);
    setShowIncomingNotification(false);
    setCallerId(null);
    setCameraOn(false);
    setMicOn(false);
    setScreenSharing(false);
    setIsInCall(false);

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (isLocalInitiated) {
      socket.emit("webrtc:hangup", { classroomId });
    }
  };

  const toggleTheme = () => {
    setIsLight(!isLight);
  };

  const containerBg = isLight ? "bg-gray-100" : "bg-gray-900";
  const textColor = isLight ? "text-gray-900" : "text-white";
  const headerBg = isLight ? "bg-white" : "bg-gray-800";
  const videoBg = isLight ? "bg-gray-200" : "bg-gray-800";
  const videoBorder = isLight ? "border-gray-400" : "border-gray-600";
  const controlBg = isLight ? "bg-white" : "bg-gray-800";

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden ${containerBg} ${textColor}`}>
      {/* Header with Title, Room ID, and Theme Toggle */}
      <div className={`flex justify-between items-center p-4 shadow-lg ${headerBg}`}>
        <h1 className="text-xl font-bold text-teal-400">WebRTC Video Call</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">Room: {classroomId}</div>
          <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:text-teal-400 transition-colors">
            {isLight ? <FaMoon size={20} /> : <FaSun size={20} />}
          </button>
        </div>
      </div>

      {/* Main Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Remote Stream Container */}
        <div className={`relative w-full h-full rounded-lg overflow-hidden border-2 shadow-xl ${videoBg} ${videoBorder}`}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-xs px-2 py-1 rounded-md text-white">
            Remote Stream
          </div>
        </div>

        {/* Local Stream Container */}
        <div className={`relative w-full h-full rounded-lg overflow-hidden border-2 shadow-xl ${videoBg} ${videoBorder}`}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-xs px-2 py-1 rounded-md text-white">
            Your Stream
          </div>
        </div>
      </div>

      {/* Floating Control Bar */}
      <div className={`p-4 shadow-lg flex justify-center items-center gap-6 ${controlBg}`}>
        {/* Start Call Button */}
        {!isInCall && !incomingCall && (
          <button
            onClick={startCall}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-full shadow-lg hover:from-blue-600 hover:to-indigo-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 1.48a1 1 0 01-.542 1.31L5.812 7.749A15.048 15.048 0 0012.251 14.188l1.379-.691a1 1 0 011.31.542l1.48.74A1 1 0 0118 16.847V17a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" />
            </svg>
            Start Call
          </button>
        )}

        {/* Answer/Decline Buttons for Incoming Call */}
        {incomingCall && (
          <>
            <button onClick={answerCall} className="p-4 bg-green-500 rounded-full text-white shadow-lg hover:bg-green-600 transition-colors">
              <FaPhone size={20} />
            </button>
            <button onClick={() => hangUpCall(true)} className="p-4 bg-red-600 rounded-full text-white shadow-lg hover:bg-red-700 transition-colors">
              <FaPhoneSlash size={20} />
            </button>
          </>
        )}

        {/* In-Call Controls */}
        {isInCall && (
          <>
            {/* Toggle Mic */}
            <button onClick={toggleMic} className={`p-4 rounded-full shadow-lg transition-colors ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}>
              {micOn ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
            </button>

            {/* Toggle Camera */}
            <button onClick={toggleCamera} className={`p-4 rounded-full shadow-lg transition-colors ${cameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}>
              {cameraOn ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
            </button>

            {/* Share Screen */}
            <button onClick={shareScreen} className={`p-4 rounded-full shadow-lg transition-colors ${screenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}>
              {screenSharing ? <FaShareSquare size={20} /> : <FaDesktop size={20} />}
            </button>

            {/* Hang Up */}
            <button onClick={() => hangUpCall(true)} className="p-4 bg-red-600 rounded-full text-white shadow-lg hover:bg-red-700 transition-colors">
              <FaPhoneSlash size={20} />
            </button>
          </>
        )}
      </div>

      {/* Incoming Call Notification */}
      {showIncomingNotification && !isInCall && (
        <div className={`fixed top-4 right-4 bg-yellow-400 text-gray-900 p-4 rounded-lg shadow-xl animate-pulse`}>
          <p className="font-bold text-lg flex items-center">
            🔔 Incoming Call from {callerId}!
          </p>
          <div className="mt-2 text-sm">
            Click the green phone icon to answer.
          </div>
        </div>
      )}
    </div>
  );
}