export default function UserCard({ user }) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{user.name}</p>
          <div className="flex gap-2 mt-1 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-gray-100">
              {user.role}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full ${
                user.status === "Online"
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {user.status}
            </span>
          </div>
        </div>
        <button className="text-gray-400 text-xl cursor-pointer">+</button>
      </div>

      {user.suspicious && (
        <div className="bg-red-50 p-2 rounded-md text-xs">
          <p className="text-red-600 font-medium">Suspicious Payees</p>
          <div className="flex items-center justify-between mt-1">
            <span>{user.payee}</span>
            {user.flagged && (
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full">
                Flagged
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
