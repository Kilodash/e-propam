interface MetricCard {
  label: string
  value: number
  variant?: "default" | "warning" | "danger" | "success"
}

export default function MetricCards({ cards }: { cards: MetricCard[] }) {
  const variantStyles = {
    default: "text-white",
    warning: "text-yellow-400",
    danger: "text-red-400",
    success: "text-green-400",
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[#0F172A] rounded-lg p-4 border border-gray-700"
        >
          <p className="text-gray-400 text-sm">{card.label}</p>
          <p
            className={`text-2xl font-bold ${variantStyles[card.variant ?? "default"]}`}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
