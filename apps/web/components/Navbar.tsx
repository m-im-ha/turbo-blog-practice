"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "./components/ui/button";

const Navbar = () => {
  const { status } = useSession();

  function handleLogout() {
    signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="mt-2">
      {status !== "authenticated" && (
        <div className="flex gap-4 justify-center items-center">
          <Link href="/">Logo</Link>
          <Link href="/blogs">Blogs</Link>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </div>
      )}
      {status === "authenticated" && (
        <div className="flex gap-4 justify-center items-center">
          <Link href="/">Logo</Link>
          <Link href="/blogs">Blogs</Link>
          <Link href="/create-blog">Create blog</Link>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      )}
    </div>
  );
};

export default Navbar;
