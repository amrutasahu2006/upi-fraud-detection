export default function SafetyAlert() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-sm font-medium text-red-600">
        Important Safety Alert
      </p>
      <p className="text-xs text-gray-600 mt-1">
        A contact has been flagged in your UPI circle for suspicious activity. Review these alerts to ensure family safety.
      </p>
      <button className="mt-3 w-full bg-red-500 text-white py-2 rounded-md text-sm cursor-pointer hover:bg-red-700 md:w-auto md:px-10 md:block md:mx-auto">
        Review Alerts
      </button>

    </div>
  );
}
