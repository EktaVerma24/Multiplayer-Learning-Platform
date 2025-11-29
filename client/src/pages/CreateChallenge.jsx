import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios"; 

// --- SVG Icon for the Save Button ---
const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

// --- Simple Notification Component (Toast) ---
const Notification = ({ message, type, visible, onClose }) => {
    if (!visible) return null;

    const baseClasses = "fixed top-4 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-xl text-white z-50 transition-all duration-300 ease-out";
    const typeClasses = type === 'success' 
        ? "bg-green-500 border-green-700" 
        : "bg-red-500 border-red-700";

    return (
        <div className={`${baseClasses} ${typeClasses}`} role="alert">
            <div className="flex items-center">
                <span className="font-semibold text-sm">{message}</span>
                <button 
                    onClick={onClose} 
                    className="ml-4 -mr-1 p-1 rounded-full text-white hover:bg-opacity-75 transition"
                    aria-label="Close"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};


export default function CreateChallenge({ user }) {
  const { id: classroomId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    dueDate: "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '' }]);
  const [languageTemplates, setLanguageTemplates] = useState({
      java: { boilerplate: '', harness: '' },
      python: { boilerplate: '', harness: '' },
  });
  // State for non-blocking notification messages
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });

  // Utility function to show notification
  const showNotification = (message, type = 'success') => {
      setNotification({ message, type, visible: true });
      // Auto-hide after 5 seconds
      setTimeout(() => {
          setNotification(prev => ({ ...prev, visible: false }));
      }, 5000);
  };


  useEffect(() => {
    if (!classroomId) {
      console.error("❌ Missing classroomId in route");
      // Using notification instead of navigate immediately if classroomId is missing on load
      showNotification("Missing classroom ID. Redirecting to dashboard.", 'error');
      navigate("/dashboard");
    }
  }, [classroomId, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImage(null);
      setImagePreview("");
    }
  };

  const handleTestCaseChange = (index, event) => {
    const values = [...testCases];
    values[index][event.target.name] = event.target.value;
    setTestCases(values);
  };

  const addTestCase = () => {
      setTestCases([...testCases, { input: '', expectedOutput: '' }]);
  };

  const removeTestCase = (index) => {
      const values = [...testCases];
      values.splice(index, 1);
      setTestCases(values);
  };

  const handleTemplateChange = (lang, field, value) => {
      setLanguageTemplates(prev => ({
          ...prev,
          [lang]: {
              ...prev[lang],
              [field]: value
          }
      }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation checks, replaced alert() with showNotification()
    if (!user?._id) {
      showNotification("You must be logged in as a teacher to create a challenge.", 'error');
      return;
    }
    if (!classroomId) {
      showNotification("No classroom selected. Please ensure you are accessing this page correctly.", 'error');
      return;
    }
    if (!formData.title.trim() || !formData.description.trim()) {
      showNotification("Title and description are required.", 'error');
      return;
    }
    
    const payload = new FormData();
    payload.append("title", formData.title.trim());
    payload.append("description", formData.description.trim());
    payload.append("difficulty", formData.difficulty);
    payload.append("dueDate", formData.dueDate);
    payload.append("classroom", classroomId);
    payload.append("teacher", user._id);
    if (image) {
      payload.append("challengeImage", image);
    }
    payload.append("testCases", JSON.stringify(testCases));
    payload.append("languageTemplates", JSON.stringify(languageTemplates));

    try {
      const res = await API.post("/challenges/", payload);
      if (!res) {
        showNotification("❌ Failed to create challenge.", 'error');
        return;
      }
      showNotification("✅ Challenge created successfully!", 'success');
      navigate(`/classroom/${classroomId}`);
    } catch (err) {
      console.error("❌ Error creating challenge:", err);
      if (err.response?.data?.message) {
        showNotification(`Error: ${err.response.data.message}`, 'error');
      } else {
        showNotification("Failed to create challenge. Check console for details.", 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Notification component rendering */}
      <Notification 
          message={notification.message} 
          type={notification.type} 
          visible={notification.visible}
          onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
      />
      {/* End Notification component */}

      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create a New Challenge</h1>
            <p className="mt-2 text-slate-500">Define the task and set the parameters for your students.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-slate-700">Challenge Title</label>
              <input
                id="title"
                type="text"
                name="title"
                placeholder="e.g., Build a Simple Calculator"
                value={formData.title}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Provide detailed instructions for the challenge..."
                value={formData.description}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition min-h-[120px]"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="challengeImage" className="text-sm font-medium text-slate-700">Challenge Image (Optional)</label>
              <input
                id="challengeImage"
                type="file"
                name="challengeImage"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
              {imagePreview && (
                <div className="mt-4 border rounded-lg p-2">
                  <img src={imagePreview} alt="Selected preview" className="w-full h-auto rounded-md" />
                </div>
              )}
            </div>

            {/* --- Test Cases Section --- */}
            <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
                <h3 className="text-lg font-medium text-slate-800">Test Cases</h3>
                {testCases.map((testCase, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-4 p-3 bg-slate-50 rounded-md relative">
                        <textarea
                            name="input"
                            placeholder={`Input for Test Case #${index + 1}`}
                            value={testCase.input}
                            onChange={e => handleTestCaseChange(index, e)}
                            className="block w-full text-sm p-2 border border-slate-300 rounded-md focus:ring-violet-500"
                            rows={2}
                        />
                        <textarea
                            name="expectedOutput"
                            placeholder={`Expected Output #${index + 1}`}
                            value={testCase.expectedOutput}
                            onChange={e => handleTestCaseChange(index, e)}
                            className="block w-full text-sm p-2 border border-slate-300 rounded-md focus:ring-violet-500"
                            rows={2}
                        />
                        <button type="button" onClick={() => removeTestCase(index)} className="absolute -top-4 -right-2 text-black rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">&times;</button>
                    </div>
                ))}
                <button type="button" onClick={addTestCase} className="text-sm font-semibold text-violet-600 hover:text-violet-800">
                    + Add Test Case
                </button>
            </div>

            {/* --- Language Templates Section --- */}
            <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
                <h3 className="text-lg font-medium text-slate-800">Language Templates</h3>
                {/* Java Template */}
                <div className="space-y-2">
                    <label className="font-semibold text-slate-600">Java</label>
                    <textarea
                        placeholder="Boilerplate code for Java..."
                        value={languageTemplates.java.boilerplate}
                        onChange={e => handleTemplateChange('java', 'boilerplate', e.target.value)}
                        className="block w-full font-mono text-xs p-2 border border-slate-300 rounded-md min-h-[100px]"
                    />
                    <textarea
                        placeholder="Harness code for Java (use ${userCode})..."
                        value={languageTemplates.java.harness}
                        onChange={e => handleTemplateChange('java', 'harness', e.target.value)}
                        className="block w-full font-mono text-xs p-2 border border-slate-300 rounded-md min-h-[100px]"
                    />
                </div>
                {/* Python Template */}
                <div className="space-y-2">
                    <label className="font-semibold text-slate-600">Python</label>
                    <textarea
                        placeholder="Boilerplate code for Python..."
                        value={languageTemplates.python.boilerplate}
                        onChange={e => handleTemplateChange('python', 'boilerplate', e.target.value)}
                        className="block w-full font-mono text-xs p-2 border border-slate-300 rounded-md min-h-[100px]"
                    />
                    <textarea
                        placeholder="Harness code for Python (use ${userCode})..."
                        value={languageTemplates.python.harness}
                        onChange={e => handleTemplateChange('python', 'harness', e.target.value)}
                        className="block w-full font-mono text-xs p-2 border border-slate-300 rounded-md min-h-[100px]"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="difficulty" className="text-sm font-medium text-slate-700">Difficulty</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium text-slate-700">Due Date</label>
                <input
                  id="dueDate"
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <SaveIcon />
              Save Challenge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
