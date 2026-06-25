import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-light text-[#3D3D3D]">Stoa</h1>
          <p className="mt-2 text-sm text-[#B8C4B8]">Sign in to your account</p>
        </div>
        <AuthForm mode="login" />
        <p className="text-center text-sm text-[#B8C4B8]">
          No account?{" "}
          <Link href="/signup" className="text-[#7C9A82] hover:underline">
            Get started
          </Link>
        </p>
      </div>
    </main>
  );
}
