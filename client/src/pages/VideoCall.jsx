import React, { useEffect, useRef, useState } from "react";
import { FaPhone, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaDesktop, FaShareSquare, FaPhoneSlash, FaClosedCaptioning } from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from '../context/SocketContext';
import API from '../api/axios.js';

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
  const [classroomName, setClassroomName] = useState("");
  
  // Draggable local video position
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  // Check if current user is teacher
  const isTeacher = user?.role === 'teacher';

  // Fetch classroom name
  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const res = await API.get(`/classrooms/${classroomId}`);
        setClassroomName(res.data.name || "Classroom");
      } catch (err) {
        console.error("Failed to fetch classroom:", err);
        setClassroomName("Video Call");
      }
    };
    if (classroomId) {
      fetchClassroom();
    }
  }, [classroomId]);

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

    pcRef.current.onnegotiationneeded = async () => {
      try {
        console.log("🔄 Negotiation needed - creating new offer");
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socket.emit("webrtc:offer", { classroomId, offer, to: null });
        console.log("✅ Renegotiation offer sent");
      } catch (err) {
        console.error("❌ Error during renegotiation:", err);
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

    
    if (!socket) {
      alert("Socket not connected. Please refresh the page.");
      return;
    }
    
    try {
      setIsCaller(true);
      setIsInCall(true);
      
      createPeerConnection();
      
      if (!pcRef.current) {
        throw new Error("Failed to create peer connection");
      }
      
      await enableCameraAndMic();
      
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      
      socket.emit("webrtc:offer", { classroomId, offer, to: null });

    } catch (error) {
      setIsInCall(false);
      setIsCaller(false);
      alert("Failed to start call: " + error.message);
    }
  };

  const answerCall = async () => {
    try {
      setIncomingCall(false);
      setShowIncomingNotification(false);
      setIsInCall(true);
      
      // Create peer connection if not exists
      if (!pcRef.current) createPeerConnection();
      
      // Enable camera/mic FIRST so tracks are added to peer connection
      await enableCameraAndMic();
      
      // Set remote description from the offer
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(pcRef.current.remoteOffer));
      
      // Add any pending ICE candidates
      for (const c of pendingCandidates.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidates.current = [];

      // Now create and send the answer with tracks included
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
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
        console.log("📺 Starting screen share...");
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        console.log("✅ Screen track obtained:", screenTrack.label);
        
        const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
        console.log("🔍 Video sender found:", !!sender);

        if (sender) {
          console.log("🔄 Replacing camera track with screen track...");
          await sender.replaceTrack(screenTrack);
          console.log("✅ Track replaced successfully");
          setScreenSharing(true);
          
          // Notify remote peer about screen sharing
          socket.emit("webrtc:screen-share-status", { classroomId, isSharing: true });
          console.log("📡 Screen share status sent to remote peer");
          
          screenTrack.onended = async () => {
            console.log("📺 Screen sharing ended by user");
            // Revert to camera when screen share stops
            if (pcRef.current && stream) {
              const currentSender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
              const videoTrack = stream.getVideoTracks()[0];
              if (currentSender && videoTrack) {
                try {
                  await currentSender.replaceTrack(videoTrack);
                  console.log("✅ Reverted to camera successfully");
                } catch (err) {
                  console.error("❌ Failed to revert to camera:", err);
                }
              }
            }
            setScreenSharing(false);
            socket.emit("webrtc:screen-share-status", { classroomId, isSharing: false });
          };
        } else {
          console.warn("No video sender found to replace track.");
        }
      } catch (err) {
        console.error("Screen share failed:", err);
        // Don't change state if user cancelled
        if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
          alert("Failed to share screen: " + err.message);
        }
      }
    } else {
      // Manually stopping screen share
      try {
        const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
        if (sender && stream) {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            await sender.replaceTrack(videoTrack);
            console.log("✅ Stopped screen sharing, reverted to camera");
          }
        }
        setScreenSharing(false);
        socket.emit("webrtc:screen-share-status", { classroomId, isSharing: false });
      } catch (err) {
        console.error("❌ Error stopping screen share:", err);
      }
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
    <div className="flex flex-col min-h-screen font-sans overflow-hidden bg-white text-slate-800">
      {/* Header with Title and Classroom Info */}
      <div className="flex justify-between items-center p-4 shadow-lg bg-white border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {classroomName || "Video Call"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Live Video Session</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-violet-100 rounded-full text-violet-700 font-medium text-sm">
            {isTeacher ? 'Teacher' : 'Student'}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-600 font-medium">Connected</span>
          </div>
        </div>
      </div>

      {/* Main Video Grid - Dynamic Layout based on screen sharing */}
      <div className="flex-1 p-6 sm:p-8 relative">
        {remoteScreenSharing ? (
          // Screen sharing layout: Large remote screen + draggable small local video
          <>
            {/* Large Remote Screen */}
            <div className="h-full w-full relative rounded-lg overflow-hidden border-2 border-violet-300 shadow-2xl bg-slate-900">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <div className="absolute top-4 left-4 bg-violet-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2 z-20">
                <FaDesktop className="animate-pulse" />
                {isTeacher ? "Student's" : "Teacher's"} Screen
              </div>
              {captionText && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-base px-6 py-3 rounded-lg max-w-3xl text-center backdrop-blur-sm z-20"
                >
                  {captionText}
                </motion.div>
              )}
            </div>
            
            {/* Draggable Small Local Video (Bottom Right) */}
            <motion.div
              ref={dragRef}
              drag
              dragMomentum={false}
              dragElastic={0.1}
              dragConstraints={{
                top: -window.innerHeight * 0.5,
                left: -window.innerWidth * 0.65,
                right: 20,
                bottom: 20,
              }}
              initial={{ x: 0, y: 0 }}
              className="absolute bottom-6 right-6 w-80 h-60 rounded-xl overflow-hidden border-3 border-violet-500 shadow-2xl bg-slate-900 cursor-grab active:cursor-grabbing z-30"
              whileHover={{ scale: 1.05, borderWidth: '4px' }}
              whileDrag={{ scale: 1.1, boxShadow: "0 25px 50px -12px rgba(139, 92, 246, 0.5)" }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm font-medium">
                  You (Drag to move)
                </div>
                <div className="absolute top-2 right-2 bg-violet-600 text-white p-1.5 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          // Normal layout: Equal sized videos
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Remote Stream */}
            <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-slate-200 shadow-xl bg-slate-900 hover:border-violet-300 transition-colors">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="absolute bottom-3 left-3 bg-violet-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg z-10">
                {isTeacher ? '👨‍🎓 Student' : '👨‍🏫 Teacher'}
              </div>
              {captionText && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/80 text-white text-base px-6 py-3 rounded-lg max-w-xl text-center backdrop-blur-sm z-10"
                >
                  {captionText}
                </motion.div>
              )}
            </div>

            {/* Local Stream */}
            <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-slate-200 shadow-xl bg-slate-900 hover:border-slate-300 transition-colors">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="absolute bottom-3 left-3 bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold z-10">
                You
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="p-6 shadow-lg flex justify-center items-center gap-6 bg-white border-t border-slate-200">
        {/* Start Call Button - Only for Teachers */}
        {!isInCall && !incomingCall && isTeacher && (
          <motion.button 
            onClick={startCall} 
            className="p-4 bg-violet-600 rounded-full text-white shadow-lg hover:bg-violet-700"
            {...motionButtonProps}
          >
            <FaPhone size={20} />
          </motion.button>
        )}

        {/* Message for students when no call */}
        {!isInCall && !incomingCall && !isTeacher && (
          <div className="text-slate-500 text-base font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
            Waiting for teacher to start the call...
          </div>
        )}

        {/* Answer/Decline Buttons for Incoming Call */}
        {incomingCall && (
          <>
            <motion.button 
              onClick={answerCall} 
              className="p-4 bg-green-600 rounded-full text-white shadow-lg hover:bg-green-700"
              {...motionButtonProps}
            >
              <FaPhone size={20} />
            </motion.button>
            <motion.button 
              onClick={() => hangUpCall(true)} 
              className="p-4 bg-red-600 rounded-full text-white shadow-lg hover:bg-red-700"
              {...motionButtonProps}
            >
              <FaPhoneSlash size={20} />
            </motion.button>
          </>
        )}

        {/* In-Call Controls */}
        {isInCall && (
          <>
            <motion.button 
              onClick={toggleMic} 
              className={`p-4 rounded-full shadow-lg ${micOn ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-700 hover:bg-slate-600'} text-white`}
              {...motionButtonProps}
            >
              {micOn ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
            </motion.button>

            <motion.button 
              onClick={toggleCamera} 
              className={`p-4 rounded-full shadow-lg ${cameraOn ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-700 hover:bg-slate-600'} text-white`}
              {...motionButtonProps}
            >
              {cameraOn ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
            </motion.button>

            {isTeacher && (
              <motion.button 
                onClick={shareScreen} 
                className={`p-4 rounded-full shadow-lg ${screenSharing ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-700 hover:bg-slate-600'} text-white`}
                {...motionButtonProps}
              >
                {screenSharing ? <FaShareSquare size={20} /> : <FaDesktop size={20} />}
              </motion.button>
            )}
            
            <motion.button 
              onClick={toggleCaptioning} 
              className={`p-4 rounded-full shadow-lg ${isCaptioning ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-700 hover:bg-slate-600'} text-white`}
              {...motionButtonProps}
            >
              <FaClosedCaptioning size={20} />
            </motion.button>

            <motion.button 
              onClick={() => hangUpCall(true)} 
              className="p-4 bg-red-600 rounded-full text-white shadow-lg hover:bg-red-700"
              {...motionButtonProps}
            >
              <FaPhoneSlash size={20} />
            </motion.button>
          </>
        )}
      </div>

      {/* Incoming Call Notification */}
      <AnimatePresence>
        {showIncomingNotification && !isInCall && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-6 right-6 bg-white p-6 rounded-xl shadow-2xl border border-slate-200 max-w-sm z-50"
          >
            <div className="flex items-start gap-4 mb-4">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <FaPhone size={24} className="text-violet-600" />
              </motion.div>
              <div className="flex-1">
                <p className="font-bold text-xl text-slate-900">Incoming Call</p>
                <p className="text-slate-600 text-sm mt-1">Teacher is calling...</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <motion.button
                onClick={answerCall}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition"
              >
                <FaPhone size={16} />
                Answer
              </motion.button>
              <motion.button
                onClick={() => hangUpCall(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition"
              >
                <FaPhoneSlash size={16} />
                Decline
              </motion.button>
            </div>
            
            <motion.div 
              className="mt-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
              Ringing
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}