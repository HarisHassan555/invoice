import { NavLink, Outlet } from 'react-router-dom'
import CloudSyncStatus from './CloudSyncStatus'
import { useTheme } from '../context/ThemeContext'

function SidebarLink({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-white/10 text-white'
            : 'text-slate-300 hover:bg-white/5 hover:text-white',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

export default function Layout() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex min-h-screen w-full">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
        <div className="border-b border-slate-800 px-5 py-5">
          <h1 className="text-base font-semibold tracking-tight text-white">Invoice Manager</h1>
          <p className="mt-1 text-xs text-slate-400">Billing & PDF export</p>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
          <div>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Invoices
            </p>
            <div className="space-y-0.5">
              <SidebarLink to="/invoices" end>
                All invoices
              </SidebarLink>
              <SidebarLink to="/invoices/new">New invoice</SidebarLink>
            </div>
          </div>

          <div>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Master data
            </p>
            <div className="space-y-0.5">
              <SidebarLink to="/master/company">Company</SidebarLink>
              <SidebarLink to="/master/customer">Customer</SidebarLink>
              <SidebarLink to="/master/product">Product</SidebarLink>
            </div>
          </div>
        </nav>

        <div className="border-t border-slate-800">
          <CloudSyncStatus />
          <div className="p-3 pt-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <span>Theme</span>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium capitalize text-white">
              {theme}
            </span>
          </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-slate-50 dark:bg-slate-950">
        <main className="flex-1 overflow-auto px-6 py-8 sm:px-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
