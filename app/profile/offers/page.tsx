"use client";

import { useRouter } from "next/navigation";
import { useMyOffers } from "@/hooks/useMyOffers";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.scss";
import { useState } from "react";

export default function MyOffersPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { offers, pagination, isLoading, error, refetch } = useMyOffers(page, statusFilter);

  // Функция удаления отклика
  const handleDeleteOffer = async (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Удалить этот отклик? Действие необратимо.")) {
      try {
        const res = await fetch(`/api/offers/${offerId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          refetch();
        } else {
          const data = await res.json();
          alert(data.error || "Ошибка при удалении");
        }
      } catch (error) {
        alert("Ошибка при удалении");
      }
    }
  };

  if (!isAuthLoading && !user) {
    router.push("/login");
    return null;
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return { text: "Ожидает", className: styles.statusPending };
      case "approved":
        return { text: "Одобрен", className: styles.statusApproved };
      case "rejected":
        return { text: "Отклонён", className: styles.statusRejected };
      case "completed_by_executor":
        return { text: "Ожидает подтверждения", className: styles.statusExecutorCompleted };
      case "completed":
        return { text: "Завершён", className: styles.statusCompleted };
      default:
        return { text: status, className: "" };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "сегодня";
    if (days === 1) return "вчера";
    if (days < 7) return `${days} дня назад`;
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  const formatBudget = (budget: number | null) => {
    if (!budget) return "Договорная";
    return `${budget.toLocaleString()} ₽`;
  };

  if (isAuthLoading || isLoading) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.skeletonList}>
            {[1, 2, 3].map((i) => (
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

  const stats = {
    total: pagination.total,
    pending: offers.filter((o) => o.status === "pending").length,
    approved: offers.filter((o) => o.status === "approved").length,
    completed: offers.filter((o) => o.status === "completed").length,
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Мои отклики</h1>
            <p className={styles.subtitle}>
              Всего откликов: <strong>{pagination.total}</strong>
            </p>
          </div>
          <button onClick={() => router.push("/feed")} className={styles.feedBtn}>
            + Смотреть заявки
          </button>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.pending}</span>
            <span className={styles.statLabel}>Ожидают</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.approved}</span>
            <span className={styles.statLabel}>Одобрены</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.completed}</span>
            <span className={styles.statLabel}>Завершены</span>
          </div>
        </div>

        <div className={styles.filters}>
          <button
            onClick={() => setStatusFilter("all")}
            className={`${styles.filterBtn} ${statusFilter === "all" ? styles.filterActive : ""}`}
          >
            Все
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`${styles.filterBtn} ${statusFilter === "pending" ? styles.filterActive : ""}`}
          >
            Ожидают
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`${styles.filterBtn} ${statusFilter === "approved" ? styles.filterActive : ""}`}
          >
            Одобрены
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`${styles.filterBtn} ${statusFilter === "completed" ? styles.filterActive : ""}`}
          >
            Завершены
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`${styles.filterBtn} ${statusFilter === "rejected" ? styles.filterActive : ""}`}
          >
            Отклонены
          </button>
        </div>

        {offers.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyText}>
              {statusFilter === "all"
                ? "Вы ещё не откликались на заявки"
                : `Нет откликов со статусом "${statusFilter}"`}
            </p>
            <button onClick={() => router.push("/feed")} className={styles.emptyBtn}>
              Смотреть заявки
            </button>
          </div>
        ) : (
          <>
            <div className={styles.list}>
              {offers.map((offer) => {
                const status = getStatusText(offer.status);
                const showContacts = offer.status === "approved" && offer.request.author?.phone;
                const canDelete = offer.status === "pending" || offer.status === "rejected";

                return (
                  <div
                    key={offer.id}
                    className={styles.offerCard}
                    onClick={() => router.push(`/offers/${offer.id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.offerHeader}>
                      <div className={styles.offerTitleSection}>
                        <h3 className={styles.offerTitle}>{offer.request.title}</h3>
                        <span className={styles.offerBudget}>
                          {formatBudget(offer.request.budget)}
                        </span>
                      </div>
                      <div className={styles.offerStatusWrapper}>
                        <span className={`${styles.offerStatus} ${status.className}`}>
                          {status.text}
                        </span>
                        {canDelete && (
                          <button
                            onClick={(e) => handleDeleteOffer(offer.id, e)}
                            className={styles.deleteOfferBtn}
                            title="Удалить отклик"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    <p className={styles.offerComment}>
                      <span className={styles.commentLabel}>Ваш комментарий:</span>
                      {offer.comment.length > 100
                        ? `${offer.comment.slice(0, 100)}...`
                        : offer.comment}
                    </p>

                    <div className={styles.offerMeta}>
                      <span className={styles.metaItem}>📍 {offer.request.address}</span>
                      <span className={styles.metaItem}>📅 {formatDate(offer.createdAt)}</span>
                    </div>

                    <div className={styles.offerFooter}>
                      {showContacts && (
                        <div className={styles.contactInfo}>
                          📞 Контакт заказчика: {offer.request.author.phone}
                        </div>
                      )}
                      {offer.status === "pending" && (
                        <div className={styles.waitingBadge}>Ожидает ответа заказчика</div>
                      )}
                      {offer.status === "approved" && (
                        <div className={styles.actionBadge}>✅ Приступайте к работе</div>
                      )}
                    </div>
                  </div>
                );
              })}
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