// Copyright (c) Said Borna. All rights reserved.
import { redirect } from "next/navigation";

/**
 * Root page — redirects to dashboard.
 */
export default function Home() {
  redirect("/dashboard");
}
