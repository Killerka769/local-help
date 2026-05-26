"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.scss";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Неверная ссылка восстановления");
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен быть минимум 6 символов");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка сброса пароля");
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.card}>
        <div className={styles.errorMessage}>Неверная ссылка восстановления</div>
        <Link href="/forgot-password" className={styles.link}>
          Запросить новую ссылку
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.card}>
        <div className={styles.successMessage}>
          ✅ Пароль успешно изменён!
        </div>
        <p>Через 3 секунды вы будете перенаправлены на страницу входа</p>
        <Link href="/login" className={styles.link}>
          Перейти сейчас
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Сброс пароля</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label>Новый пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 6 символов"
            required
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label>Подтвердите пароль</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            className={styles.input}
          />
        </div>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <button type="submit" disabled={isLoading} className={styles.submitBtn}>
          {isLoading ? "Сохранение..." : "Сохранить пароль"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Suspense fallback={<div className={styles.card}>Загрузка...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}