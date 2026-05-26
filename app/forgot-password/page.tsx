"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.scss";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка отправки");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Восстановление пароля</h1>
          <p className={styles.subtitle}>
            Введите email, указанный при регистрации
          </p>

          {success ? (
            <div className={styles.successMessage}>
              ✅ На вашу почту отправлена ссылка для восстановления пароля
              <br />
              <Link href="/login" className={styles.link}>
                Вернуться ко входу
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.ru"
                  required
                  className={styles.input}
                />
              </div>
              {error && <div className={styles.errorMessage}>{error}</div>}
              <button
                type="submit"
                disabled={isLoading}
                className={styles.submitBtn}
              >
                {isLoading ? "Отправка..." : "Отправить ссылку"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}