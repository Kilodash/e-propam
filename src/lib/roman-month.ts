export const ROMAN: Record<number, string> = {
  1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
  7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII",
}

export function toRoman(month: number): string {
  return ROMAN[month] ?? String(month)
}

export function getRomanMonths(): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${ROMAN[i + 1]} (${new Date(2024, i, 1).toLocaleString('id', { month: 'long' })})`,
  }))
}
