import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 12 },
  },
};

export default function QuizCard({ quiz, onSelect, userRole }) {
  const isStudent = userRole === "student";
  const isTeacher = userRole === "teacher";

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.05 }} // Allow both roles to have a hover effect
      whileTap={{ scale: 0.95 }} // Allow both roles to have a tap effect
      onClick={onSelect} // Allow both roles to click the card
      className="bg-white rounded-lg shadow-lg p-6 cursor-pointer" // Make it clickable for all roles
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{quiz.title}</h2>
      <p className="text-gray-600 mb-4">{quiz.questions.length} Questions</p>
      <div className="text-right">
        <span
          className={`font-semibold ${
            isStudent ? "text-blue-600" : "text-purple-600" // Use a different color for teachers
          }`}
        >
          {isStudent ? "Start Quiz →" : "View Submissions →"} 
        </span>
      </div>
    </motion.div>
  );
}