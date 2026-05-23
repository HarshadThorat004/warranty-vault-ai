import { getServerSession } from "next-auth";

import Navbar from "@/components/navbar";

import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(
    authOptions
  );

  return (
    <div className="min-h-screen bg-black">
      <Navbar
        name={session?.user?.name}
      />

      {children}
    </div>
  );
}