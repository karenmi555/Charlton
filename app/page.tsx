import { LandingForm } from "@/components/landing/LandingForm";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-5xl font-bold text-ink">The apartment</h1>
          <p className="text-ink-soft mt-1 text-sm">Shared calendar</p>
        </div>
        <LandingForm />
      </div>
    </main>
  );
}
