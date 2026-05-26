"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.scss";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      router.push("/settings?emailError=invalid");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/user/verify-email?token=${token}`);
        if (res.ok) {
          router.push("/settings?emailVerified=true");
        } else {
          const data = await res.json();
          router.push(`/settings?emailError=${data.error || "invalid"}`);
        }
      } catch (error) {
        router.push("/settings?emailError=server");
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Подтверждение email</h1>
        <p>Пожалуйста, подождите...</p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className={styles.main}>
      <Suspense fallback={<div className={styles.card}>Загрузка...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}