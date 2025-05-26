export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-light">
      <div className="max-w-md w-full space-y-8 p-4 sm-mobile:p-6 md-mobile:p-8 bg-neutral-white rounded-lg shadow-lg">
        {children}
      </div>
    </div>
  )
} 