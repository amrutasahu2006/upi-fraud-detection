import Header from "../components/Header";
import SafetyAlert from "../components/SafetyAlert";
import UserCard from "../components/UserCard";
import ExpandCircle from "../components/ExpandCircle";
import { users } from "../data/users";

export default function Safety() {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">

        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8 space-y-6">

          {/* Safety Alert */}
          <SafetyAlert />

          {/* Circle Heading */}
          <h2 className="text-base md:text-lg lg:text-xl font-semibold">
            Your UPI Circle
          </h2>

          {/* Users List */}
          <div className="space-y-3 md:space-y-4 lg:space-y-5">
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>

          {/* Expand Circle */}
          <ExpandCircle />
        </main>
      </div>
    </div>
  );
}
