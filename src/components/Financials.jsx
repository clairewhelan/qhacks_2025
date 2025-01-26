import React from 'react';

const stats = [
  { id: 1, name: 'Transactions stored every day', value: '10,000' },
  { id: 2, name: 'Total transactions recorded', value: '$15 million' },
  { id: 3, name: 'New users annually', value: '46,000' },
];

export default function Financials() {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8 rounded-lg mt-0">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="mx-auto flex max-w-xs flex-col gap-y-4 bg-indigo-800 shadow-lg p-6 rounded-lg border border-indigo-200"
          >
            <dt className="text-base font-medium text-white-600">{stat.name}</dt>
            <dd className="order-first text-3xl font-bold tracking-tight text-white-700 sm:text-5xl">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}