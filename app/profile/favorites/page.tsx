"use client";

import { useRouter } from "next/navigation";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import FavoriteButton from "@/app/components/FavoriteButton/FavoriteButton";
import styles from "./page.module.scss";

export default function FavoritesPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { favorites, isLoading, error } = useFavorites();

  if (!isAuthLoading && !user) {
    router.push("/login");
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatBudget = (budget: number | null) => {
    if (!budget) return "Договорная";
    return `${budget.toLocaleString()} ₽`;
  };

  if (isAuthLoading || isLoading) {
    return (
      <>
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.skeletonList}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonTitle}></div>
                  <div className={styles.skeletonLine}></div>
                </div>
              ))}
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
            <h1 className={styles.title}>Избранное</h1>
            <p className={styles.subtitle}>
              {favorites.length === 0
                ? "У вас нет сохранённых заявок"
                : `${favorites.length} сохранённых заявок`}
            </p>
          </div>

          {favorites.length === 0 ? (
            <div className={styles.emptyCard}>
              <p className={styles.emptyText}>Вы ещё не добавили заявки в избранное</p>
              <button onClick={() => router.push("/feed")} className={styles.emptyBtn}>
                Смотреть заявки
              </button>
            </div>
          ) : (
            <div className={styles.list}>
              {favorites.map(({ request }) => (
                <div
                  key={request.id}
                  className={styles.card}
                  onClick={() => router.push(`/requests/${request.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{request.title}</h3>
                    <div className={styles.cardActions}>
                      <span className={styles.cardBudget}>{formatBudget(request.budget)}</span>
                      <FavoriteButton requestId={request.id} authorId={request.author.id} size="small" />
                    </div>
                  </div>
                  <p className={styles.cardDescription}>
                    {request.description.length > 100
                      ? `${request.description.slice(0, 100)}...`
                      : request.description}
                  </p>
                  <div className={styles.cardMeta}>
                    <span>📍 {request.address}</span>
                    <span>👤 {request.author.name}</span>
                    <span>📅 {formatDate(request.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}