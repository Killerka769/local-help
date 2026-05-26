"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import styles from "./NotificationBell.module.scss";

export default function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "только что";
    if (hours < 24) return `${hours} ч назад`;
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead.mutate(notification.id);
    if (notification.link) {
      router.push(notification.link);
    }
    setIsOpen(false);
  };

  return (
    <div className={styles.bellContainer} ref={dropdownRef}>
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Уведомления"
      >
        🔔
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span>Уведомления</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead.mutate("all")}
                className={styles.markAllBtn}
              >
                Прочитать всё
              </button>
            )}
          </div>

          {isLoading ? (
            <div className={styles.loading}>Загрузка...</div>
          ) : notifications.length === 0 ? (
            <div className={styles.empty}>Нет уведомлений</div>
          ) : (
            <div className={styles.list}>
              {notifications.slice(0, 10).map((notif) => (
                <div
                  key={notif.id}
                  className={`${styles.item} ${!notif.isRead ? styles.unread : ""}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className={styles.itemTitle}>{notif.title}</div>
                  <div className={styles.itemMessage}>{notif.message}</div>
                  <div className={styles.itemDate}>{formatDate(notif.createdAt)}</div>
                </div>
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <div className={styles.footer}>
              <button onClick={() => router.push("/profile/notifications")} className={styles.viewAllBtn}>
                Все уведомления
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}