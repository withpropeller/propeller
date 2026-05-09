export default function IssuingIndexPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-content-primary">Issuing</h2>
      <p className="text-content-secondary">
        Manage card programs, cards, authorizations, and transactions.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Card Programs', desc: 'Manage card programs and configurations', count: '—' },
          { label: 'Cards', desc: 'All issued cards and their statuses', count: '—' },
          { label: 'Authorizations', desc: 'Card authorization requests and decisions', count: '—' },
          { label: 'BINs', desc: 'Bank Identification Numbers', count: '—' },
          { label: 'Transactions', desc: 'Card transaction history', count: '—' },
        ].map(item => (
          <div
            key={item.label}
            className="p-4 bg-surface-primary border border-border-primary-light rounded-xl"
          >
            <h3 className="font-medium text-content-primary">{item.label}</h3>
            <p className="text-sm text-content-secondary mt-1">{item.desc}</p>
            <p className="text-2xl font-semibold text-content-primary mt-3">{item.count}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
