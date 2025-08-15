import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";

export default function Whiteboard({ classroomId, user }) {
  const canvasRef = useRef(null);
  const { socket } = useSocket();
  const [drawing, setDrawing] = useState(false);

  // Mouse coordinates
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!socket) return;

    socket.emit("joinClassroom", { classroomId, user });

    // Listen to drawing data from other users
    socket.on("drawingData", (data) => {
      const ctx = canvasRef.current.getContext("2d");
      drawLine(ctx, data.x0, data.y0, data.x1, data.y1, data.color, false);
    });

    return () => {
      socket.off("drawingData");
    };
  }, [socket]);

  // Draw line function
  const drawLine = (ctx, x0, y0, x1, y1, color = "black", emit = true) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;
    // Send drawing data to server
    socket.emit("drawing", {
      classroomId,
      data: { x0, y0, x1, y1, color },
    });
  };

  // Mouse events
  const handleMouseDown = (e) => {
    setDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setLastPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvasRef.current.getContext("2d");
    drawLine(ctx, lastPos.x, lastPos.y, x, y, "black", true);
    setLastPos({ x, y });
  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Whiteboard: {classroomId}</h1>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="border"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}
