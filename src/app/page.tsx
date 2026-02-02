export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">PrimeWear</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Multi-Vendor E-Commerce Platform
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            Customer Login
          </a>
          <a
            href="/vendor/login"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition"
          >
            Vendor Portal
          </a>
          <a
            href="/admin/login"
            className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition"
          >
            Admin Portal
          </a>
        </div>
      </div>
    </main>
  );
}
