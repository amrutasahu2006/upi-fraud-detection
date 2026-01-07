export default function RecentFraudItem({ id, date, type, risk }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div>
        <p className="text-xs text-gray-800">
          Transaction ID: {id}
        </p>
        <p className="text-[11px] text-gray-500">{date}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100">
          {type}
        </span>
        <span className="text-xs font-semibold text-orange-500">
          {risk}%
        </span>
      </div>
    </div>
  );
}
