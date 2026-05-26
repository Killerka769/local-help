"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import styles from "./ComplaintButton.module.scss";

interface ComplaintButtonProps {
  targetType: "request" | "offer" | "user";
  targetId: string;
  authorId?: string;
  onSuccess?: () => void;
}

const REASON_OPTIONS = {
  request: [
    "Спам или реклама",
    "Оскорбления или грубость",
    "Мошенничество",
    "Нецензурная лексика",
    "Не по теме",
    "Другое",
  ],
  offer: [
    "Спам или реклама",
    "Оскорбления или грубость",
    "Мошенничество",
    "Нецензурная лексика",
    "Не по теме",
    "Другое",
  ],
  user: [
    "Спам или реклама",
    "Оскорбления или грубость",
    "Мошенничество",
    "Нецензурная лексика",
    "Неприемлемое поведение",
    "Фейковый аккаунт",
    "Другое",
  ],
};

export default function ComplaintButton({
  targetType,
  targetId,
  authorId,
  onSuccess,
}: ComplaintButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!user) return null;
  if (authorId === user.id) return null;

  const reasonOptions = REASON_OPTIONS[targetType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError("Выберите причину");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка отправки жалобы");
      }

      setSuccess(true);
      setReason("");
      setDescription("");
      onSuccess?.();

      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.complaintBtn}
        title="Пожаловаться"
      >
        ⚠️
      </button>

      {isOpen && (
        <div className={styles.modal} onClick={() => setIsOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                Пожаловаться на{" "}
                {targetType === "request" && "заявку"}
                {targetType === "offer" && "отклик"}
                {targetType === "user" && "пользователя"}
              </h3>
              <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                ✕
              </button>
            </div>

            {success ? (
              <div className={styles.successMessage}>
                Жалоба отправлена. Спасибо, что помогаете делать сервис лучше!
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label>Причина жалобы</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className={styles.select}
                  >
                    <option value="">Выберите причину</option>
                    {reasonOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label>Описание (необязательно)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Дополнительные детали..."
                    rows={3}
                    className={styles.textarea}
                  />
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <div className={styles.actions}>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className={styles.cancelBtn}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.submitBtn}
                  >
                    {isSubmitting ? "Отправка..." : "Отправить жалобу"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}