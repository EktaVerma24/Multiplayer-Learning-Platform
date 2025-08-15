import { useNavigate } from "react-router-dom";

export default function Dashboard({ user }) {
  const navigate = useNavigate();

  const classrooms = [
    { id: "class1", name: "Math 101" },
    { id: "class2", name: "Physics 201" },
  ]; // Example classrooms, you can fetch from backend later

  const enterClassroom = (id) => {
    // Just navigate to the classroom URL
    navigate(`/classroom/${id}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.name}</h1>
      <h2 className="text-xl mb-2">Your Classrooms:</h2>
      <div className="space-y-2">
        {classrooms.map((cls) => (
          <div
            key={cls.id}
            className="border p-2 rounded cursor-pointer hover:bg-gray-100"
            onClick={() => enterClassroom(cls.id)}
          >
            {cls.name}
          </div>
        ))}
      </div>
    </div>
  );
}
