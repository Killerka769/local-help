"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { use } from "react";
import styles from "./page.module.scss";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface OfferData {
  id: string;
  comment: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    phone: string | null;
    description: string | null;
  };
  request: {
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
      phone: string | null;
    };
  };
  canApprove: boolean;
  canViewAddress: boolean;
  canViewPhone: boolean;
}

export default function OfferPage({ params }: PageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { id } = use(params);

  const { data: offer, isLoading, error } = useQuery<OfferData>({
    queryKey: ["offer", id],
    queryFn: async () => {
      const res = await fetch(`/api/offers/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка загрузки");
      }
      return res.json();
    },
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/offers/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer", id] });
      queryClient.invalidateQueries({ queryKey: ["request", offer?.request.id] });
    },
  });

  const completeByExecutorMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/offers/${id}/complete-by-executor`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer", id] });
      queryClient.invalidateQueries({ queryKey: ["request", offer?.request.id] });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/offers/${id}/finalize`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer", id] });
      queryClient.invalidateQueries({ queryKey: ["request", offer?.request.id] });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatBudget = (budget: number | null) => {
    if (!budget) return "Договорная";
    return `${budget.toLocaleString()} ₽`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return { text: "Ожидает одобрения", className: styles.statusPending };
      case "approved":
        return { text: "Одобрен, можно приступать", className: styles.statusApproved };
      case "completed_by_executor":
        return { text: "Исполнитель завершил работу", className: styles.statusExecutorCompleted };
      case "completed":
        return { text: "Завершён", className: styles.statusCompleted };
      case "rejected":
        return { text: "Отклонён", className: styles.statusRejected };
      default:
        return { text: status, className: "" };
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/offers/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      router.push(`/requests/${offer?.request.id}`);
    },
  });

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

  if (error || !offer) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.errorCard}>
            <p className={styles.errorText}>
              {error?.message || "Отклик не найден"}
            </p>
            <button onClick={() => router.back()} className={styles.backBtn}>
              Назад
            </button>
          </div>
        </div>
      </main>
    );
  }

  const status = getStatusText(offer.status);
  const isAuthor = user?.id === offer.request.author.id;
  const isExecutor = user?.id === offer.user.id;
  

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Детали отклика</h1>
            <span className={`${styles.statusBadge} ${status.className}`}>
              {status.text}
            </span>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Информация об отклике</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>От кого:</span>
                <div
                  className={styles.userInfo}
                  onClick={() => router.push(`/profile/${offer.user.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.userAvatar}>
                    {offer.user.avatar ? (
                      <img src={offer.user.avatar} alt={offer.user.name} />
                    ) : (
                      <span>{offer.user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span>{offer.user.name}</span>
                </div>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Комментарий:</span>
                <p className={styles.comment}>{offer.comment}</p>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Дата отклика:</span>
                <span>{formatDate(offer.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Информация о заявке</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Заявка:</span>
                <button
                  onClick={() => router.push(`/requests/${offer.request.id}`)}
                  className={styles.requestLink}
                >
                  {offer.request.title}
                </button>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Описание:</span>
                <p className={styles.requestDescription}>{offer.request.description}</p>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Бюджет:</span>
                <span>{formatBudget(offer.request.budget)}</span>
              </div>

              {offer.canViewAddress && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>📍 Адрес:</span>
                  <span className={styles.address}>{offer.request.address}</span>
                </div>
              )}

              {offer.canViewPhone && offer.request.author.phone && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>📞 Контакт заказчика:</span>
                  <a href={`tel:${offer.request.author.phone}`} className={styles.phoneLink}>
                    {offer.request.author.phone}
                  </a>
                </div>
              )}

              {isAuthor && offer.status === "approved" && offer.user.phone && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>📞 Контакт исполнителя:</span>
                  <a href={`tel:${offer.user.phone}`} className={styles.phoneLink}>
                    {offer.user.phone}
                  </a>
                </div>
              )}

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Автор заявки:</span>
                <div
                  className={styles.userInfo}
                  onClick={() => router.push(`/profile/${offer.request.author.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.userAvatar}>
                    {offer.request.author.avatar ? (
                      <img src={offer.request.author.avatar} alt={offer.request.author.name} />
                    ) : (
                      <span>{offer.request.author.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span>{offer.request.author.name}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.actionsSection}>
            {isExecutor && offer.status !== "approved" && offer.status !== "completed" && (
              <button
                onClick={() => {
                  if (confirm("Удалить этот отклик? Действие необратимо.")) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
                className={styles.deleteBtn}
              >
                {deleteMutation.isPending ? "Удаление..." : "🗑️ Удалить отклик"}
              </button>
            )}

            {offer.canApprove && (
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className={styles.approveBtn}
              >
                {approveMutation.isPending ? "Одобрение..." : "✅ Одобрить отклик"}
              </button>
            )}

            {offer.status === "approved" && isExecutor && (
              <button
                onClick={() => completeByExecutorMutation.mutate()}
                disabled={completeByExecutorMutation.isPending}
                className={styles.completeByExecutorBtn}
              >
                {completeByExecutorMutation.isPending ? "Отправка..." : "✅ Я выполнил работу"}
              </button>
            )}

            {offer.status === "completed_by_executor" && isAuthor && (
              <button
                onClick={() => finalizeMutation.mutate()}
                disabled={finalizeMutation.isPending}
                className={styles.finalizeBtn}
              >
                {finalizeMutation.isPending ? "Завершение..." : "🎉 Подтвердить выполнение и закрыть заявку"}
              </button>
            )}
          </div>

          <div className={styles.backSection}>
            <button onClick={() => router.back()} className={styles.backBtn}>
              ← Назад
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}