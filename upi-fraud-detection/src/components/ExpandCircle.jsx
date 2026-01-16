export default function ExpandCircle() {
  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 text-center">
      <p className="text-sm font-medium text-blue-600">
        Expand Your Circle
      </p>
      <p className="text-xs text-gray-600 mt-1">
        Add family members to monitor their UPI transactions.
      </p>
      <button className="mt-3 w-full bg-blue-500 text-white py-2 rounded-md text-sm cursor-pointer hover:bg-blue-700 md:w-auto md:px-10">
        Add New Member
      </button>
    </div>
  );
}
