// src/pages/Challenge.jsx
export default function Challenge({ classroomId, user }) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Coding Challenges Coming Soon!</h2>
      <p>Classroom ID: {classroomId}</p>
      <p>User: {user.name}</p>
      <p className="text-gray-500 mt-2">
        This section will later contain interactive coding challenges for the classroom.
      </p>
    </div>
  );
}
