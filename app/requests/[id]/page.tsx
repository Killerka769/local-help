"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.scss";
import { useState, useEffect, use } from "react";
import ComplaintButton from "@/app/components/ComplaintButton/ComplaintButton";
import ReviewModal from "@/app/components/ReviewModal/ReviewModal";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Offer {
  id: string;
  comment: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    phone?: string;
  };
  canApprove?: boolean;
}

interface RequestData {
  id: string;
  title: string;
  description: string;
  address: string;
  budget: number | null;
  deadline: number;
  status: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    phone?: string;
    description: string | null;
  };
  offers: Offer[];
  canOffer: boolean;
  isAuthor: boolean;
  hasUserReviewed?: boolean;
}

export default function RequestPage({ params }: PageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ userId: string; requestId: string; title: string } | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    address: "",
    budget: "",
    deadline: "7",
  });

  const { id: requestId } = use(params);

  const { data: request, isLoading, error } = useQuery<RequestData>({
    queryKey: ["request", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка загрузки");
      }
      return res.json();
    },
    enabled: !!requestId,
  });

  const offerMutation = useMutation({
    mutationFn: async (comment: string) => {
      const res = await fetch(`/api/requests/${requestId}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["request", requestId] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const res = await fetch(`/api/offers/${offerId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["request", requestId] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["request", requestId] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["request", requestId] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] }); 
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });  
      queryClient.invalidateQueries({ queryKey: ["feed"] });        
      queryClient.invalidateQueries({ queryKey: ["request", requestId] }); 
      router.push("/requests");
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  useEffect(() => {
    if (request && request.isAuthor) {
      setEditForm({
        title: request.title,
        description: request.description,
        address: request.address,
        budget: request.budget?.toString() || "",
        deadline: request.deadline.toString(),
      });
    }
  }, [request]);

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
      case "pending":
        return { text: "Ожидает", className: styles.statusPending };
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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      title: editForm.title,
      description: editForm.description,
      address: editForm.address,
      budget: editForm.budget || undefined,
      deadline: parseInt(editForm.deadline),
    });
  };

  const handleDelete = () => {
    if (confirm("Вы уверены, что хотите удалить заявку? Это действие нельзя отменить.")) {
      deleteMutation.mutate();
    }
  };

  const handleComplete = () => {
    if (confirm("Подтвердите выполнение заявки. После этого изменить будет нельзя.")) {
      completeMutation.mutate();
    }
  };

  const canLeaveReview = () => {
    if (!request || request.status !== "closed") return false;
    if (!user) return false;
    if (request.hasUserReviewed) return false;
    
    const isAuthor = request.author.id === user.id;
    const hasCompletedOffer = request.offers.some(
      (offer) => offer.status === "completed" && offer.user.id === user.id
    );
    
    if (!isAuthor && !hasCompletedOffer) return false;
    return true;
  };
  
  const getReviewTarget = () => {
    if (!request || !user) return null;
    
    const isAuthor = request.author.id === user.id;
    if (isAuthor) {
      const completedOffer = request.offers.find((offer) => offer.status === "completed");
      if (completedOffer) {
        return {
          userId: completedOffer.user.id,
          requestId: request.id,
          title: request.title,
        };
      }
    } else {
      const hasCompletedOffer = request.offers.some(
        (offer) => offer.status === "completed" && offer.user.id === user.id
      );
      if (hasCompletedOffer) {
        return {
          userId: request.author.id,
          requestId: request.id,
          title: request.title,
        };
      }
    }
    return null;
  };

  if (isLoading) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.skeletonCard}>
            <div className={styles.skeletonTitle}></div>
            <div className={styles.skeletonLine}></div>
            <div className={styles.skeletonLine}></div>
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

  if (!request) return null;

  const hasApprovedOffer = request.offers.some((o) => o.status === "approved");
  const hasUserOffered = request.offers.some((offer) => offer.user.id === user?.id);
  const canOfferNow = request.canOffer && user && !request.isAuthor && request.status === "active" && !hasUserOffered;
  const reviewTargetData = getReviewTarget();

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Заголовок с жалобой */}
          <div className={styles.headerWrapper}>
            <div className={styles.headerLeft}>
              <ComplaintButton
                targetType="request"
                targetId={request.id}
                authorId={request.author.id}
              />
            </div>
            <div className={styles.headerRight}>
              <h1 className={styles.title}>{request.title}</h1>
              <span className={styles.budget}>{formatBudget(request.budget)}</span>
            </div>
          </div>

          <div className={styles.info}>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>📍</span>
              <span>{request.address}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>⏱️</span>
              <span>{getDeadlineText(request.deadline)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>📅</span>
              <span>{formatDate(request.createdAt)}</span>
            </div>
          </div>

          <div className={styles.authorCard}>
            <div
              className={styles.authorAvatar}
              onClick={() => router.push(`/profile/${request.author.id}`)}
              role="button"
              tabIndex={0}
            >
              {request.author.avatar ? (
                <img src={request.author.avatar} alt={request.author.name} />
              ) : (
                <div className={styles.authorPlaceholder}>
                  {request.author.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className={styles.authorInfo}>
              <div
                className={styles.authorName}
                onClick={() => router.push(`/profile/${request.author.id}`)}
                role="button"
                tabIndex={0}
              >
                {request.author.name}
              </div>
              <div className={styles.authorDesc}>
                {request.author.description || "Без описания"}
              </div>
              {request.isAuthor && request.author.phone && (
                <div className={styles.authorPhone}>📞 {request.author.phone}</div>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Описание</h2>
            <p className={styles.description}>{request.description}</p>
          </div>

          {request.isAuthor && request.status === "active" && !isEditing && (
            <div className={styles.actionButtons}>
              <button onClick={() => setIsEditing(true)} className={styles.editBtn}>
                ✏️ Редактировать
              </button>
              <button onClick={handleDelete} className={styles.deleteBtn} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Удаление..." : "🗑️ Удалить"}
              </button>
            </div>
          )}

          {request.isAuthor && request.status === "active" && hasApprovedOffer && (
            <button
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className={styles.completeBtn}
            >
              {completeMutation.isPending ? "Завершение..." : "✅ Заявка выполнена"}
            </button>
          )}

          {canLeaveReview() && reviewTargetData && (
            <button
              onClick={() => {
                setReviewTarget(reviewTargetData);
                setShowReviewModal(true);
              }}
              className={styles.reviewBtn}
            >
              ⭐ Оставить отзыв
            </button>
          )}

          {request.isAuthor && isEditing && (
            <form onSubmit={handleEditSubmit} className={styles.editForm}>
              <div className={styles.field}>
                <label>Заголовок</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label>Описание</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  required
                  rows={5}
                  className={styles.textarea}
                />
              </div>
              <div className={styles.field}>
                <label>Адрес</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Бюджет (₽)</label>
                  <input
                    type="number"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label>Срок</label>
                  <select
                    value={editForm.deadline}
                    onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                    className={styles.select}
                  >
                    <option value="3">3 дня</option>
                    <option value="7">7 дней</option>
                    <option value="30">30 дней</option>
                  </select>
                </div>
              </div>
              <div className={styles.editButtons}>
                <button type="submit" className={styles.saveBtn} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Сохранение..." : "💾 Сохранить"}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className={styles.cancelBtn}>
                  Отмена
                </button>
              </div>
            </form>
          )}

          {canOfferNow && (
            <div className={styles.offerForm}>
              <h2 className={styles.sectionTitle}>Откликнуться</h2>
              <div className={styles.offerFormWrapper}>
                <textarea
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    setCharCount(e.target.value.length);
                  }}
                  placeholder="Напишите, чем вы можете помочь..."
                  className={styles.textarea}
                  rows={4}
                  maxLength={1000}
                />
                <div className={styles.offerFormFooter}>
                  <span className={styles.charCount}>
                    {comment.length}/1000 символов
                  </span>
                  <div className={styles.offerActions}>
                    <div className={styles.checkboxField}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className={styles.checkbox}
                        />
                        <span>
                          Я принимаю{" "}
                          <Link href="/terms" target="_blank" className={styles.termsLink}>
                            пользовательское соглашение
                          </Link>
                        </span>
                      </label>
                    </div>
                    <button
                      onClick={() => offerMutation.mutate(comment)}
                      disabled={!comment.trim() || comment.length < 60 || !termsAccepted || offerMutation.isPending}
                      className={styles.submitBtn}
                    >
                      {offerMutation.isPending ? "Отправка..." : "Предложить помощь"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!canOfferNow && user && !request.isAuthor && request.status === "active" && hasUserOffered && (
            <div className={styles.alreadyOfferedMessage}>
              <p>✅ Вы уже откликнулись на эту заявку</p>
            </div>
          )}

        {request.isAuthor && request.offers.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Отклики ({request.offers.length})</h2>
            <div className={styles.offersList}>
              {request.offers.map((offer: Offer) => {
                const status = getStatusText(offer.status);
                const showContacts = offer.status === "approved";

                return (
                  <div
                    key={offer.id}
                    className={styles.offerCard}
                    onClick={() => router.push(`/offers/${offer.id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.offerHeader}>
                      <div className={styles.offerUser}>
                        <div
                          className={styles.offerAvatar}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/profile/${offer.user.id}`);
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          {offer.user.avatar ? (
                            <img src={offer.user.avatar} alt={offer.user.name} />
                          ) : (
                            <div className={styles.offerPlaceholder}>
                              {offer.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div
                            className={styles.offerName}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/profile/${offer.user.id}`);
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            {offer.user.name}
                          </div>
                          {showContacts && offer.user.phone && (
                            <div className={styles.offerPhone}>📞 {offer.user.phone}</div>
                          )}
                        </div>
                      </div>
                      <div className={styles.offerRight}>
                        <span className={`${styles.offerStatus} ${status.className}`}>
                          {status.text}
                        </span>
                        {/* Кнопка жалобы с остановкой всплытия */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <ComplaintButton
                            targetType="offer"
                            targetId={offer.id}
                            authorId={offer.user.id}
                          />
                        </div>
                      </div>
                    </div>
                    <p className={styles.offerComment}>{offer.comment}</p>
                    {offer.canApprove && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          approveMutation.mutate(offer.id);
                        }}
                        disabled={approveMutation.isPending}
                        className={styles.approveBtn}
                      >
                        Одобрить
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </div>

      {showReviewModal && reviewTarget && (
        <ReviewModal
          toUserId={reviewTarget.userId}
          requestId={reviewTarget.requestId}
          requestTitle={reviewTarget.title}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setShowReviewModal(false);
            queryClient.invalidateQueries({ queryKey: ["request", requestId] });
            queryClient.invalidateQueries({ queryKey: ["user", reviewTarget.userId] });
          }}
        />
      )}
    </main>
  );
}