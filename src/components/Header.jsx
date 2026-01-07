export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
      {/* Left: Logo + Icon */}
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 p-1 rounded">
          <i className="fa-solid fa-shield text-white text-base md:text-lg lg:text-xl"></i>
        </div>

        <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-blue-600">
          सुरक्षाPay
        </h1>
      </div>

      {/* Right: Settings Button */}
      <button className="text-gray-500 hover:text-gray-700 text-xl md:text-2xl lg:text-3xl">
        ⚙️
      </button>
    </header>
  );
}
