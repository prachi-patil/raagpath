export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-saffron">RaagPath</h1>
        <p className="text-xl text-gray-300">
          Your Indian Classical Music Practice Companion
        </p>
        <p className="text-sm text-gray-500 mt-8">
          API: {process.env.NEXT_PUBLIC_API_URL}
        </p>
      </div>
    </main>
  )
}
