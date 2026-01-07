export default function SettingToggle({
  title,
  description,
  enabled,
  onChange,
}) {
  return (
    // Added 'w-full' to ensure container consistency
    <div className="w-full flex items-start justify-between gap-4 py-8">
      
      {/* 1. Removed fixed max-w percentages (max-w-[80%]).
         2. Added 'flex-1': This allows text to fill remaining space
            automatically without pushing the toggle off-screen.
      */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {description}
        </p>
      </div>

      <button
        onClick={onChange}
        // Added 'shrink-0': Prevents the button from being squished on tiny screens
        className={`shrink-0 relative inline-flex h-6 w-16 items-center rounded-full transition cursor-pointer
        ${enabled ? "bg-blue-500" : "bg-gray-300"}`}
      >
        <span
          className={`absolute left-1 h-5 w-5 rounded-full bg-white transition transform
          ${enabled ? "translate-x-9" : "translate-x-0"}`}
        />
      </button>

    </div>
  );
}