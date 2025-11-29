import React, { useEffect, useRef, useState } from "react";
import { FaPhone, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaDesktop, FaShareSquare, FaPhoneSlash, FaClosedCaptioning } from 'react-icons/fa';
import { motion } from "framer-motion";
import { useSocket } from '../context/SocketContext';

export default function VideoCall({classroomId, user}) {
  const { socket } = useSocket();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const pendingCandidates = useRef([]);

  const [isCaller, setIsCaller] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [showIncomingNotification, setShowIncomingNotification] = useState(false);
  const [callerId, setCallerId] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [stream, setStream] = useState(null);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const [isCaptioning, setIsCaptioning] = useState(false);
  const speechRecognitionRef = useRef(null);

  useEffect(() => {
    if (!socket) {
      console.error("❌ Socket not available in VideoCall");
      return;
    }

    console.log("✅ VideoCall: Socket connected, joining classroom:", classroomId);
    socket.emit("joinClassroom", { classroomId, user });

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

    socket.on("webrtc:caption", ({ text }) => {
      setCaptionText(text);
    });

    return () => {
      socket.off("webrtc:incoming-call");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice-candidate");
      socket.off("webrtc:hangup");
      socket.off("webrtc:caption");
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
    console.log("📞 Starting call in room:", classroomId);
    
    if (!socket) {
      alert("Socket not connected. Please refresh the page.");
      return;
    }
    
    try {
      setIsCaller(true);
      setIsInCall(true);
      
      console.log("🔗 Creating peer connection...");
      createPeerConnection();
      
      if (!pcRef.current) {
        throw new Error("Failed to create peer connection");
      }
      
      console.log("🎥 Enabling camera and mic...");
      await enableCameraAndMic();
      
      console.log("📝 Creating offer...");
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      
      console.log("📤 Sending offer to room:", classroomId);
      socket.emit("webrtc:offer", { classroomId, offer, to: null });
      console.log("✅ Call started successfully");
    } catch (error) {
      console.error("❌ Error starting call:", error);
      setIsInCall(false);
      setIsCaller(false);
      alert("Failed to start call: " + error.message);
    }
  };

  const answerCall = async () => {
    console.log("📞 Answering call from:", callerId);
    try {
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
      console.log("📤 Sending answer:", answer);
      socket.emit("webrtc:answer", { classroomId, answer, to: callerId });
      await enableCameraAndMic();
    } catch (error) {
      console.error("❌ Error answering call:", error);
      alert("Failed to answer call: " + error.message);
    }
  };

  const enableCameraAndMic = async () => {
    if (!stream) {
      try {
        console.log("🎥 Requesting camera and mic access...");
        
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("getUserMedia is not supported in this browser. Use HTTPS or localhost.");
        }
        
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log("✅ Camera and mic access granted");
        console.log("📹 Stream tracks:", localStream.getTracks().map(t => `${t.kind}: ${t.label}`));
        
        setStream(localStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          console.log("✅ Local video element updated");
        }
        
        localStream.getTracks().forEach((track) => {
          console.log("➕ Adding track:", track.kind, track.label);
          if (pcRef.current) {
            pcRef.current.addTrack(track, localStream);
          }
        });
        setCameraOn(true);
        setMicOn(true);
      } catch (error) {
        console.error("❌ Error accessing camera and mic:", error);
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        
        let errorMsg = "Cannot access camera/microphone. ";
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          errorMsg += "Please allow camera and microphone permissions in your browser settings.";
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          errorMsg += "No camera or microphone found on your device.";
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          errorMsg += "Camera/microphone is already in use by another application.";
        } else if (error.name === "OverconstrainedError") {
          errorMsg += "Camera/microphone constraints cannot be satisfied.";
        } else {
          errorMsg += error.message;
        }
        
        alert(errorMsg);
        throw error;
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
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
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
    setCaptionText("");
    setIsCaptioning(false);

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (isLocalInitiated) {
      socket.emit("webrtc:hangup", { classroomId });
    }
  };

  const toggleCaptioning = () => {
    if (!isCaptioning) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          console.error("Speech Recognition is not supported by this browser.");
          return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        speechRecognitionRef.current = recognition;

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          socket.emit("webrtc:caption", { classroomId, text: transcript });
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
        };

        recognition.onend = () => {
          if (isCaptioning) {
            recognition.start();
          }
        };

        recognition.start();
        setIsCaptioning(true);
      } catch (error) {
        console.error("Speech recognition failed to start:", error);
      }
    } else {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
      setIsCaptioning(false);
      setCaptionText("");
    }
  };

  // Common motion button properties for consistency
  const motionButtonProps = {
    whileHover: { scale: 1.1, boxShadow: "0px 0px 12px rgba(139, 92, 246, 0.4)" }, // Violet shadow on hover
    whileTap: { scale: 0.9 },
    transition: { type: "spring", stiffness: 400, damping: 17 }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans overflow-hidden bg-white text-slate-800">
      {/* Header with Title and Room ID */}
      <div className="flex justify-between items-center p-4 shadow-lg bg-white">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-violet-500">WebRTC Video Call</h1>
        <div className="flex items-center gap-4">
          <div className="text-lg text-slate-500">RoomId: {classroomId}</div>
        </div>
      </div>

      {/* Main Video Grid */}
      <div className="flex-1 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Remote Stream Container */}
        <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-slate-200 shadow-xl bg-slate-100">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-xs px-2 py-1 rounded-md text-white">
            Remote Stream
          </div>
          {captionText && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white text-lg p-2 rounded-lg max-w-xl text-center">
              {captionText}
            </div>
          )}
        </div>

        {/* Local Stream Container */}
        <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-slate-200 shadow-xl bg-slate-100">
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
      <div className="p-4 shadow-lg flex justify-center items-center gap-6 bg-white">
        {/* Start Call Button */}
        {!isInCall && !incomingCall && (
          <motion.button 
            onClick={startCall} 
            className="p-4 bg-violet-600 rounded-full text-white shadow-lg"
            {...motionButtonProps}
          >
            <FaPhone size={20} />
          </motion.button>
        )}

        {/* Answer/Decline Buttons for Incoming Call */}
        {incomingCall && (
          <>
            <motion.button 
              onClick={answerCall} 
              className="p-4 bg-violet-600 rounded-full text-white shadow-lg"
              {...motionButtonProps}
            >
              <FaPhone size={20} />
            </motion.button>
            <motion.button 
              onClick={() => hangUpCall(true)} 
              className="p-4 bg-red-600 rounded-full text-white shadow-lg"
              {...motionButtonProps}
            >
              <FaPhoneSlash size={20} />
            </motion.button>
          </>
        )}

        {/* In-Call Controls */}
        {isInCall && (
          <>
            {/* Toggle Mic */}
            <motion.button 
              onClick={toggleMic} 
              className={`p-4 rounded-full shadow-lg ${micOn ? 'bg-violet-500' : 'bg-slate-700'} text-white`}
              {...motionButtonProps}
            >
              {micOn ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
            </motion.button>

            {/* Toggle Camera */}
            <motion.button 
              onClick={toggleCamera} 
              className={`p-4 rounded-full shadow-lg ${cameraOn ? 'bg-violet-500' : 'bg-slate-700'} text-white`}
              {...motionButtonProps}
            >
              {cameraOn ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
            </motion.button>

            {/* Share Screen */}
            <motion.button 
              onClick={shareScreen} 
              className={`p-4 rounded-full shadow-lg ${screenSharing ? 'bg-violet-500' : 'bg-slate-700'} text-white`}
              {...motionButtonProps}
            >
              {screenSharing ? <FaShareSquare size={20} /> : <FaDesktop size={20} />}
            </motion.button>
            
            {/* Toggle Captioning */}
            <motion.button 
              onClick={toggleCaptioning} 
              className={`p-4 rounded-full shadow-lg ${isCaptioning ? 'bg-violet-500' : 'bg-slate-700'} text-white`}
              {...motionButtonProps}
            >
              <FaClosedCaptioning size={20} />
            </motion.button>

            {/* Hang Up */}
            <motion.button 
              onClick={() => hangUpCall(true)} 
              className="p-4 bg-red-600 rounded-full text-white shadow-lg"
              {...motionButtonProps}
            >
              <FaPhoneSlash size={20} />
            </motion.button>
          </>
        )}
      </div>

      {/* Incoming Call Notification */}
      {showIncomingNotification && !isInCall && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="fixed top-4 right-4 bg-yellow-400 text-gray-900 p-4 rounded-lg shadow-xl"
        >
          <p className="font-bold text-lg flex items-center">
            🔔 Incoming Call from {callerId}!
          </p>
          <div className="mt-2 text-sm">
            Click the violet phone icon to answer.
          </div>
        </motion.div>
      )}
    </div>
  );
}