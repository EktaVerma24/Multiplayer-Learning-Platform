import React, { useEffect, useRef, useState } from "react";
import { FaPhone, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaDesktop, FaShareSquare, FaPhoneSlash, FaClosedCaptioning } from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";
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
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const [isCaptioning, setIsCaptioning] = useState(false);
  const speechRecognitionRef = useRef(null);

  // Check if current user is teacher
  const isTeacher = user?.role === 'teacher';

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

    // Listen for screen sharing status from remote peer
    socket.on("webrtc:screen-share-status", ({ isSharing }) => {
      console.log("📺 Remote peer screen sharing status:", isSharing);
      setRemoteScreenSharing(isSharing);
    });

    return () => {
      socket.off("webrtc:incoming-call");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice-candidate");
      socket.off("webrtc:hangup");
      socket.off("webrtc:caption");
      socket.off("webrtc:screen-share-status");
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
      console.log("🎥 Remote stream added - Track kind:", event.track.kind);
      console.log("📺 Remote streams:", event.streams.length);
      if (event.streams && event.streams[0]) {
        console.log("✅ Setting remote video srcObject");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          console.log("✅ Remote video element updated");
        } else {
          console.error("❌ remoteVideoRef.current is null");
        }
      } else {
        console.error("❌ No streams in ontrack event");
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
    // Only allow teachers to start calls
    if (!isTeacher) {
      alert("Only teachers can start video calls");
      return;
    }

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
      
      // Create peer connection if not exists
      if (!pcRef.current) createPeerConnection();
      
      // Enable camera/mic FIRST so tracks are added to peer connection
      console.log("🎥 Enabling camera and mic BEFORE setting remote description");
      await enableCameraAndMic();
      
      // Set remote description from the offer
      console.log("📥 Setting remote description from offer");
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(pcRef.current.remoteOffer));
      
      // Add any pending ICE candidates
      console.log("🧊 Adding pending ICE candidates:", pendingCandidates.current.length);
      for (const c of pendingCandidates.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidates.current = [];

      // Now create and send the answer with tracks included
      console.log("📝 Creating answer with tracks");
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      console.log("📤 Sending answer with", pcRef.current.getSenders().length, "senders");
      socket.emit("webrtc:answer", { classroomId, answer, to: callerId });
    } catch (error) {
      console.error("❌ Error answering call:", error);
      setIsInCall(false);
      setIncomingCall(true);
      setShowIncomingNotification(true);
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
        
        // Try with both video and audio first
        let localStream;
        try {
          localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          console.log("✅ Got both camera and microphone");
        } catch (error) {
          console.warn("⚠️ Could not get both video and audio, trying video only:", error.message);
          // Fallback: try video only if audio fails
          try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            console.log("✅ Got camera only (no microphone available)");
            alert("Note: Microphone not available. Video call will work but without audio from your side.");
          } catch (videoError) {
            console.error("❌ Could not get video either:", videoError);
            throw videoError;
          }
        }
        console.log("✅ Camera and mic access granted");
        console.log("📹 Stream tracks:", localStream.getTracks().map(t => `${t.kind}: ${t.label}`));
        
        setStream(localStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          console.log("✅ Local video element updated");
        }
        
        // Add tracks to peer connection if it exists
        if (pcRef.current) {
          localStream.getTracks().forEach((track) => {
            console.log("➕ Adding track to peer connection:", track.kind, track.label);
            pcRef.current.addTrack(track, localStream);
          });
        }
        
        // Set camera/mic state based on available tracks
        const hasVideo = localStream.getVideoTracks().length > 0;
        const hasAudio = localStream.getAudioTracks().length > 0;
        setCameraOn(hasVideo);
        setMicOn(hasAudio);
        
        if (!hasAudio) {
          console.warn("⚠️ No audio track available - microphone will be disabled");
        }
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
      // Stream already exists, just enable tracks
      stream.getVideoTracks().forEach((track) => (track.enabled = true));
      stream.getAudioTracks().forEach((track) => (track.enabled = true));
      setCameraOn(true);
      setMicOn(true);
      
      // Ensure tracks are added to peer connection if not already
      if (pcRef.current && pcRef.current.getSenders().length === 0) {
        console.log("➕ Adding existing stream tracks to peer connection");
        stream.getTracks().forEach((track) => {
          pcRef.current.addTrack(track, stream);
        });
      }
    }
  };

  const toggleCamera = () => {
    if (stream && stream.getVideoTracks().length > 0) {
      stream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
      setCameraOn((prev) => !prev);
    } else {
      console.warn("⚠️ No video track available");
    }
  };

  const toggleMic = () => {
    if (stream && stream.getAudioTracks().length > 0) {
      stream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
      setMicOn((prev) => !prev);
    } else {
      console.warn("⚠️ No audio track available");
      alert("Microphone not available on this device");
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
          
          // Notify remote peer about screen sharing
          socket.emit("webrtc:screen-share-status", { classroomId, isSharing: true });
          
          screenTrack.onended = () => {
            const currentSender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
            if (currentSender && stream) {
              currentSender.replaceTrack(stream.getVideoTracks()[0]);
            }
            setScreenSharing(false);
            socket.emit("webrtc:screen-share-status", { classroomId, isSharing: false });
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
      socket.emit("webrtc:screen-share-status", { classroomId, isSharing: false });
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
    setRemoteScreenSharing(false);
    setIsInCall(false);
    setCaptionText("");
    setIsCaptioning(false);

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (isLocalInitiated) {
      socket.emit("webrtc:hangup", { classroomId });
      socket.emit("webrtc:screen-share-status", { classroomId, isSharing: false });
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
    <div className="flex flex-col min-h-screen font-sans overflow-hidden bg-gradient-to-br from-slate-50 to-violet-50 text-slate-800">
      {/* Header with Title and Room ID */}
      <div className="flex justify-between items-center p-4 shadow-lg bg-white/90 backdrop-blur-sm">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          Video Call
        </h1>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-violet-100 rounded-full text-violet-700 font-semibold">
            {isTeacher ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
          </div>
          <div className="text-lg text-slate-600 bg-slate-100 px-4 py-2 rounded-full font-mono">
            Room: {classroomId}
          </div>
        </div>
      </div>

      {/* Main Video Grid - Dynamic Layout based on screen sharing */}
      <div className="flex-1 p-6 sm:p-8">
        {remoteScreenSharing ? (
          // Screen sharing layout: Large remote screen + small local video
          <div className="h-full flex flex-col gap-4">
            {/* Large Remote Screen */}
            <div className="flex-1 relative rounded-xl overflow-hidden border-4 border-violet-300 shadow-2xl bg-slate-900">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-4 left-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2 rounded-full font-semibold shadow-lg flex items-center gap-2">
                <FaDesktop className="animate-pulse" />
                Teacher's Screen
              </div>
              {captionText && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-lg px-6 py-3 rounded-2xl max-w-3xl text-center backdrop-blur-sm border border-white/20"
                >
                  {captionText}
                </motion.div>
              )}
            </div>
            
            {/* Small Local Video */}
            <div className="h-48 relative rounded-xl overflow-hidden border-2 border-slate-300 shadow-xl bg-slate-900">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                You
              </div>
            </div>
          </div>
        ) : (
          // Normal layout: Equal sized videos
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Remote Stream */}
            <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-violet-200 shadow-xl bg-slate-900">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                {isTeacher ? '👨‍🎓 Student' : '👨‍🏫 Teacher'}
              </div>
              {captionText && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/80 text-white text-lg px-6 py-3 rounded-2xl max-w-xl text-center backdrop-blur-sm border border-white/20"
                >
                  {captionText}
                </motion.div>
              )}
            </div>

            {/* Local Stream */}
            <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-slate-200 shadow-xl bg-slate-900">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/60 text-white px-4 py-2 rounded-full font-semibold backdrop-blur-sm">
                You
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Control Bar */}
      <div className="p-6 shadow-2xl flex justify-center items-center gap-6 bg-white/95 backdrop-blur-md border-t border-violet-100">
        {/* Start Call Button - Only for Teachers */}
        {!isInCall && !incomingCall && isTeacher && (
          <motion.button 
            onClick={startCall} 
            className="p-5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full text-white shadow-2xl hover:shadow-violet-400/50"
            {...motionButtonProps}
          >
            <FaPhone size={24} />
          </motion.button>
        )}

        {/* Message for students when no call */}
        {!isInCall && !incomingCall && !isTeacher && (
          <div className="text-slate-500 text-lg font-medium">
            Waiting for teacher to start the call...
          </div>
        )}

        {/* Answer/Decline Buttons for Incoming Call */}
        {incomingCall && (
          <>
            <motion.button 
              onClick={answerCall} 
              className="p-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-white shadow-2xl hover:shadow-green-400/50"
              {...motionButtonProps}
            >
              <FaPhone size={24} />
            </motion.button>
            <motion.button 
              onClick={() => hangUpCall(true)} 
              className="p-5 bg-gradient-to-r from-red-500 to-rose-600 rounded-full text-white shadow-2xl hover:shadow-red-400/50"
              {...motionButtonProps}
            >
              <FaPhoneSlash size={24} />
            </motion.button>
          </>
        )}

        {/* In-Call Controls */}
        {isInCall && (
          <>
            <motion.button 
              onClick={toggleMic} 
              className={`p-5 rounded-full shadow-2xl ${micOn ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-violet-400/50' : 'bg-slate-700 hover:shadow-slate-500/50'} text-white`}
              {...motionButtonProps}
            >
              {micOn ? <FaMicrophone size={24} /> : <FaMicrophoneSlash size={24} />}
            </motion.button>

            <motion.button 
              onClick={toggleCamera} 
              className={`p-5 rounded-full shadow-2xl ${cameraOn ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-violet-400/50' : 'bg-slate-700 hover:shadow-slate-500/50'} text-white`}
              {...motionButtonProps}
            >
              {cameraOn ? <FaVideo size={24} /> : <FaVideoSlash size={24} />}
            </motion.button>

            {isTeacher && (
              <motion.button 
                onClick={shareScreen} 
                className={`p-5 rounded-full shadow-2xl ${screenSharing ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-violet-400/50' : 'bg-slate-700 hover:shadow-slate-500/50'} text-white`}
                {...motionButtonProps}
              >
                {screenSharing ? <FaShareSquare size={24} /> : <FaDesktop size={24} />}
              </motion.button>
            )}
            
            <motion.button 
              onClick={toggleCaptioning} 
              className={`p-5 rounded-full shadow-2xl ${isCaptioning ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-violet-400/50' : 'bg-slate-700 hover:shadow-slate-500/50'} text-white`}
              {...motionButtonProps}
            >
              <FaClosedCaptioning size={24} />
            </motion.button>

            <motion.button 
              onClick={() => hangUpCall(true)} 
              className="p-5 bg-gradient-to-r from-red-500 to-rose-600 rounded-full text-white shadow-2xl hover:shadow-red-400/50"
              {...motionButtonProps}
            >
              <FaPhoneSlash size={24} />
            </motion.button>
          </>
        )}
      </div>

      {/* Enhanced Incoming Call Notification */}
      <AnimatePresence>
        {showIncomingNotification && !isInCall && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -100 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20 
            }}
            className="fixed top-8 right-8 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 text-white p-6 rounded-2xl shadow-2xl border-2 border-white/30 backdrop-blur-md max-w-sm z-50"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center"
              >
                <FaPhone size={28} className="text-white" />
              </motion.div>
              <div>
                <p className="font-bold text-2xl">Incoming Call</p>
                <p className="text-white/90 text-sm">from Teacher</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <motion.button
                onClick={answerCall}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <FaPhone size={18} />
                Answer
              </motion.button>
              <motion.button
                onClick={() => hangUpCall(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <FaPhoneSlash size={18} />
                Decline
              </motion.button>
            </div>
            
            <motion.div 
              className="mt-3 text-center text-xs text-white/80"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              🔔 Ringing...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}