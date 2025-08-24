import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  description?: string
  trend?: string
  trendUp?: boolean
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendUp,
}: StatsCardProps) {
  return (
    <div className="bg-stone-50/50 rounded-xl p-4 border border-stone-200/60 hover:shadow-sm transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-stone-100 rounded-lg">
          <Icon className="h-5 w-5 text-stone-600" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            trendUp ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          )}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-stone-500 mb-1">{title}</h3>
        <p className="text-2xl font-serif font-semibold text-stone-800">{value}</p>
        {description && (
          <p className="text-xs text-stone-400 mt-1.5">{description}</p>
        )}
      </div>
    </div>
  )
}
