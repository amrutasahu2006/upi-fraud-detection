export default function FilterPill({ label, active }) {
  return (
    <button
      className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer
        ${
          active
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-600 border-gray-300"
        }`}
    >
      {label}
    </button>
  );
}
