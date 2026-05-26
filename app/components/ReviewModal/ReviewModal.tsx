"use client";

import { useState } from "react";
import { useCreateReview } from "@/hooks/useReviews";
import styles from "./ReviewModal.module.scss";

interface ReviewModalProps {
  toUserId: string;
  requestId: string;
  requestTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ toUserId, requestId, requestTitle, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const { mutate, isPending, error } = useCreateReview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { toUserId, requestId, rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      }
    );
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Оцените выполнение заявки</h3>
        <p className={styles.requestTitle}>Заявка: {requestTitle}</p>

        <div className={styles.ratingSelector}>
          <span className={styles.ratingLabel}>Ваша оценка:</span>
          <div className={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`${styles.star} ${star <= (hoverRating || rating) ? styles.starActive : ""}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className={styles.commentField}>
          <label htmlFor="comment" className={styles.label}>Комментарий (необязательно)</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Расскажите о впечатлениях от работы..."
            rows={4}
            className={styles.textarea}
          />
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error.message}
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelBtn} disabled={isPending}>
            Отмена
          </button>
          <button onClick={handleSubmit} disabled={isPending} className={styles.submitBtn}>
            {isPending ? "Отправка..." : "Отправить отзыв"}
          </button>
        </div>
      </div>
    </div>
  );
}