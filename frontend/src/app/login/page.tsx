import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-on-surface-variant">
          Yükleniyor…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
