"use client";

import { useState, useEffect } from "react";
import { useUpdateReview } from "@/hooks/useReviews";
import styles from "./EditReviewModal.module.scss";

interface EditReviewModalProps {
  reviewId: string;
  currentRating: number;
  currentComment: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditReviewModal({
  reviewId,
  currentRating,
  currentComment,
  onClose,
  onSuccess,
}: EditReviewModalProps) {
  const [rating, setRating] = useState(currentRating);
  const [comment, setComment] = useState(currentComment || "");
  const [hoverRating, setHoverRating] = useState(0);
  const { mutate, isPending, error } = useUpdateReview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { reviewId, rating, comment: comment.trim() || undefined },
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
        <h3 className={styles.title}>Редактировать отзыв</h3>

        <div className={styles.ratingSelector}>
          <span className={styles.ratingLabel}>Оценка:</span>
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
          <label htmlFor="comment" className={styles.label}>Комментарий</label>
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
            {isPending ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </div>
      </div>
    </div>
  );
}