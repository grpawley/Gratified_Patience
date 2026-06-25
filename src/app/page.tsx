import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="max-w-lg">
        <h1 className="text-5xl font-light tracking-wide text-[#3D3D3D] mb-4">
          Gratified Patience
        </h1>
        <p className="text-lg text-[#B8C4B8] mb-2">
          Authorship over desire.
        </p>
        <p className="text-lg text-[#B8C4B8] mb-10">
          Intention over impulse. Confidence over urgency.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-[#7C9A82] text-white rounded-lg hover:bg-[#6b8870] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 border border-[#7C9A82] text-[#7C9A82] rounded-lg hover:bg-[#7C9A82]/10 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </main>
  );
}
