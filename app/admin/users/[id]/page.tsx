"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.scss";

interface UserFullData {
  user: {
    id: string;
    name: string;
    phone: string;
    avatar: string | null;
    description: string | null;
    cityName: string;
    role: string;
    isBlocked: boolean;
    blockedReason: string | null;
    blockedUntil: string | null;
    blockedByName: string | null;
    bannedAt: string | null;
    rating: number;
    createdAt: string;
  };
  requests: any[];
  offers: any[];
  completedRequests: any[];
  stats: {
    totalRequests: number;
    activeRequests: number;
    closedRequests: number;
    totalOffers: number;
    pendingOffers: number;
    approvedOffers: number;
    completedOffers: number;
    rejectedOffers: number;
  };
  complaints: any[];
  userComplaints: any[];
}

export default function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<UserFullData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "requests" | "offers" | "completed" | "complaints">("info");
  const [searchTerm, setSearchTerm] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setUserId(id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (userId && currentUser?.role === "SUPER_ADMIN") {
      loadData();
    }
  }, [userId, currentUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/full`);
      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (confirm("Удалить эту заявку?")) {
      const res = await fetch(`/api/admin/users/${userId}/delete-request/${requestId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadData();
      } else {
        alert("Ошибка при удалении");
      }
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (confirm("Удалить этот отклик?")) {
      const res = await fetch(`/api/admin/users/${userId}/delete-offer/${offerId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadData();
      } else {
        alert("Ошибка при удалении");
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return styles.statusActive;
      case "closed": return styles.statusClosed;
      case "expired": return styles.statusExpired;
      case "pending": return styles.statusPending;
      case "approved": return styles.statusApproved;
      case "rejected": return styles.statusRejected;
      case "completed": return styles.statusCompleted;
      default: return "";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Активна";
      case "closed": return "Закрыта";
      case "expired": return "Истекла";
      case "pending": return "Ожидает";
      case "approved": return "Одобрен";
      case "rejected": return "Отклонён";
      case "completed": return "Выполнен";
      default: return status;
    }
  };

  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return <div className={styles.error}>Доступ запрещён</div>;
  }

  if (isLoading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (!data) {
    return <div className={styles.error}>Пользователь не найден</div>;
  }

  const filteredRequests = data.requests.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOffers = data.offers.filter(o =>
    o.request.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompleted = data.completedRequests.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.push("/admin")} className={styles.backBtn}>
          ← Назад в админ-панель
        </button>
        <h1 className={styles.title}>Карточка пользователя</h1>
      </div>

      {/* Поиск */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Поиск по названию заявки..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === "info" ? styles.tabActive : ""}`} onClick={() => setActiveTab("info")}>
          📋 Информация
        </button>
        <button className={`${styles.tab} ${activeTab === "requests" ? styles.tabActive : ""}`} onClick={() => setActiveTab("requests")}>
          📝 Заявки ({data.stats.totalRequests})
        </button>
        <button className={`${styles.tab} ${activeTab === "offers" ? styles.tabActive : ""}`} onClick={() => setActiveTab("offers")}>
          💬 Отклики ({data.stats.totalOffers})
        </button>
        <button className={`${styles.tab} ${activeTab === "completed" ? styles.tabActive : ""}`} onClick={() => setActiveTab("completed")}>
          ✅ Выполненные ({data.completedRequests.length})
        </button>
        <button className={`${styles.tab} ${activeTab === "complaints" ? styles.tabActive : ""}`} onClick={() => setActiveTab("complaints")}>
          ⚠️ Жалобы ({data.complaints.length})
        </button>
      </div>

      {/* Вкладка информации */}
      {activeTab === "info" && (
        <div className={styles.infoCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {data.user.avatar ? (
                <img src={data.user.avatar} alt={data.user.name} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {data.user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className={styles.userInfo}>
              <h2>{data.user.name}</h2>
              <p>📞 {data.user.phone}</p>
              <p>🏙️ {data.user.cityName}</p>
              <p>⭐ Рейтинг: {data.user.rating.toFixed(1)}</p>
              <p>👑 Роль: <span className={styles.roleBadge}>{data.user.role}</span></p>
              <p>📅 Зарегистрирован: {formatDate(data.user.createdAt)}</p>
            </div>
          </div>

          {data.user.description && (
            <div className={styles.bio}>
              <h3>О себе</h3>
              <p>{data.user.description}</p>
            </div>
          )}

          {data.user.isBlocked && (
            <div className={styles.blockedInfo}>
              <h3>🚫 Блокировка</h3>
              <p><strong>Причина:</strong> {data.user.blockedReason || "Не указана"}</p>
              {data.user.blockedUntil && <p><strong>До:</strong> {formatDate(data.user.blockedUntil)}</p>}
              {data.user.blockedByName && <p><strong>Заблокировал:</strong> {data.user.blockedByName}</p>}
              {data.user.bannedAt && <p><strong>Дата блокировки:</strong> {formatDate(data.user.bannedAt)}</p>}
            </div>
          )}

          <div className={styles.statsGrid}>
            <div className={styles.statCard}><div className={styles.statValue}>{data.stats.totalRequests}</div><div className={styles.statLabel}>Всего заявок</div></div>
            <div className={styles.statCard}><div className={styles.statValue}>{data.stats.activeRequests}</div><div className={styles.statLabel}>Активных</div></div>
            <div className={styles.statCard}><div className={styles.statValue}>{data.stats.closedRequests}</div><div className={styles.statLabel}>Закрытых</div></div>
            <div className={styles.statCard}><div className={styles.statValue}>{data.stats.totalOffers}</div><div className={styles.statLabel}>Всего откликов</div></div>
            <div className={styles.statCard}><div className={styles.statValue}>{data.stats.approvedOffers}</div><div className={styles.statLabel}>Одобрено</div></div>
            <div className={styles.statCard}><div className={styles.statValue}>{data.stats.completedOffers}</div><div className={styles.statLabel}>Выполнено</div></div>
          </div>

          <div className={styles.actions}>
            <button
              onClick={() => router.push(`/admin/users/${userId}/ban`)}
              className={styles.banBtn}
            >
              {data.user.isBlocked ? "🔓 Разблокировать" : "🔨 Заблокировать"}
            </button>
          </div>
        </div>
      )}

      {/* Вкладка заявок */}
      {activeTab === "requests" && (
        <div className={styles.requestsTable}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Заголовок</th>
                <th>Город</th>
                <th>Бюджет</th>
                <th>Статус</th>
                <th>Откликов</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(req => (
                <tr key={req.id}>
                  <td className={styles.mono}>{req.id.slice(0, 8)}...</td>
                  <td>{req.title}</td>
                  <td>{req.city?.name}</td>
                  <td>{req.budget ? `${req.budget.toLocaleString()} ₽` : "Договорная"}</td>
                  <td><span className={`${styles.statusBadge} ${getStatusBadge(req.status)}`}>{getStatusText(req.status)}</span></td>
                  <td>{req.offers.length}</td>
                  <td>{formatDate(req.createdAt)}</td>
                  <td>
                    <button onClick={() => router.push(`/requests/${req.id}`)} className={styles.viewBtn}>Просмотр</button>
                    <button onClick={() => handleDeleteRequest(req.id)} className={styles.deleteBtn}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Вкладка откликов */}
      {activeTab === "offers" && (
        <div className={styles.offersTable}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Заявка</th>
                <th>Автор заявки</th>
                <th>Комментарий</th>
                <th>Статус</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.map(offer => (
                <tr key={offer.id}>
                  <td className={styles.mono}>{offer.id.slice(0, 8)}...</td>
                  <td>{offer.request.title}</td>
                  <td>{offer.request.author.name}</td>
                  <td className={styles.offerComment}>{offer.comment.slice(0, 50)}...</td>
                  <td><span className={`${styles.statusBadge} ${getStatusBadge(offer.status)}`}>{getStatusText(offer.status)}</span></td>
                  <td>{formatDate(offer.createdAt)}</td>
                  <td>
                    <button onClick={() => router.push(`/offers/${offer.id}`)} className={styles.viewBtn}>Просмотр</button>
                    <button onClick={() => handleDeleteOffer(offer.id)} className={styles.deleteBtn}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Вкладка выполненных заявок */}
      {activeTab === "completed" && (
        <div className={styles.completedTable}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Заголовок</th>
                <th>Заказчик</th>
                <th>Бюджет</th>
                <th>Дата завершения</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompleted.map(req => (
                <tr key={req.id}>
                  <td className={styles.mono}>{req.id.slice(0, 8)}...</td>
                  <td>{req.title}</td>
                  <td>{req.author.name}</td>
                  <td>{req.budget ? `${req.budget.toLocaleString()} ₽` : "Договорная"}</td>
                  <td>{formatDate(req.updatedAt)}</td>
                  <td><button onClick={() => router.push(`/requests/${req.id}`)} className={styles.viewBtn}>Просмотр</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Вкладка жалоб */}
      {activeTab === "complaints" && (
        <div className={styles.complaintsList}>
          {data.complaints.length === 0 ? (
            <div className={styles.emptyCard}>Нет жалоб на этого пользователя</div>
          ) : (
            data.complaints.map(c => (
              <div key={c.id} className={styles.complaintCard}>
                <div><strong>Жалоба от:</strong> {c.user.name} ({c.user.phone})</div>
                <div><strong>Причина:</strong> {c.reason}</div>
                {c.description && <div><strong>Описание:</strong> {c.description}</div>}
                <div><strong>Статус:</strong> {c.status}</div>
                <div><strong>Дата:</strong> {formatDate(c.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}