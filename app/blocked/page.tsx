"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.scss";

interface BanInfo {
  isBlocked: boolean;
  blockedReason?: string;
  blockedUntil?: string;
  blockedBy?: string;
  blockedByName?: string;
  bannedAt?: string;
}

export default function BlockedPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoading && user && !user.isBlocked) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchBanInfo = async () => {
      const res = await fetch("/api/user/ban-info");
      const data = await res.json();
      setBanInfo(data);
    };
    fetchBanInfo();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout.mutateAsync();
    router.push("/login");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>Загрузка...</div>
      </main>
    );
  }

  if (!user?.isBlocked) {
    return null;
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.blockedCard}>
          <div className={styles.blockedIcon}>🚫</div>
          <h1 className={styles.title}>Доступ ограничен</h1>
          <p className={styles.subtitle}>Ваш аккаунт был заблокирован</p>

          <div className={styles.infoBox}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Причина блокировки:</span>
              <span className={styles.infoValue}>
                {banInfo?.blockedReason || user?.blockedReason || "Нарушение правил платформы"}
              </span>
            </div>

            {banInfo?.blockedUntil && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Блокировка до:</span>
                <span className={styles.infoValue}>
                  {formatDate(banInfo.blockedUntil)}
                </span>
              </div>
            )}

            {banInfo?.blockedByName && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Заблокировал:</span>
                <span className={styles.infoValue}>
                  {banInfo.blockedByName}
                </span>
              </div>
            )}

            {banInfo?.bannedAt && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Дата блокировки:</span>
                <span className={styles.infoValue}>
                  {formatDate(banInfo.bannedAt)}
                </span>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button onClick={() => router.push("/feed")} className={styles.feedBtn}>
              Просмотр ленты заявок
            </button>
            <button onClick={handleLogout} disabled={isLoggingOut} className={styles.logoutBtn}>
              {isLoggingOut ? "Выход..." : "🚪 Выйти из аккаунта"}
            </button>
          </div>

          <p className={styles.footerText}>
            Если вы считаете, что блокировка ошибочна, свяжитесь с поддержкой: support@localhelp.ru
          </p>
        </div>
      </div>
    </main>
  );
}