export default function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors
        ${
          active
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
        }`}
    >
      {label}
    </button>
  );
}
