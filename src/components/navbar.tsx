"use client";

import { signOut } from "next-auth/react";

export default function Navbar() {
  return (
    <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
      <h1 className="text-xl font-bold">
        WarrantyVault AI
      </h1>

      <button
        onClick={() => signOut()}
        className="rounded-lg bg-white px-4 py-2 text-black"
      >
        Logout
      </button>
    </div>
  );
}