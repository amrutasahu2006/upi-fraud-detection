export default function SettingToggle({
  title,
  description,
  enabled,
  onChange,
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-8">
      <div className="max-w-[80%] md:max-w-[95%]">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {description}
        </p>
      </div>

      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-16 items-center rounded-full transition cursor-pointer
        ${enabled ? "bg-blue-500" : "bg-gray-300"}`}
      >
        <span
          className={`absolute left-1 top-0.5 h-5 w-5 rounded-full bg-white transition transform
          ${enabled ? "translate-x-6 md:translate-x-9" : "translate-x-0"}`}
        />
      </button>

    </div>
  );
}
