"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMyRequests } from "@/hooks/useMyRequests";
import { useAuth } from "@/hooks/useAuth";
import styles from "./Requsts.module.scss";
import { useState } from "react";

interface Request {
  id: string;
  title: string;
  description: string;
  address: string;
  budget: number | null;
  deadline: number;
  status: string;
  authorId: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

// Функция для обрезки текста
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

export default function MyRequestsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"active" | "closed" | "expired">("active");
  const { requests, pagination, isLoading, error } = useMyRequests(page, 10, statusFilter);

  if (!isAuthLoading && !user) {
    router.push("/login");
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatBudget = (budget: number | null) => {
    if (!budget) return "Договорная";
    return `${budget.toLocaleString()} ₽`;
  };

  const getDeadlineText = (deadline: number) => {
    if (deadline === 3) return "3 дня";
    if (deadline === 7) return "7 дней";
    if (deadline === 30) return "30 дней";
    return `${deadline} дней`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Активна";
      case "closed": return "Закрыта";
      case "expired": return "Истекла";
      default: return status;
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.loadingGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonLine}></div>
                <div className={styles.skeletonLine}></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.errorCard}>
            <p className={styles.errorText}>Ошибка: {(error as Error).message}</p>
            <button onClick={() => window.location.reload()} className={styles.btnPrimary}>
              Попробовать снова
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Мои заявки</h1>
          <Link href="/requests/new" className={styles.createBtn}>
            + Создать заявку
          </Link>
        </div>

        <div className={styles.filters}>
          <button
            onClick={() => setStatusFilter("active")}
            className={`${styles.filterBtn} ${statusFilter === "active" ? styles.filterActive : ""}`}
          >
            Активные
          </button>
          <button
            onClick={() => setStatusFilter("closed")}
            className={`${styles.filterBtn} ${statusFilter === "closed" ? styles.filterActive : ""}`}
          >
            Закрытые
          </button>
          <button
            onClick={() => setStatusFilter("expired")}
            className={`${styles.filterBtn} ${statusFilter === "expired" ? styles.filterActive : ""}`}
          >
            Истекшие
          </button>
        </div>

        {requests.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyText}>
              {statusFilter === "active" && "У вас нет активных заявок"}
              {statusFilter === "closed" && "У вас нет закрытых заявок"}
              {statusFilter === "expired" && "У вас нет истекших заявок"}
            </p>
            <Link href="/requests/new" className={styles.emptyBtn}>
              Создать заявку
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {requests.map((request: Request) => (
                <div
                  key={request.id}
                  className={styles.card}
                  onClick={() => router.push(`/requests/${request.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(`/requests/${request.id}`);
                    }
                  }}
                >
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle} title={request.title}>
                      {truncateText(request.title, 50)}
                    </h2>
                    <span className={styles.budget}>{formatBudget(request.budget)}</span>
                  </div>
                  <p className={styles.cardDescription} title={request.description}>
                    {truncateText(request.description, 120)}
                  </p>
                  <div className={styles.cardFooter}>
                    <div className={styles.cardInfo} title={request.address}>
                      <span className={styles.infoIcon}>📍</span>
                      <span className={styles.infoText}>{truncateText(request.address, 35)}</span>
                    </div>
                    <div className={styles.cardInfo}>
                      <span className={styles.infoIcon}>⏱️</span>
                      <span className={styles.infoText}>{getDeadlineText(request.deadline)}</span>
                    </div>
                    <div className={`${styles.cardInfo} ${styles.status}`}>
                      <span className={styles.infoIcon}>📌</span>
                      <span className={styles.infoText}>{getStatusText(request.status)}</span>
                    </div>
                  </div>
                  <div className={styles.cardDate}>
                    {formatDate(request.createdAt)}
                  </div>
                </div>
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
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