"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.scss";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [page, setPage] = useState(1);
  const { notifications, pagination, unreadCount, isLoading, error, markAsRead } =
    useNotifications(page);

  // Защита страницы
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "только что";
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays === 1) return "вчера";
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAsRead.mutate("all");
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.skeletonList}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonLine}></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Уведомления</h1>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className={styles.markAllBtn}>
              Прочитать всё
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyText}>У вас нет уведомлений</p>
            <Link href="/feed" className={styles.emptyBtn}>
              Перейти к ленте заявок
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.list}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`${styles.notificationCard} ${!notif.isRead ? styles.unread : ""}`}
                  onClick={() => handleNotificationClick(notif)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.notificationContent}>
                    <h3 className={styles.notificationTitle}>{notif.title}</h3>
                    <p className={styles.notificationMessage}>{notif.message}</p>
                    <span className={styles.notificationDate}>
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>
                  {!notif.isRead && <div className={styles.unreadDot} />}
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={styles.pageBtn}
                >
                  ← Назад
                </button>
                <span className={styles.pageInfo}>
                  Страница {page} из {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className={styles.pageBtn}
                >
                  Вперед →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}