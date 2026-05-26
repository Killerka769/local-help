"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import FavoriteButton from "@/app/components/FavoriteButton/FavoriteButton";
import styles from "./FeedCard.module.scss";

interface FeedCardProps {
  request: {
    id: string;
    title: string;
    description: string;
    address: string;
    budget: number | null;
    deadline: number;
    createdAt: string;
    author: {
      id: string;
      name: string;
      avatar: string | null;
    };
    city?: {
      name: string;
    };
  };
  formatBudget: (budget: number | null) => string;
  formatDate: (dateString: string) => string;
  getDeadlineText: (deadline: number) => string;
  getDeadlineClass: (deadline: number) => string;
}

// Функция для обрезки текста с добавлением "..."
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

function FeedCard({ request, formatBudget, formatDate, getDeadlineText, getDeadlineClass }: FeedCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/requests/${request.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      router.push(`/requests/${request.id}`);
    }
  };

  const getUrgencyIcon = (deadline: number) => {
    if (deadline === 3) return "🔥";
    if (deadline === 7) return "🟢";
    return "🔵";
  };

  // Обрезаем заголовок (максимум 60 символов)
  const truncatedTitle = truncateText(request.title, 60);
  // Обрезаем описание (максимум 100 символов)
  const truncatedDescription = truncateText(request.description, 100);
  // Обрезаем имя автора (максимум 20 символов)
  const truncatedAuthorName = truncateText(request.author.name, 20);
  // Обрезаем адрес (максимум 35 символов)
  const truncatedAddress = truncateText(request.address, 35);

  return (
    <div
      className={styles.card}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.cardHeader}>
        <div className={styles.titleWrapper}>
          <span className={styles.urgencyIcon}>{getUrgencyIcon(request.deadline)}</span>
          <h2 className={styles.cardTitle} title={request.title}>
            {truncatedTitle}
          </h2>
        </div>
        <div className={styles.cardActions}>
          <span className={styles.cardBudget}>{formatBudget(request.budget)}</span>
          <FavoriteButton requestId={request.id} authorId={request.author.id} size="small" />
        </div>
      </div>

      <p className={styles.cardDescription} title={request.description}>
        {truncatedDescription}
      </p>

      <div className={styles.cardMeta}>
        <div className={styles.metaItem} title={request.address}>
          <span className={styles.metaIcon}>📍</span>
          <span className={styles.metaText}>{truncatedAddress}</span>
        </div>
        <div className={`${styles.metaItem} ${getDeadlineClass(request.deadline)}`}>
          <span className={styles.metaIcon}>⏱️</span>
          <span className={styles.metaText}>{getDeadlineText(request.deadline)}</span>
        </div>
        {request.city && (
          <div className={styles.metaItem}>
            <span className={styles.metaIcon}>🏙️</span>
            <span className={styles.metaText}>{request.city.name}</span>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.author}>
          <div className={styles.authorAvatar}>
            {request.author.avatar ? (
              <img src={request.author.avatar} alt={request.author.name} />
            ) : (
              <span className={styles.authorInitial}>
                {request.author.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className={styles.authorName} title={request.author.name}>
            {truncatedAuthorName}
          </span>
        </div>
        <span className={styles.cardDate}>{formatDate(request.createdAt)}</span>
      </div>
    </div>
  );
}

export default memo(FeedCard);