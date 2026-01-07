import { Link } from "react-router-dom";

function SecurityRecommendations() {
  const recommendations = [
    {
      id: 1,
      icon: (
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100",
      title: "Strengthen Account Security",
      description: "Add an extra layer of protection by enabling 2FA for all transactions and logins.",
      buttonText: "Enable 2FA",
      buttonAction: () => console.log("Enable 2FA clicked")
    },
    {
      id: 2,
      icon: (
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconColor: "text-green-500",
      iconBg: "bg-green-100",
      title: "Manage Transaction Amounts",
      description: "Limit the maximum amount you can send daily to minimize potential fraud impact.",
      buttonText: "Set Limits",
      buttonAction: () => console.log("Set Limits clicked")
    },
    {
      id: 3,
      icon: (
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100",
      title: "Protect Against Known Threats",
      description: "Block Verified Payment Addresses (VPAs) that have been flagged as suspicious or reported for fraud.",
      buttonText: "Block VPA",
      buttonAction: () => console.log("Block VPA clicked")
    },
    {
      id: 4,
      icon: (
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      iconColor: "text-red-500",
      iconBg: "bg-red-100",
      title: "Check Your Connected Devices",
      description: "Regularly review and remove any unrecognized or old devices connected to your SurakshaPay account.",
      buttonText: "Review Devices",
      buttonAction: () => console.log("Review Devices clicked")
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">
        {/* Page Header */}
        <header className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <Link to="/" className="text-2xl cursor-pointer">←</Link>
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">Security Recommendations</h1>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8">
          {/* Heading Section */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Stay Secure, Always.
            </h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Here are some recommendations to keep your account safe after an unusual activity.
            </p>
          </div>

          {/* Recommendation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`${rec.iconBg} ${rec.iconColor} p-2 md:p-3 rounded-lg flex-shrink-0`}>
                    {rec.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">
                      {rec.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed">
                      {rec.description}
                    </p>
                    <button
                      onClick={rec.buttonAction}
                      className="w-full bg-blue-600 text-white font-medium py-2.5 md:py-3 px-4 md:px-6 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm md:text-base shadow-sm hover:shadow-md cursor-pointer"
                    >
                      {rec.buttonText}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default SecurityRecommendations;

