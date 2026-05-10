"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(_prev: { error: boolean } | null, formData: FormData) {
  const password = formData.get("password");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return { error: true };
  }

  const jar = await cookies();
  jar.set("admin_session", adminPassword, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/admin");
}

export async function logout() {
  const jar = await cookies();
  jar.delete("admin_session");
  redirect("/admin/login");
}
