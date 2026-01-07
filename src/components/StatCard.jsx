export default function StatCard({ title, value, change, positive }) {
  return (
    <div className="bg-white rounded-lg border p-4 space-y-1">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
      <p
        className={`text-xs ${
          positive ? "text-green-600" : "text-red-500"
        }`}
      >
        {change} last month
      </p>
    </div>
  );
}
