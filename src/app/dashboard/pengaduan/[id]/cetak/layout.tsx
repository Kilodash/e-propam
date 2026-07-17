export default function CetakLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @media print {
          html, body { margin: 0; padding: 0; background: white; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>
      {children}
    </>
  )
}
