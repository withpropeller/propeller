import { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

type Severity = 'info' | 'success' | 'warning' | 'danger'

const tone: Record<Severity, { wrap: string; icon: ReactNode }> = {
  info: {
    wrap: 'bg-[#EEF1FE] border-[#D5DCFD] text-propeller-blue-dark',
    icon: <Info className="size-4 text-propeller-blue" />,
  },
  success: {
    wrap: 'bg-[#EAF9EF] border-[#ACEBC0] text-[#073815]',
    icon: <CheckCircle2 className="size-4 text-[#17B04A]" />,
  },
  warning: {
    wrap: 'bg-[#FFF8E8] border-[#FFE7A4] text-[#4A2F00]',
    icon: <AlertTriangle className="size-4 text-[#A66D00]" />,
  },
  danger: {
    wrap: 'bg-[#FDEDED] border-[#F4B3B3] text-[#731414]',
    icon: <AlertCircle className="size-4 text-[#CE2121]" />,
  },
}

export function Alert({
  severity = 'info',
  title,
  children,
  className,
}: {
  severity?: Severity
  title?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const t = tone[severity]
  return (
    <div
      role="alert"
      className={`flex gap-3 rounded-[6px] border px-3.5 py-3 text-sm ${t.wrap} ${className ?? ''}`}
    >
      <div className="mt-0.5 shrink-0">{t.icon}</div>
      <div className="space-y-1 leading-relaxed">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
    </div>
  )
}
