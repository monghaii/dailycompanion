"use client";

export default function AnalyticsSection() {
  return (
    <div className="flex-1 bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          View your coaching metrics and insights
        </p>
      </div>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Analytics Coming Soon
            </h3>
            <p className="text-gray-600">
              Track client engagement, revenue metrics, and growth trends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
