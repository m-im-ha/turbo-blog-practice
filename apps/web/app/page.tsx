"use client";

import { useSession } from "next-auth/react";

export default function Home() {
  const {data:session} = useSession();

  return (
    <div>
      <h1 className="text-4xl text-center">home page</h1>
      <h2>{`welcome ${session?.user?.name}`}</h2>
    </div>
  );
}
