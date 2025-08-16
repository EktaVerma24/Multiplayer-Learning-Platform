import { motion } from "framer-motion"; // 👇 1. Import motion

// 👇 2. Define animation variants for the card's entry
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    }
  },
};

export default function QuizCard({ quiz, onSelect }) {
  return (
    // 👇 3. Change the div to motion.div and add animation props
    <motion.div
      variants={cardVariants} // For the entry animation
      whileHover={{ scale: 1.05, y: -8 }} // For the hover effect
      whileTap={{ scale: 0.95 }} // For the click effect
      onClick={onSelect}
      className="cursor-pointer bg-white rounded-lg shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        {quiz.title || "Error: Title Not Found"}
      </h2>

      <p className="text-gray-600 mb-4">
        {quiz.questions.length} Questions
      </p>

      <div className="text-right">
        <span className="font-semibold text-blue-600">
          Start Quiz →
        </span>
      </div>
       {/* You can remove the debug <pre> block now if you wish */}
    </motion.div>
  );
}