"use client";

import { useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useCities } from "@/hooks/useCities";
import { useMyRequests } from "@/hooks/useMyRequests";
import { useMyOffers } from "@/hooks/useMyOffers";
import { useUserReviews } from "@/hooks/useReviews";
import { useMyReviews, useUpdateMyReview, useDeleteMyReview } from "@/hooks/useMyReviews";
import EditReviewModal from "../components/EditReviewModal/EditReviewModal";
import styles from "./Profile.module.scss";
import Link from "next/link";

const profileSchema = z.object({
  name: z.string().min(2, "Имя должно быть минимум 2 символа"),
  description: z.string().optional(),
  avatar: z.string().url("Неверный URL").optional().or(z.literal("")),
  cityId: z.string().min(1, "Выберите город"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface Request {
  id: string;
  title: string;
  description: string;
  address: string;
  budget: number | null;
  deadline: number;
  status: string;
  createdAt: string;
}

interface Offer {
  id: string;
  comment: string;
  status: string;
  createdAt: string;
  request: {
    id: string;
    title: string;
    author: {
      phone: string | null;
    };
  };
}

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

interface MyReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  toUser: {
    id: string;
    name: string;
    avatar: string | null;
  };
  request: {
    id: string;
    title: string;
  };
}

// Компонент списка заявок
function MyRequestsList() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"active" | "closed" | "expired">("active");
  const { requests, pagination, isLoading, error } = useMyRequests(page, 10, statusFilter);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatBudget = useCallback((budget: number | null) => {
    if (!budget) return "Договорная";
    return `${budget.toLocaleString()} ₽`;
  }, []);

  const getDeadlineText = useCallback((deadline: number) => {
    if (deadline === 3) return "3 дня";
    if (deadline === 7) return "7 дней";
    if (deadline === 30) return "30 дней";
    return `${deadline} дней`;
  }, []);

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Активна";
      case "closed": return "Закрыта";
      case "expired": return "Истекла";
      default: return status;
    }
  };

  if (isLoading) {
    return <div className={styles.skeletonList}>Загрузка...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>Ошибка загрузки заявок</div>;
  }

  if (requests.length === 0) {
    return (
      <div className={styles.emptyList}>
        <p>У вас нет {statusFilter === "active" ? "активных" : statusFilter === "closed" ? "закрытых" : "истекших"} заявок</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.filterButtons}>
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

      <div className={styles.requestsList}>
        {requests.map((request: Request) => (
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
              {request.description.length > 100 ? `${request.description.slice(0, 100)}...` : request.description}
            </p>
            <div className={styles.requestMeta}>
              <span>📍 {request.address}</span>
              <span>⏱️ {getDeadlineText(request.deadline)}</span>
              <span className={styles.requestStatus}>{getStatusText(request.status)}</span>
            </div>
            <div className={styles.requestDate}>{formatDate(request.createdAt)}</div>
          </div>
        ))}
      </div>

      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            ← Назад
          </button>
          <span>Страница {page} из {pagination.pages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>
            Вперед →
          </button>
        </div>
      )}
    </div>
  );
}

// Компонент списка откликов
function MyOffersList() {
  const router = useRouter();
  const { offers, isLoading, error } = useMyOffers();

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return { text: "Ожидает", className: styles.statusPending };
      case "approved": return { text: "Одобрен", className: styles.statusApproved };
      case "rejected": return { text: "Отклонён", className: styles.statusRejected };
      case "completed": return { text: "Выполнен", className: styles.statusCompleted };
      default: return { text: status, className: "" };
    }
  };

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
  }, []);

  if (isLoading) {
    return <div className={styles.skeletonList}>Загрузка...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>Ошибка загрузки откликов</div>;
  }

  if (offers.length === 0) {
    return (
      <div className={styles.emptyList}>
        <p>Вы ещё не откликались на заявки</p>
        <button onClick={() => router.push("/feed")} className={styles.emptyBtn}>
          Смотреть заявки
        </button>
      </div>
    );
  }

  return (
    <div className={styles.offersList}>
      {offers.map((offer: Offer) => {
        const status = getStatusText(offer.status);
        const showContacts = offer.status === "approved" && offer.request.author?.phone;

        return (
          <div
            key={offer.id}
            className={styles.offerCard}
            onClick={() => router.push(`/offers/${offer.id}`)}
            role="button"
            tabIndex={0}
          >
            <div className={styles.offerHeader}>
              <div>
                <h3 className={styles.offerTitle}>{offer.request.title}</h3>
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
              <span className={styles.offerDate}>{formatDate(offer.createdAt)}</span>
              {showContacts && (
                <div className={styles.contactInfo}>
                  📞 Контакт: {offer.request.author.phone}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Компонент отзывов, которые получил пользователь (от других)
function MyReceivedReviewsList() {
  const router = useRouter();
  const { user } = useAuth();
  const [reviewsPage, setReviewsPage] = useState(1);
  const { data: reviewsData, isLoading: reviewsLoading } = useUserReviews(user?.id || "", reviewsPage);

  const formatReviewDate = useCallback((dateString: string) => {
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
  }, []);

  if (reviewsLoading) {
    return <div className={styles.skeletonList}>Загрузка отзывов...</div>;
  }

  if (!reviewsData?.reviews?.length) {
    return (
      <div className={styles.emptyList}>
        <p>У вас пока нет отзывов</p>
      </div>
    );
  }

  return (
    <div>
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
            {review.comment && (
              <p className={styles.reviewComment}>{review.comment}</p>
            )}
            <div className={styles.reviewRequest}>
              <span className={styles.reviewRequestLabel}>Заявка:</span>
              <Link href={`/requests/${review.request.id}`} className={styles.reviewRequestLink}>
                {review.request.title}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {reviewsData.pagination?.pages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setReviewsPage(p => Math.max(1, p - 1))}
            disabled={reviewsPage === 1}
            className={styles.pageBtn}
          >
            ← Назад
          </button>
          <span className={styles.pageInfo}>
            Страница {reviewsPage} из {reviewsData.pagination.pages}
          </span>
          <button
            onClick={() => setReviewsPage(p => Math.min(reviewsData.pagination.pages, p + 1))}
            disabled={reviewsPage === reviewsData.pagination.pages}
            className={styles.pageBtn}
          >
            Вперед →
          </button>
        </div>
      )}
    </div>
  );
}

// Компонент отзывов, которые пользователь НАПИСАЛ (о других)
function MyWrittenReviewsList() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useMyReviews(page);
  const updateReview = useUpdateMyReview();
  const deleteReview = useDeleteMyReview();
  const [editTarget, setEditTarget] = useState<{ id: string; rating: number; comment: string | null } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const formatReviewDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "сегодня";
    if (diffDays === 1) return "вчера";
    if (diffDays < 7) return `${diffDays} дня назад`;
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  }, []);

  const openEditModal = (review: MyReview) => {
    setEditTarget({ id: review.id, rating: review.rating, comment: review.comment });
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Удалить этот отзыв?")) {
      await deleteReview.mutateAsync(id);
    }
  };

  if (isLoading) return <div className={styles.skeletonList}>Загрузка...</div>;
  if (error) return <div className={styles.errorMessage}>Ошибка загрузки</div>;
  if (!data?.reviews?.length) {
    return <div className={styles.emptyList}>Вы ещё не оставляли отзывы</div>;
  }

  return (
    <div>
      <div className={styles.reviewsList}>
        {data.reviews.map((review: MyReview) => (
          <div key={review.id} className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <div className={styles.reviewAuthor}>
                <div 
                  className={styles.reviewAuthorAvatar}
                  onClick={() => router.push(`/profile/${review.toUser.id}`)}
                >
                  {review.toUser.avatar ? (
                    <img src={review.toUser.avatar} alt={review.toUser.name} />
                  ) : (
                    <span>{review.toUser.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div 
                    className={styles.reviewAuthorName}
                    onClick={() => router.push(`/profile/${review.toUser.id}`)}
                  >
                    {review.toUser.name}
                  </div>
                  <div className={styles.reviewDate}>{formatReviewDate(review.createdAt)}</div>
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
              <button onClick={() => openEditModal(review)} className={styles.editReviewBtn}>
                ✏️ Редактировать
              </button>
              <button onClick={() => handleDelete(review.id)} className={styles.deleteReviewBtn}>
                🗑️ Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
      {data.pagination?.pages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Назад</button>
          <span>Страница {page} из {data.pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))} disabled={page === data.pagination.pages}>Вперед →</button>
        </div>
      )}
      {isEditModalOpen && editTarget && (
        <EditReviewModal
          reviewId={editTarget.id}
          currentRating={editTarget.rating}
          currentComment={editTarget.comment}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const { cities, isLoading: citiesLoading } = useCities();
  const { updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [activeTab, setActiveTab] = useState<"requests" | "offers" | "receivedReviews" | "writtenReviews">("requests");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      description: "",
      avatar: "",
      cityId: "",
    },
  });

  const [reviewsPage] = useState(1);
  const { data: reviewsData } = useUserReviews(user?.id || "", reviewsPage);

  const getDeclension = useCallback((count: number, one: string, two: string, five: string) => {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return five;
    if (n1 > 1 && n1 < 5) return two;
    if (n1 === 1) return one;
    return five;
  }, []);

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        description: user.description || "",
        avatar: user.avatar || "",
        cityId: user.cityId,
      });
    }
  }, [user, reset]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  const onSubmit = async (data: ProfileFormData) => {
    await updateProfile.mutateAsync(data);
    setIsEditing(false);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
    setAvatarError(false);
  };

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.push("/");
  };

  const renderStars = useCallback((rating: number) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return (
      <span className={styles.stars}>
        {"★".repeat(fullStars)}{"☆".repeat(emptyStars)}
      </span>
    );
  }, []);

  if (isAuthLoading) {
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

  if (!user) return null;

  const userCityName = cities.find(c => c.id === user.cityId)?.name || "Город не выбран";

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Шапка профиля */}
          <div className={styles.profileHeader}>
            <div className={styles.avatarWrapper}>
              {user?.avatar && !avatarError ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className={styles.avatar}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {user?.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div className={styles.profileInfo}>
              <h1 className={styles.title}>{user?.name}</h1>
              <p className={styles.phone}>{user?.phone}</p>
              <p className={styles.city}>📍 {userCityName}</p>
              <div className={styles.verificationStatus}>
                {user?.emailVerified ? (
                  <span className={styles.verified}>✓ Email подтверждён</span>
                ) : (
                  <Link href="/settings" className={styles.unverified}>
                    ⚠️ Email не подтверждён — укажите в настройках
                  </Link>
                )}
              </div>
              <div className={styles.ratingRow}>
                <span className={styles.ratingValue}>{user.rating?.toFixed(1) || "0"}</span>
                {renderStars(user.rating || 0)}
                <span className={styles.ratingCount}>
                  {reviewsData?.totalReviews || 0} {getDeclension(reviewsData?.totalReviews || 0, "отзыв", "отзыва", "отзывов")}
                </span>
              </div>
              <p className={styles.joinDate}>
                Присоединился: {user && new Date(user.createdAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Статистика */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user.completedCount || 0}</span>
              <span className={styles.statLabel}>Выполнено</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user._count?.requests || 0}</span>
              <span className={styles.statLabel}>Заявок</span>
              <span className={styles.statSubLabel}>создано</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user._count?.offers || 0}</span>
              <span className={styles.statLabel}>Откликов</span>
              <span className={styles.statSubLabel}>отправлено</span>
            </div>
          </div>

          {/* Режим просмотра / редактирования */}
          {!isEditing ? (
            <div className={styles.viewMode}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>О себе</h3>
                <p className={styles.description}>
                  {user?.description || "Пока ничего не рассказано о себе"}
                </p>
              </div>

              <div className={styles.actionButtons}>
                <button onClick={() => setIsEditing(true)} className={styles.editBtn}>
                  ✏️ Редактировать профиль
                </button>
                <Link href="/settings" className={styles.settingsLink}>
                    ⚙️ Настройки аккаунта
                </Link>
                <button onClick={handleLogout} className={styles.logoutBtn} disabled={logout.isPending}>
                  {logout.isPending ? "Выход..." : "🚪 Выйти из аккаунта"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="name">Имя</label>
                <input
                  id="name"
                  type="text"
                  className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
                  {...register("name")}
                />
                {errors.name && <span className={styles.error}>{errors.name.message}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="cityId">Город</label>
                <select
                  id="cityId"
                  className={styles.select}
                  {...register("cityId")}
                  disabled={citiesLoading}
                >
                  <option value="">Выберите город</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {errors.cityId && <span className={styles.error}>{errors.cityId.message}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="avatar">Фото (URL)</label>
                <input
                  id="avatar"
                  type="url"
                  placeholder="https://your-image-url.jpg"
                  className={`${styles.input} ${errors.avatar ? styles.inputError : ""}`}
                  {...register("avatar")}
                />
                {errors.avatar && <span className={styles.error}>{errors.avatar.message}</span>}
                <span className={styles.hint}>Вставьте ссылку на фото (Telegram, VK, любой хостинг)</span>
              </div>

              <div className={styles.field}>
                <label htmlFor="description">О себе</label>
                <textarea
                  id="description"
                  rows={5}
                  placeholder="Расскажите о себе, своих навыках и опыте..."
                  className={`${styles.textarea} ${errors.description ? styles.inputError : ""}`}
                  {...register("description")}
                />
                {errors.description && <span className={styles.error}>{errors.description.message}</span>}
              </div>

              {updateProfile.isError && (
                <div className={styles.errorMessage}>Ошибка: {updateProfile.error?.message}</div>
              )}

              {updateProfile.isSuccess && (
                <div className={styles.successMessage}>✅ Профиль успешно обновлён!</div>
              )}

              <div className={styles.formButtons}>
                <button type="submit" className={styles.saveBtn} disabled={!isDirty || isSubmitting || updateProfile.isPending}>
                  {isSubmitting || updateProfile.isPending ? "Сохранение..." : "💾 Сохранить"}
                </button>
                <button type="button" onClick={handleCancel} className={styles.cancelBtn}>
                  Отмена
                </button>
              </div>
            </form>
          )}

          {/* Вкладки */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "requests" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              Мои заявки
            </button>
            <button
              className={`${styles.tab} ${activeTab === "offers" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("offers")}
            >
              Мои отклики
            </button>
            <button
              className={`${styles.tab} ${activeTab === "receivedReviews" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("receivedReviews")}
            >
              ⭐ Отзывы обо мне
            </button>
            <button
              className={`${styles.tab} ${activeTab === "writtenReviews" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("writtenReviews")}
            >
              ✍️ Мои отзывы
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === "requests" && <MyRequestsList />}
            {activeTab === "offers" && <MyOffersList />}
            {activeTab === "receivedReviews" && <MyReceivedReviewsList />}
            {activeTab === "writtenReviews" && <MyWrittenReviewsList />}
          </div>
        </div>
      </div>
    </main>
  );
}