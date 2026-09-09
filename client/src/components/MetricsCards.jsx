import React from 'react';

const MetricsCards = ({ data }) => {
  // If data is not yet loaded, show placeholders
  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">إجمالي الزيارات</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">إجمالي العينات</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">عدد المندوبين</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">متوسط العينات لكل زيارة</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
      </div>
    );
  }

  // Assuming data has the following structure:
  // {
  //   totalVisits: number,
  //   totalSamples: number,
  //   totalDelegates: number,
  //   avgSamplesPerVisit: number
  // }
  const { totalVisits, totalSamples, totalDelegates, avgSamplesPerVisit } = data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">إجمالي الزيارات</h3>
        <p className="text-2xl font-bold text-gray-900">{totalVisits}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">إجمالي العينات</h3>
        <p className="text-2xl font-bold text-gray-900">{totalSamples}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">عدد المندوبين</h3>
        <p className="text-2xl font-bold text-gray-900">{totalDelegates}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">متوسط العينات لكل زيارة</h3>
        <p className="text-2xl font-bold text-gray-900">{avgSamplesPerVisit?.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default MetricsCards;
