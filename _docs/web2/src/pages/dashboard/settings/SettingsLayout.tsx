import { Outlet } from 'react-router-dom'

export default function SettingsLayout() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-content-primary mb-4">Settings</h2>
      <Outlet />
    </div>
  )
}
