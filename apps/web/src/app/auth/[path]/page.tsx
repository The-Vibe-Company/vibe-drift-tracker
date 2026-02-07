import { AuthView } from "@neondatabase/auth/react";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ path: "sign-in" }, { path: "sign-up" }, { path: "sign-out" }];
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <AuthView path={path} />
    </main>
  );
}
