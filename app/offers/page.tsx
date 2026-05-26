"use client";

import { useRouter } from "next/navigation";
import { useMyOffers } from "@/hooks/useMyOffers";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.scss";

export default function MyOffersPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { offers, isLoading, error, refetch } = useMyOffers();

  if (!isAuthLoading && !user) {
    router.push("/login");
    return null;
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return { text: "Ожидает одобрения", className: styles.statusPending };
      case "approved":
        return { text: "Одобрен", className: styles.statusApproved };
      case "rejected":
        return { text: "Отклонён", className: styles.statusRejected };
      case "completed":
        return { text: "Выполнен", className: styles.statusCompleted };
      default:
        return { text: status, className: "" };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isAuthLoading || isLoading) {
    return (
      <>
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.skeletonCard}>
              <div className={styles.skeletonLine}></div>
              <div className={styles.skeletonLine}></div>
              <div className={styles.skeletonLine}></div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.errorCard}>
              <p className={styles.errorText}>Ошибка загрузки</p>
              <button onClick={() => refetch()} className={styles.retryBtn}>
                Попробовать снова
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Мои отклики</h1>
            <button onClick={() => router.push("/feed")} className={styles.feedBtn}>
              + Смотреть заявки
            </button>
          </div>

          {offers.length === 0 ? (
            <div className={styles.emptyCard}>
              <p className={styles.emptyText}>Вы ещё не откликались на заявки</p>
              <p className={styles.emptyHint}>Найдите заявку, которая вам подходит, и предложите помощь</p>
              <button onClick={() => router.push("/feed")} className={styles.emptyBtn}>
                Перейти к ленте заявок
              </button>
            </div>
          ) : (
            <div className={styles.list}>
              {offers.map((offer) => {
                const status = getStatusText(offer.status);
                const showContacts = offer.status === "approved" && offer.request.author?.phone;

                return (
                  <div
                    key={offer.id}
                    className={styles.offerCard}
                    onClick={() => router.push(`/requests/${offer.request.id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.offerHeader}>
                      <div>
                        <h3 className={styles.offerTitle}>{offer.request.title}</h3>
                        <p className={styles.offerRequestId}>Заявка #{offer.request.id.slice(0, 8)}</p>
                      </div>
                      <span className={`${styles.offerStatus} ${status.className}`}>
                        {status.text}
                      </span>
                    </div>

                    <p className={styles.offerComment}>
                      <span className={styles.commentLabel}>Ваш комментарий:</span>
                      {offer.comment}
                    </p>

                    <div className={styles.offerFooter}>
                      <span className={styles.offerDate}>
                        Отклик от {formatDate(offer.createdAt)}
                      </span>
                      {showContacts && (
                        <div className={styles.contactInfo}>
                          <span className={styles.contactIcon}>📞</span>
                          <span className={styles.contactText}>
                            Контакт заказчика: {offer.request.author.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}