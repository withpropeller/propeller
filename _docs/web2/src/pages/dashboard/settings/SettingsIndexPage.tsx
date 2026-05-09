export default function SettingsIndexPage() {
  return (
    <div className="space-y-6">
      <p className="text-content-secondary">
        Manage your account settings, team, billing, and compliance.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Profile', desc: 'Name, email, and preferences', href: '/dashboard/settings/profile' },
          { label: 'Business identity', desc: 'Company details and verification', href: '/dashboard/settings/business' },
          { label: 'Compliance', desc: 'KYC/KYB status and documents', href: '/dashboard/settings/compliance' },
          { label: 'Team', desc: 'Members, roles, and invitations', href: '/dashboard/settings/team' },
          { label: 'Billing', desc: 'Pricing plan and invoices', href: '/dashboard/settings/billing' },
          { label: 'Security', desc: 'MFA and password settings', href: '/dashboard/settings/security' },
        ].map(item => (
          <a
            key={item.label}
            href={item.href}
            className="block p-4 bg-surface-primary border border-border-primary-light rounded-xl hover:border-border-secondary-main transition-colors"
          >
            <h3 className="font-medium text-content-primary">{item.label}</h3>
            <p className="text-sm text-content-secondary mt-1">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
