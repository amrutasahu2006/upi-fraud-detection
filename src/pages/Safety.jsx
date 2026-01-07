import Header from "../components/Header";
import SafetyAlert from "../components/SafetyAlert";
import UserCard from "../components/UserCard";
import ExpandCircle from "../components/ExpandCircle";
import { users } from "../data/users";

export default function Safety() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      <Header />

      <main className="p-4 space-y-4">
        <SafetyAlert />

        <h2 className="text-base font-semibold">Your UPI Circle</h2>

        <div className="space-y-3">
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>

        <ExpandCircle />
      </main>
    </div>
  );
}
