"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  physicians: { id: string; name: string }[];
  current: string;
};

export default function PhysicianSelect({ physicians, current }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("physician", e.target.value);
    } else {
      params.delete("physician");
    }
    const qs = params.toString();
    router.push(qs ? `/admin?${qs}` : "/admin");
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="px-3 py-2 rounded-lg text-sm border border-border bg-white text-foreground hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors cursor-pointer"
    >
      <option value="">All doctors</option>
      {physicians.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
