import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { fabric } from "fabric";
import {
  Pencil, Eraser, Type, MousePointer2, Circle, Square, Trash2, Undo, Redo, Download, Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import API from "../api/axios";

const toolIcons = {
  select: MousePointer2, pencil: Pencil, eraser: Eraser,
  text: Type, circle: Circle, rect: Square,
};

const debounce = (fn, delay) => {
  let timeoutId = null;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const eraserCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21H7Z"/><path d="M18 11l-5-5"/><path d="m9 21 12-12"/></svg>') 4 20, auto`;

export default function Whiteboard({ classroomId, user }) {
  const { socket } = useSocket();
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);

  const isTeacher = user?.role === 'teacher';
  
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const brushSizeRef = useRef(brushSize);

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const isRemoteUpdate = useRef(false);
  const saveStateRef = useRef();
  const isDrawingShape = useRef(false);
  const shapeRef = useRef(null);
  const startPoint = useRef(null);
  const fileInputRef = useRef();

  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);

  const emitState = useCallback(debounce((state) => {
    if(!isTeacher) return;
    if (socket) {
        socket.emit("canvas-state", { classroomId, state });
    }
  }, 300), [socket, classroomId]);

  const saveState = useCallback(() => {
    if(!isTeacher) return;
    if (isRemoteUpdate.current || !fabricRef.current) return;
    const currentState = fabricRef.current.toObject();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    emitState(currentState);
  }, [history, historyIndex, emitState]);

  useEffect(() => {
    saveStateRef.current = saveState;
  }, [saveState]);

  useEffect(() => {
    if (!socket) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth * 0.9,
      height: window.innerHeight * 0.7,
      backgroundColor: "white",
    });
    fabricRef.current = canvas;

    socket.emit("joinClassroom", { classroomId, user });
    socket.on("canvas-state-from-server", (state) => {
      isRemoteUpdate.current = true;
      canvas.loadFromJSON(state, () => {
        canvas.renderAll();
        // Set history without triggering a new save
        const newHistory = [state];
        setHistory(newHistory);
        setHistoryIndex(0);
        isRemoteUpdate.current = false;
      });
    });

    const handleMouseDown = (o) => {
      if (!isTeacher) return;
      const pointer = canvas.getPointer(o.e);
      startPoint.current = pointer;
      const currentTool = toolRef.current;
      
      if (currentTool === 'eraser' && o.target) {
        canvas.remove(o.target);
        saveStateRef.current();
        return;
      }
      
      if (currentTool === 'text') {
        const text = new fabric.IText('Text', { left: pointer.x, top: pointer.y, fill: colorRef.current, fontSize: brushSizeRef.current * 4 });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        setTool('select');
        return;
      }
      
      if (['rect', 'circle'].includes(currentTool)) {
        isDrawingShape.current = true;
        const shapeConfig = { left: pointer.x, top: pointer.y, fill: 'transparent', stroke: colorRef.current, strokeWidth: brushSizeRef.current };
        shapeRef.current = currentTool === 'rect' ? new fabric.Rect({ ...shapeConfig, width: 0, height: 0 }) : new fabric.Circle({ ...shapeConfig, radius: 0 });
        canvas.add(shapeRef.current);
      }
    };

    const handleMouseMove = (o) => {
      if (!isTeacher) return;
      if (!isDrawingShape.current || !shapeRef.current) return;
      const pointer = canvas.getPointer(o.e);
      const { x: startX, y: startY } = startPoint.current;
      const currentTool = toolRef.current;

      if (currentTool === 'rect') {
        shapeRef.current.set({ width: Math.abs(startX - pointer.x), height: Math.abs(startY - pointer.y), left: Math.min(startX, pointer.x), top: Math.min(startY, pointer.y) });
      } else if (currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(startX - pointer.x, 2) + Math.pow(startY - pointer.y, 2)) / 2;
        shapeRef.current.set({ radius, left: Math.min(startX, pointer.x), top: Math.min(startY, pointer.y) });
      }
      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (!isTeacher) return;
      isDrawingShape.current = false;
      saveStateRef.current();
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    
    return () => {
      socket.off("canvas-state-from-server");
      if (canvas) {
        canvas.dispose();
      }
    };
  }, [classroomId, socket, user]);


// 2. Add the new handler function for summarization
// Replace your existing handleSummarize function with this one.
const handleSummarize = async () => {
  if (!isTeacher) return;
  if (!fabricRef.current) return;

  setIsSummarizing(true);
  setSummary('');

  try {
    // 1. Convert the entire canvas to a PNG image data URL (Base64 string)
    const imageDataURL = fabricRef.current.toDataURL({ format: 'png' });

    // 2. Send this image data to your backend API under the 'image' key
    const response = await API.post('/notes/summarize', {
      image: imageDataURL,
    });

    setSummary(response.data.summary);

  } catch (error) {
    console.error("Error generating summary:", error);
    const errorMessage = error.response?.data?.error || "An error occurred while generating the summary.";
    setSummary(`Sorry, ${errorMessage}`);
  } finally {
    setIsSummarizing(false);
  }
};

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    const isEditing = isTeacher && ['pencil', 'eraser', 'text', 'rect', 'circle'].includes(tool);

    canvas.isDrawingMode = isTeacher && tool === 'pencil';
    canvas.selection = isTeacher && tool === 'select';

    canvas.forEachObject(obj => {
      obj.selectable = isTeacher && tool === 'select';
      obj.evented = isTeacher;
    });
    
    if (tool === 'pencil') {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.width = brushSize;
    }

    if (tool === 'select') {
      canvas.defaultCursor = isTeacher ? 'default' : 'not-allowed';
      canvas.hoverCursor = isTeacher ? 'move' : 'not-allowed';
    } else if (tool === 'eraser') {
      canvas.defaultCursor = isTeacher ? eraserCursor : 'not-allowed';
      canvas.hoverCursor = isTeacher ? eraserCursor : 'not-allowed';
    } else if (isEditing) {
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
    }
    else{
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'default';
    }
  }, [tool, color, brushSize, isTeacher]);

  const handleUndo = () => { if (!isTeacher) return; if (historyIndex > 0) { isRemoteUpdate.current = true; const newIndex = historyIndex - 1; setHistoryIndex(newIndex); fabricRef.current.loadFromJSON(history[newIndex], () => { fabricRef.current.renderAll(); emitState(history[newIndex]); isRemoteUpdate.current = false; }); } };
  const handleRedo = () => { if (!isTeacher) return; if (historyIndex < history.length - 1) { isRemoteUpdate.current = true; const newIndex = historyIndex + 1; setHistoryIndex(newIndex); fabricRef.current.loadFromJSON(history[newIndex], () => { fabricRef.current.renderAll(); emitState(history[newIndex]); isRemoteUpdate.current = false; }); } };
  const handleClear = () => { if (!isTeacher) return; fabricRef.current.clear(); saveState(); };
  const handleDownload = () => { if (!isTeacher) return; const dataURL = fabricRef.current.toDataURL({ format: 'png' }); const link = document.createElement('a'); link.href = dataURL; link.download = `whiteboard-${classroomId}.png`; link.click(); };
  const handleImportImage = (e) => {
    if (!isTeacher) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      fabric.Image.fromURL(event.target.result, (img) => {
        img.set({
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
        });
        fabricRef.current.add(img);
        fabricRef.current.setActiveObject(img);
        saveStateRef.current();
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col mt-8 items-center justify-center min-h-screen p-4 font-sans">
      <div className="absolute top-61 left-1/2 -translate-x-1/2 z-20 flex items-center bg-white/90 backdrop-blur-lg rounded-full shadow-xl px-4 py-2 gap-2 border border-gray-200">
        {/* Tool Buttons */}
        <div className="flex gap-1">
          {Object.entries(toolIcons).map(([toolName, Icon]) => (
            <button
              key={toolName}
              onClick={() => setTool(toolName)}
              disabled={!isTeacher}
              className={`group relative p-2 rounded-full transition-all duration-200 border-2
                ${tool === toolName
                  ? "bg-violet-100 border-violet-500 shadow"
                  : "bg-white border-transparent hover:bg-slate-100"}
                ${!isTeacher ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
              title={toolName.charAt(0).toUpperCase() + toolName.slice(1)}
            >
              <Icon size={22} />
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-10">
                {toolName.charAt(0).toUpperCase() + toolName.slice(1)}
              </span>
            </button>
          ))}
        </div>
        {/* Divider */}
        <div className="w-px h-8 bg-gray-300 mx-2"></div>
        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={!isTeacher}
            className="w-8 h-8 rounded-full border-2 border-gray-300 shadow cursor-pointer"
            title="Brush Color"
          />
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
            disabled={!isTeacher}
            className="w-24 accent-violet-500"
            title="Brush Size"
          />
        </div>
        {/* Divider */}
        <div className="w-px h-8 bg-gray-300 mx-4"></div>
        {/* Undo/Redo/Clear/Download/Import */}
        <div className="flex gap-1">
          <button
            onClick={handleUndo}
            disabled={!isTeacher || historyIndex <= 0}
            className="p-2 rounded-full bg-white border-2 border-transparent hover:bg-slate-100 disabled:opacity-50"
            title="Undo"
          >
            <Undo size={22} />
          </button>
          <button
            onClick={handleRedo}
            disabled={!isTeacher || historyIndex >= history.length - 1}
            className="p-2 rounded-full bg-white border-2 border-transparent hover:bg-slate-100 disabled:opacity-50"
            title="Redo"
          >
            <Redo size={22} />
          </button>
          <button
            onClick={handleClear}
            disabled={!isTeacher}
            className="p-2 rounded-full bg-white border-2 border-transparent hover:bg-red-100 hover:border-red-400 hover:text-red-600"
            title="Clear Canvas"
          >
            <Trash2 size={22} />
          </button>
          <button
            onClick={handleDownload}
            disabled={!isTeacher} 
            className="p-2 rounded-full bg-white border-2 border-transparent hover:bg-green-100 hover:border-green-400 hover:text-green-600"
            title="Download PNG"
          >
            <Download size={22} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            disabled={!isTeacher}
            className="p-2 rounded-full bg-white border-2 border-transparent hover:bg-blue-100 hover:border-blue-400 hover:text-blue-600"
            title="Import Image"
          >
            <ImageIcon size={22} />
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleImportImage}
          />
          <button
    onClick={handleSummarize}
    disabled={!isTeacher || isSummarizing}
    className="p-2 rounded-full bg-white border-2 border-transparent hover:bg-purple-100 hover:border-purple-400 hover:text-purple-600 disabled:opacity-50"
    title="Generate AI Summary"
  >
    <Sparkles size={22} />
  </button>
        </div>
      </div>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border-2 border-gray-300">
        <canvas ref={canvasRef} />
      </div>

      {summary && (
  <div className="w-[90%] max-w-[800px] mt-4 p-4 bg-white shadow-lg rounded-lg border-2 border-gray-200">
    <h3 className="font-bold text-lg mb-2">AI Summary ✨</h3>
    <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
  </div>
)}
    </div>
  );
}
