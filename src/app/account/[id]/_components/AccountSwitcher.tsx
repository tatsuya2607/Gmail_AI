"use client";

import { useRouter } from "next/navigation";

interface Account {
  id: string;
  email: string;
}

interface Props {
  accounts: Account[];
  currentId: string;
}

export function AccountSwitcher({ accounts, currentId }: Props) {
  const router = useRouter();

  return (
    <select
      value={currentId}
      onChange={(e) =>
        router.push(`/account/${encodeURIComponent(e.target.value)}`)
      }
      className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.email}
        </option>
      ))}
    </select>
  );
}
