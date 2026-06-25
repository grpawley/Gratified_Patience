import { createClient } from "@/lib/supabase/server";
import { WantForm } from "@/components/want-form";

export default async function NewWantPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-[#3D3D3D]">What caught your eye?</h1>
        <p className="text-sm text-[#B8C4B8] mt-1">
          Log it. Give it time. Decide with intention.
        </p>
      </div>
      <WantForm profile={profile} />
    </div>
  );
}
