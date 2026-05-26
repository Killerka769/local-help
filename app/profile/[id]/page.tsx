"use client";

import { useParams, useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useUserReviews, useDeleteReview } from "@/hooks/useReviews";
import ComplaintButton from "@/app/components/ComplaintButton/ComplaintButton";
import EditReviewModal from "@/app/components/EditReviewModal/EditReviewModal";
import styles from "./page.module.scss";
import { useState } from "react";
import Link from "next/link";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    avatar: string | null;
  };
  request: {
    id: string;
    title: string;
  };
}

interface ActiveRequest {
  id: string;
  title: string;
  description: string;
  address: string;
  budget: number | null;
  deadline: number;
  status: string;
  createdAt: string;
  city: { name: string } | null;
  _count: {
    offers: number;
  };
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params.id as string;
  const { user, activeRequests, isLoading, error } = useUserProfile(userId);
  const [activeTab, setActiveTab] = useState<"info" | "reviews" | "requests">("info");
  const [reviewsPage, setReviewsPage] = useState(1);
  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useUserReviews(userId, reviewsPage);
  const deleteReviewMutation = useDeleteReview();
  
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isOwnProfile = currentUser?.id === userId;
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState("");
  const [isBanning, setIsBanning] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "сегодня";
    if (diffDays === 1) return "вчера";
    if (diffDays < 7) return `${diffDays} дня назад`;
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
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

  const handleDeleteReview = async (reviewId: string) => {
    if (confirm("Удалить этот отзыв?")) {
      try {
        await deleteReviewMutation.mutateAsync(reviewId);
        refetchReviews();
      } catch (err) {
        alert("Ошибка при удалении");
      }
    }
  };

  const openEditModal = (review: Review) => {
    setEditingReview(review);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingReview(null);
    setIsEditModalOpen(false);
  };

  const handleEditSuccess = () => {
    refetchReviews();
  };

  const handleBanUser = async () => {
    if (!banReason.trim()) {
      alert("Укажите причину блокировки");
      return;
    }
    setIsBanning(true);
    try {
      const res = await fetch(`/api/admin/users/${user?.id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: banReason, days: banDays ? parseInt(banDays) : null }),
      });
      if (res.ok) {
        alert("Пользователь заблокирован");
        setShowBanModal(false);
        setBanReason("");
        setBanDays("");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Ошибка блокировки");
      }
    } catch (error) {
      alert("Ошибка при блокировке");
    } finally {
      setIsBanning(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!confirm("Разблокировать пользователя?")) return;
    try {
      const res = await fetch(`/api/admin/users/${user?.id}/ban`, { method: "DELETE" });
      if (res.ok) {
        alert("Пользователь разблокирован");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Ошибка разблокировки");
      }
    } catch (error) {
      alert("Ошибка при разблокировке");
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return (
      <span className={styles.stars}>
        {"★".repeat(fullStars)}{"☆".repeat(emptyStars)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.skeletonCard}>
            <div className={styles.skeletonAvatar}></div>
            <div className={styles.skeletonLine}></div>
            <div className={styles.skeletonLine}></div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.errorCard}>
            <p className={styles.errorText}>Пользователь не найден</p>
            <button onClick={() => router.back()} className={styles.backBtn}>
              Назад
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Шапка профиля */}
          <div className={styles.profileHeader}>
            <div className={styles.avatarWrapper}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.nameRow}>
                <h1 className={styles.title}>{user.name}</h1>
                {user.role === "SUPER_ADMIN" && (
                  <span className={styles.superAdminBadge}>SUPER ADMIN</span>
                )}
                {user.role === "ADMIN" && (
                  <span className={styles.adminBadge}>ADMIN</span>
                )}
              </div>
              <p className={styles.city}>📍 {user.cityName}</p>
              {!user?.emailVerified && (
                <div className={styles.verificationWarning}>
                  <span>⚠️</span>
                  <span>Email не подтверждён</span>
                </div>
              )}
              <div className={styles.ratingRow}>
                <span className={styles.ratingValue}>{user.rating?.toFixed(1) || "0"}</span>
                {renderStars(user.rating || 0)}
                <span className={styles.ratingCount}>
                  {reviewsData?.totalReviews || 0} отзывов
                </span>
              </div>
              <p className={styles.joinDate}>
                На сайте с {formatDate(user.createdAt)}
              </p>
            </div>
            {!isOwnProfile && (
              <div className={styles.profileActions}>
                <ComplaintButton
                  targetType="request"
                  targetId={user.id}
                  authorId={user.id}
                />
              </div>
            )}
          </div>

          {/* Блок блокировки */}
          {user.isBlocked && (
            <div className={styles.bannedInfo}>
              <div className={styles.bannedIcon}>🚫</div>
              <div className={styles.bannedContent}>
                <h4>Пользователь заблокирован</h4>
                <p><strong>Причина:</strong> {user.blockedReason || "Нарушение правил платформы"}</p>
                {user.blockedUntil && (
                  <p><strong>Блокировка до:</strong> {new Date(user.blockedUntil).toLocaleDateString()}</p>
                )}
                {user.blockedByName && (
                  <p><strong>Заблокировал:</strong> {user.blockedByName}</p>
                )}
                <p className={styles.bannedNote}>
                  Заблокированный пользователь не может создавать заявки и отклики
                </p>
              </div>
            </div>
          )}

          {/* Статистика */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user.completedCount}</span>
              <span className={styles.statLabel}>Выполнено</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user._count.requests}</span>
              <span className={styles.statLabel}>Заявок</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user._count.offers}</span>
              <span className={styles.statLabel}>Откликов</span>
            </div>
          </div>

          {/* Вкладки */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "info" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("info")}
            >
              ℹ️ О пользователе
            </button>
            <button
              className={`${styles.tab} ${activeTab === "reviews" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              ⭐ Отзывы ({reviewsData?.totalReviews || 0})
            </button>
            <button
              className={`${styles.tab} ${activeTab === "requests" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              📝 Заявки ({activeRequests.length})
            </button>
          </div>

          <div className={styles.tabContent}>
            {/* Вкладка "О пользователе" */}
            {activeTab === "info" && (
              <>
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>О себе</h2>
                  <p className={styles.description}>
                    {user.description || "Пользователь пока ничего не рассказал о себе"}
                  </p>
                </div>

                {isAdmin && !user.isBlocked && !isOwnProfile && (
                  <div className={styles.adminActions}>
                    <button onClick={() => setShowBanModal(true)} className={styles.banBtn}>
                      🔨 Заблокировать пользователя
                    </button>
                  </div>
                )}

                {isAdmin && user.isBlocked && !isOwnProfile && (
                  <div className={styles.adminActions}>
                    <button onClick={handleUnbanUser} className={styles.unbanBtn}>
                      🔓 Разблокировать пользователя
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Вкладка "Отзывы" */}
            {activeTab === "reviews" && (
              <div className={styles.reviewsSection}>
                {reviewsLoading ? (
                  <div className={styles.reviewsLoading}>Загрузка отзывов...</div>
                ) : !reviewsData?.reviews?.length ? (
                  <div className={styles.emptyReviews}>
                    <p>У пользователя пока нет отзывов</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.reviewsList}>
                      {reviewsData.reviews.map((review: Review) => (
                        <div key={review.id} className={styles.reviewCard}>
                          <div className={styles.reviewHeader}>
                            <div className={styles.reviewAuthor}>
                              <div 
                                className={styles.reviewAuthorAvatar}
                                onClick={() => router.push(`/profile/${review.fromUser.id}`)}
                              >
                                {review.fromUser.avatar ? (
                                  <img src={review.fromUser.avatar} alt={review.fromUser.name} />
                                ) : (
                                  <span>{review.fromUser.name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <div 
                                  className={styles.reviewAuthorName}
                                  onClick={() => router.push(`/profile/${review.fromUser.id}`)}
                                >
                                  {review.fromUser.name}
                                </div>
                                <div className={styles.reviewDate}>
                                  {formatReviewDate(review.createdAt)}
                                </div>
                              </div>
                            </div>
                            <div className={styles.reviewRating}>
                              {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                            </div>
                          </div>
                          {review.comment && <p className={styles.reviewComment}>{review.comment}</p>}
                          <div className={styles.reviewRequest}>
                            <span className={styles.reviewRequestLabel}>Заявка:</span>
                            <Link href={`/requests/${review.request.id}`} className={styles.reviewRequestLink}>
                              {review.request.title}
                            </Link>
                          </div>
                          <div className={styles.reviewActions}>
                            {currentUser?.id === review.fromUser.id && (
                              <button onClick={() => openEditModal(review)} className={styles.editReviewBtn}>
                                ✏️ Редактировать
                              </button>
                            )}
                            {isSuperAdmin && (
                              <button 
                                onClick={() => handleDeleteReview(review.id)} 
                                className={styles.deleteReviewBtn}
                                disabled={deleteReviewMutation.isPending}
                              >
                                🗑️ Удалить
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {reviewsData.pagination?.pages > 1 && (
                      <div className={styles.pagination}>
                        <button onClick={() => setReviewsPage(p => Math.max(1, p - 1))} disabled={reviewsPage === 1}>← Назад</button>
                        <span>Страница {reviewsPage} из {reviewsData.pagination.pages}</span>
                        <button onClick={() => setReviewsPage(p => Math.min(reviewsData.pagination.pages, p + 1))} disabled={reviewsPage === reviewsData.pagination.pages}>Вперед →</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Вкладка "Заявки" */}
            {activeTab === "requests" && (
              <div className={styles.requestsSection}>
                {activeRequests.length === 0 ? (
                  <div className={styles.emptyRequests}>
                    <p>У пользователя нет активных заявок</p>
                  </div>
                ) : (
                  <div className={styles.requestsList}>
                    {activeRequests.map((request: ActiveRequest) => (
                      <div
                        key={request.id}
                        className={styles.requestCard}
                        onClick={() => router.push(`/requests/${request.id}`)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className={styles.requestHeader}>
                          <h3 className={styles.requestTitle}>{request.title}</h3>
                          <span className={styles.requestBudget}>{formatBudget(request.budget)}</span>
                        </div>
                        <p className={styles.requestDescription}>
                          {request.description.length > 100
                            ? `${request.description.slice(0, 100)}...`
                            : request.description}
                        </p>
                        <div className={styles.requestMeta}>
                          <span>📍 {request.address}</span>
                          <span>⏱️ {getDeadlineText(request.deadline)}</span>
                          <span>🏙️ {request.city?.name || "Город не указан"}</span>
                          <span>💬 {request._count.offers} откликов</span>
                        </div>
                        <div className={styles.requestDate}>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Кнопка назад */}
          <div className={styles.backButtonWrapper}>
            <button onClick={() => router.back()} className={styles.backBtn}>
              ← Назад
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно редактирования отзыва */}
      {isEditModalOpen && editingReview && (
        <EditReviewModal
          reviewId={editingReview.id}
          currentRating={editingReview.rating}
          currentComment={editingReview.comment}
          onClose={closeEditModal}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Модальное окно бана */}
      {showBanModal && (
        <div className={styles.modal} onClick={() => setShowBanModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Блокировка пользователя {user.name}</h3>
            <div className={styles.field}>
              <label>Причина блокировки</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Нарушение правил, спам, мошенничество..."
                rows={3}
                className={styles.textarea}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Срок блокировки (дней)</label>
              <input
                type="number"
                value={banDays}
                onChange={(e) => setBanDays(e.target.value)}
                placeholder="Оставьте пустым для бессрочной блокировки"
                className={styles.input}
              />
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowBanModal(false)} className={styles.cancelBtn}>
                Отмена
              </button>
              <button onClick={handleBanUser} disabled={isBanning} className={styles.confirmBanBtn}>
                {isBanning ? "Блокировка..." : "Заблокировать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}