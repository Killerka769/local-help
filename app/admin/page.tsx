"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAdminOffers, useDeleteAdminOffer } from "@/hooks/useAdminOffers";
import { useAdminLogs } from "@/hooks/useAdminLogs";
import { useAdminUsers, AdminUser } from "@/hooks/useAdminUsers";
import { useAdminRequests } from "@/hooks/useAdminRequests";
import { useAdminComplaints } from "@/hooks/useAdminComplaints";
import styles from "./page.module.scss";

interface User {
  id: string;
  name: string;
  phone: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  isBlocked: boolean;
  blockedBy?: string;
  blockedReason?: string;
  blockedUntil?: string;
  bannedAt?: string;
  createdAt: string;
  _count: {
    requests: number;
    offers: number;
  };
}

interface Complaint {
  id: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; phone: string };
  targetType: string;
  targetId: string;
  target: any;
}

interface RequestItem {
  id: string;
  title: string;
  budget: number | null;
  status: string;
  createdAt: string;
  author: { name: string; phone: string };
  _count: { offers: number };
}

interface Stats {
  total: {
    users: number;
    requests: number;
    offers: number;
    complaints: number;
    favorites: number;
  };
  active: {
    requests: number;
    usersLastWeek: number;
  };
  breakdown: {
    requests: { status: string; _count: number }[];
    complaints: { status: string; _count: number }[];
  };
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "complaints" | "requests" | "offers" | "search" | "cities" | "logs">("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [banModal, setBanModal] = useState<{ user: User | null; show: boolean }>({ user: null, show: false });
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState("");
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  
  // Состояния для пользователей (пагинация)
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState("");
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useAdminUsers(usersPage, usersSearch);
  
  // Состояния для заявок (пагинация)
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsSearch, setRequestsSearch] = useState("");
  const [requestsStatus, setRequestsStatus] = useState("");
  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useAdminRequests(requestsPage, requestsSearch, requestsStatus);
  
  // Состояния для жалоб (пагинация)
  const [complaintsPage, setComplaintsPage] = useState(1);
  const [complaintsStatus, setComplaintsStatus] = useState("");
  const { data: complaintsData, isLoading: complaintsLoading, refetch: refetchComplaints } = useAdminComplaints(complaintsPage, complaintsStatus);
  
  // Состояния для откликов
  const [offersSearch, setOffersSearch] = useState("");
  const [offersStatus, setOffersStatus] = useState("");
  const [offersPage, setOffersPage] = useState(1);
  const { data: offersData, isLoading: offersLoading, refetch: refetchOffers } = useAdminOffers(offersPage, offersSearch, offersStatus);
  const deleteOffer = useDeleteAdminOffer();

  // Состояния для логов (только SUPER_ADMIN)
  const [logsPage, setLogsPage] = useState(1);
  const [logsAction, setLogsAction] = useState("");
  const { data: logsData, isLoading: logsLoading } = useAdminLogs(logsPage, logsAction);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN" || isSuperAdmin;

  // Поиск пользователя
  const [searchUserId, setSearchUserId] = useState("");
  const [searchUserResult, setSearchUserResult] = useState<any>(null);
  const [searchUserLoading, setSearchUserLoading] = useState(false);
  const [searchUserError, setSearchUserError] = useState("");

  // Города
  const [cityGroups, setCityGroups] = useState<any[]>([]);
  const [cityGroupsLoading, setCityGroupsLoading] = useState(false);

  const loadCityGroups = async () => {
    setCityGroupsLoading(true);
    try {
      const res = await fetch("/api/admin/city-requests");
      const data = await res.json();
      setCityGroups(data.cities || []);
    } catch (error) {
      console.error("Ошибка загрузки заявок на города", error);
    } finally {
      setCityGroupsLoading(false);
    }
  };

  const approveCity = async (cityName: string) => {
    if (!confirm(`Добавить город "${cityName}" в список доступных?`)) return;
    try {
      const res = await fetch("/api/admin/city-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityName }),
      });
      if (res.ok) {
        loadCityGroups();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      alert("Ошибка");
    }
  };

  const rejectCity = async (cityName: string) => {
    if (!confirm(`Отклонить все заявки на город "${cityName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/city-requests?cityName=${encodeURIComponent(cityName)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadCityGroups();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      alert("Ошибка");
    }
  };

  useEffect(() => {
    if (activeTab === "cities") {
      loadCityGroups();
    }
  }, [activeTab]);

  // Поиск пользователя
  const handleSearchUser = async () => {
    if (!searchUserId.trim()) return;
    
    setSearchUserLoading(true);
    setSearchUserError("");
    setSearchUserResult(null);
    
    try {
      const res = await fetch(`/api/admin/search-user?q=${encodeURIComponent(searchUserId.trim())}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Пользователь не найден");
      }
      
      setSearchUserResult(data.user);
    } catch (err: any) {
      setSearchUserError(err.message);
    } finally {
      setSearchUserLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN"))) {
      router.push("/");
    }
  }, [user, isAuthLoading, router]);

  // Загрузка статистики (только для stats)
  useEffect(() => {
    if (isAdmin && activeTab === "stats") {
      loadStats();
    }
  }, [activeTab, user]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Ошибка загрузки статистики:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    if (!isSuperAdmin) {
      alert("Только SUPER_ADMIN может менять роли");
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        refetchUsers();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      alert("Ошибка");
    }
  };

  const handleBanUser = async () => {
    if (!banModal.user) return;
    try {
      const res = await fetch(`/api/admin/users/${banModal.user.id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: banReason, days: banDays ? parseInt(banDays) : null }),
      });
      if (res.ok) {
        setBanModal({ user: null, show: false });
        setBanReason("");
        setBanDays("");
        refetchUsers();
        if (activeTab === "search" && searchUserResult?.id === banModal.user.id) {
          handleSearchUser();
        }
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      alert("Ошибка");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, { method: "DELETE" });
      if (res.ok) {
        refetchUsers();
        if (activeTab === "search" && searchUserResult?.id === userId) {
          handleSearchUser();
        }
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      alert("Ошибка");
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (confirm("Удалить заявку? Это действие необратимо.")) {
      try {
        const res = await fetch(`/api/admin/requests/${requestId}`, { method: "DELETE" });
        if (res.ok) {
          refetchRequests();
        } else {
          const data = await res.json();
          alert(data.error);
        }
      } catch (error) {
        alert("Ошибка");
      }
    }
  };

  const handleResolveComplaint = async (complaintId: string, action: "reviewed" | "dismissed" | "banned", targetId?: string) => {
    try {
      const res = await fetch(`/api/admin/complaints/${complaintId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action, action: action === "banned" ? "delete" : undefined, targetId }),
      });
      if (res.ok) {
        refetchComplaints();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      alert("Ошибка");
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${field} скопирован`);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      setCopySuccess("Ошибка копирования");
      setTimeout(() => setCopySuccess(null), 2000);
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

  if (isAuthLoading || (activeTab === "stats" && isLoading)) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.loading}>Загрузка...</div>
        </div>
      </main>
    );
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    return null;
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Админ-панель</h1>
          {isSuperAdmin && <span className={styles.superAdminBadge}>SUPER ADMIN</span>}
          {user.role === "ADMIN" && <span className={styles.adminBadge}>ADMIN</span>}
        </div>

        {copySuccess && <div className={styles.copyNotification}>{copySuccess}</div>}

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === "stats" ? styles.tabActive : ""}`} onClick={() => setActiveTab("stats")}>
            📊 Статистика
          </button>
          <button className={`${styles.tab} ${activeTab === "users" ? styles.tabActive : ""}`} onClick={() => setActiveTab("users")}>
            👥 Пользователи ({usersData?.pagination?.total || 0})
          </button>
          <button className={`${styles.tab} ${activeTab === "complaints" ? styles.tabActive : ""}`} onClick={() => setActiveTab("complaints")}>
            ⚠️ Жалобы ({complaintsData?.pagination?.total || 0})
          </button>
          <button className={`${styles.tab} ${activeTab === "requests" ? styles.tabActive : ""}`} onClick={() => setActiveTab("requests")}>
            📝 Все заявки ({requestsData?.pagination?.total || 0})
          </button>
          <button className={`${styles.tab} ${activeTab === "offers" ? styles.tabActive : ""}`} onClick={() => setActiveTab("offers")}>
            💬 Отклики ({offersData?.pagination?.total || 0})
          </button>
          <button className={`${styles.tab} ${activeTab === "search" ? styles.tabActive : ""}`} onClick={() => setActiveTab("search")}>
            🔍 Поиск пользователя
          </button>
          {isSuperAdmin && (
            <button className={`${styles.tab} ${activeTab === "cities" ? styles.tabActive : ""}`} onClick={() => setActiveTab("cities")}>
              🏙️ Заявки на города ({cityGroups.length})
            </button>
          )}
          {isSuperAdmin && (
            <button className={`${styles.tab} ${activeTab === "logs" ? styles.tabActive : ""}`} onClick={() => setActiveTab("logs")}>
              📋 Логи ({logsData?.pagination?.total || 0})
            </button>
          )}
        </div>

        <div className={styles.content}>
          {/* Статистика */}
          {activeTab === "stats" && stats && (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.total.users}</div>
                <div className={styles.statLabel}>Пользователей</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.total.requests}</div>
                <div className={styles.statLabel}>Заявок всего</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.active.requests}</div>
                <div className={styles.statLabel}>Активных заявок</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.total.offers}</div>
                <div className={styles.statLabel}>Откликов</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.total.complaints}</div>
                <div className={styles.statLabel}>Жалоб</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.total.favorites}</div>
                <div className={styles.statLabel}>В избранном</div>
              </div>
            </div>
          )}

          {/* Пользователи */}
          {activeTab === "users" && (
            <div className={styles.usersSection}>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="Поиск по имени, телефону, ID..."
                  value={usersSearch}
                  onChange={(e) => {
                    setUsersSearch(e.target.value);
                    setUsersPage(1);
                  }}
                  className={styles.searchInput}
                />
              </div>

              {usersLoading ? (
                <div className={styles.loading}>Загрузка...</div>
              ) : (
                <>
                  <div className={styles.usersTable}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Имя</th>
                          <th>Телефон</th>
                          <th>Роль</th>
                          <th>Статус</th>
                          <th>Заявок</th>
                          <th>Откликов</th>
                          <th>Дата рег.</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersData?.users.map((u: User) => (
                          <tr key={u.id}>
                            <td className={styles.copyable} onClick={() => copyToClipboard(u.id, "ID")}>{u.id.slice(0, 8)}...</td>
                            <td>{u.name}</td>
                            <td className={styles.copyable} onClick={() => copyToClipboard(u.phone, "Телефон")}>{u.phone}</td>
                            <td>
                              {isSuperAdmin ? (
                                <select 
                                  value={u.role} 
                                  onChange={e => handleRoleChange(u.id, e.target.value)} 
                                  className={styles.roleSelect} 
                                  disabled={u.role === "SUPER_ADMIN" && user.id !== u.id}
                                >
                                  <option value="USER">USER</option>
                                  <option value="ADMIN">ADMIN</option>
                                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                </select>
                              ) : (
                                <span className={styles.roleBadge}>{u.role}</span>
                              )}
                            </td>
                            <td>
                              {u.isBlocked ? (
                                <span className={styles.bannedBadge}>
                                  Заблокирован
                                  {u.blockedUntil && <span> до {formatDate(u.blockedUntil)}</span>}
                                  {u.blockedReason && <span>: {u.blockedReason}</span>}
                                </span>
                              ) : (
                                <span className={styles.activeBadge}>Активен</span>
                              )}
                            </td>
                            <td>{u._count.requests}</td>
                            <td>{u._count.offers}</td>
                            <td>{formatDate(u.createdAt)}</td>
                            <td>
                              <div className={styles.userActions}>
                                <button onClick={() => router.push(`/profile/${u.id}`)} className={styles.viewBtn}>Просмотр</button>
                                {!u.isBlocked ? (
                                  <button onClick={() => setBanModal({ user: u, show: true })} className={styles.banBtn}>Забанить</button>
                                ) : (
                                  <button onClick={() => handleUnbanUser(u.id)} className={styles.unbanBtn}>Разбанить</button>
                                )}
                                <button onClick={() => router.push(`/admin/users/${u.id}`)} className={styles.fullCardBtn}>📋 Полная карточка</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {usersData?.pagination?.pages && usersData.pagination.pages > 1 && (
                    <div className={styles.pagination}>
                      <button onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1}>← Назад</button>
                      <span>Страница {usersPage} из {usersData.pagination.pages}</span>
                      <button onClick={() => setUsersPage(p => Math.min(usersData.pagination.pages, p + 1))} disabled={usersPage === usersData.pagination.pages}>Вперед →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Жалобы */}
          {activeTab === "complaints" && (
            <div className={styles.complaintsSection}>
              <div className={styles.searchBar}>
                <select
                  value={complaintsStatus}
                  onChange={(e) => {
                    setComplaintsStatus(e.target.value);
                    setComplaintsPage(1);
                  }}
                  className={styles.statusFilter}
                >
                  <option value="">Все статусы</option>
                  <option value="pending">На рассмотрении</option>
                  <option value="reviewed">Рассмотрена</option>
                  <option value="dismissed">Отклонена</option>
                  <option value="banned">Объект удалён</option>
                </select>
              </div>

              {complaintsLoading ? (
                <div className={styles.loading}>Загрузка...</div>
              ) : !complaintsData?.complaints?.length ? (
                <div className={styles.emptyCard}>Нет жалоб</div>
              ) : (
                <>
                  <div className={styles.complaintsList}>
                    {complaintsData.complaints.map((complaint: any) => {
                      const isRequest = complaint.targetType === "request";
                      const target = complaint.target;
                      
                      return (
                        <div key={complaint.id} className={styles.complaintCard}>
                          <div className={styles.complaintHeader}>
                            <div>
                              <span className={styles.complaintType}>
                                {isRequest ? "📝 Заявка" : "💬 Отклик"}
                              </span>
                              <span className={`${styles.complaintStatus} ${styles[complaint.status]}`}>
                                {complaint.status === "pending" && "⏳ На рассмотрении"}
                                {complaint.status === "reviewed" && "✅ Рассмотрена"}
                                {complaint.status === "dismissed" && "❌ Отклонена"}
                                {complaint.status === "banned" && "🚫 Объект удалён"}
                              </span>
                            </div>
                            <span className={styles.complaintDate}>{formatDate(complaint.createdAt)}</span>
                          </div>

                          <div className={styles.complaintContent}>
                            <p><strong>Жалоба от:</strong> {complaint.user.name} ({complaint.user.phone})</p>
                            <p><strong>Причина:</strong> {complaint.reason}</p>
                            {complaint.description && <p><strong>Описание:</strong> {complaint.description}</p>}
                            
                            <div className={styles.targetDetails}>
                              <p><strong>📌 Объект жалобы:</strong></p>
                              <div className={styles.targetCard}>
                                {isRequest && target ? (
                                  <>
                                    <p><strong>Заголовок:</strong> {target.title}</p>
                                    <p><strong>Описание:</strong> {target.description?.slice(0, 200)}...</p>
                                    <p><strong>Адрес:</strong> {target.address}</p>
                                    <p><strong>Автор:</strong> {target.author?.name} ({target.author?.phone})</p>
                                    <button onClick={() => router.push(`/requests/${target.id}`)} className={styles.viewTargetBtn}>Открыть заявку</button>
                                  </>
                                ) : target ? (
                                  <>
                                    <p><strong>Комментарий:</strong> {target.comment}</p>
                                    <p><strong>Заявка:</strong> {target.request?.title}</p>
                                    <p><strong>Автор отклика:</strong> {target.user?.name} ({target.user?.phone})</p>
                                    <button onClick={() => router.push(`/requests/${target.request?.id}`)} className={styles.viewTargetBtn}>Открыть заявку</button>
                                  </>
                                ) : (
                                  <p className={styles.targetNotFound}>⚠️ Объект не найден (возможно, уже удалён)</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {complaint.status === "pending" && (
                            <div className={styles.complaintActions}>
                              <button onClick={() => handleResolveComplaint(complaint.id, "reviewed")} className={styles.reviewBtn}>✅ Отметить рассмотренной</button>
                              <button onClick={() => handleResolveComplaint(complaint.id, "dismissed")} className={styles.dismissBtn}>❌ Отклонить жалобу</button>
                              <button onClick={() => { if (confirm("Удалить объект жалобы?")) handleResolveComplaint(complaint.id, "banned", complaint.targetId); }} className={styles.deleteTargetBtn}>🗑️ Удалить объект</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {complaintsData.pagination?.pages > 1 && (
                    <div className={styles.pagination}>
                      <button onClick={() => setComplaintsPage(p => Math.max(1, p - 1))} disabled={complaintsPage === 1}>← Назад</button>
                      <span>Страница {complaintsPage} из {complaintsData.pagination.pages}</span>
                      <button onClick={() => setComplaintsPage(p => Math.min(complaintsData.pagination.pages, p + 1))} disabled={complaintsPage === complaintsData.pagination.pages}>Вперед →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Заявки */}
          {activeTab === "requests" && (
            <div className={styles.requestsSection}>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="Поиск по заголовку, автору..."
                  value={requestsSearch}
                  onChange={(e) => {
                    setRequestsSearch(e.target.value);
                    setRequestsPage(1);
                  }}
                  className={styles.searchInput}
                />
                <select
                  value={requestsStatus}
                  onChange={(e) => {
                    setRequestsStatus(e.target.value);
                    setRequestsPage(1);
                  }}
                  className={styles.statusFilter}
                >
                  <option value="">Все статусы</option>
                  <option value="active">Активные</option>
                  <option value="closed">Закрытые</option>
                  <option value="expired">Истекшие</option>
                </select>
              </div>

              {requestsLoading ? (
                <div className={styles.loading}>Загрузка...</div>
              ) : !requestsData?.requests?.length ? (
                <div className={styles.emptyCard}>Нет заявок</div>
              ) : (
                <>
                  <div className={styles.requestsTable}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Заголовок</th>
                          <th>Автор</th>
                          <th>Телефон</th>
                          <th>Бюджет</th>
                          <th>Статус</th>
                          <th>Дата</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requestsData.requests.map((r: any) => (
                          <tr key={r.id}>
                            <td className={styles.copyable} onClick={() => copyToClipboard(r.id, "ID")}>{r.id.slice(0, 8)}...</td>
                            <td>{r.title}</td>
                            <td>{r.author.name}</td>
                            <td className={styles.copyable} onClick={() => copyToClipboard(r.author.phone, "Телефон")}>{r.author.phone}</td>
                            <td>{r.budget ? `${r.budget.toLocaleString()} ₽` : "Договорная"}</td>
                            <td><span className={`${styles.statusBadge} ${r.status === "active" ? styles.statusActive : r.status === "closed" ? styles.statusClosed : styles.statusExpired}`}>
                              {r.status === "active" ? "Активна" : r.status === "closed" ? "Закрыта" : "Истекла"}
                            </span></td>
                            <td>{formatDate(r.createdAt)}</td>
                            <td>
                              <div className={styles.requestActions}>
                                <button onClick={() => router.push(`/requests/${r.id}`)} className={styles.viewBtn}>Просмотр</button>
                                <button onClick={() => handleDeleteRequest(r.id)} className={styles.deleteRequestBtn}>Удалить</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {requestsData.pagination?.pages > 1 && (
                    <div className={styles.pagination}>
                      <button onClick={() => setRequestsPage(p => Math.max(1, p - 1))} disabled={requestsPage === 1}>← Назад</button>
                      <span>Страница {requestsPage} из {requestsData.pagination.pages}</span>
                      <button onClick={() => setRequestsPage(p => Math.min(requestsData.pagination.pages, p + 1))} disabled={requestsPage === requestsData.pagination.pages}>Вперед →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Отклики */}
          {activeTab === "offers" && (
            <div className={styles.offersSection}>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="Поиск по комментарию, автору, заявке..."
                  value={offersSearch}
                  onChange={(e) => {
                    setOffersSearch(e.target.value);
                    setOffersPage(1);
                  }}
                  className={styles.searchInput}
                />
                <select
                  value={offersStatus}
                  onChange={(e) => {
                    setOffersStatus(e.target.value);
                    setOffersPage(1);
                  }}
                  className={styles.statusFilter}
                >
                  <option value="">Все статусы</option>
                  <option value="pending">Ожидает</option>
                  <option value="approved">Одобрен</option>
                  <option value="rejected">Отклонён</option>
                  <option value="completed">Выполнен</option>
                  <option value="completed_by_executor">Ожидает подтверждения</option>
                </select>
              </div>

              {offersLoading ? (
                <div className={styles.loading}>Загрузка...</div>
              ) : !offersData?.offers?.length ? (
                <div className={styles.emptyCard}>Нет откликов</div>
              ) : (
                <>
                  <div className={styles.offersTable}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Комментарий</th>
                          <th>Исполнитель</th>
                          <th>Телефон</th>
                          <th>Заявка</th>
                          <th>Автор заявки</th>
                          <th>Статус</th>
                          <th>Дата</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offersData.offers.map((offer: any) => (
                          <tr key={offer.id}>
                            <td className={styles.mono}>{offer.id.slice(0, 8)}...</td>
                            <td className={styles.offerComment}>{offer.comment.slice(0, 50)}...</td>
                            <td>{offer.user.name}</td>
                            <td className={styles.copyable} onClick={() => copyToClipboard(offer.user.phone, "Телефон")}>{offer.user.phone}</td>
                            <td><button onClick={() => router.push(`/requests/${offer.request.id}`)} className={styles.linkBtn}>{offer.request.title.slice(0, 30)}...</button></td>
                            <td>{offer.request.author.name}</td>
                            <td><span className={`${styles.offerStatus} ${offer.status === "pending" ? styles.pending : offer.status === "approved" ? styles.approved : offer.status === "rejected" ? styles.rejected : offer.status === "completed" ? styles.completed : styles.completed_by_executor}`}>
                              {offer.status === "pending" && "Ожидает"}
                              {offer.status === "approved" && "Одобрен"}
                              {offer.status === "rejected" && "Отклонён"}
                              {offer.status === "completed" && "Выполнен"}
                              {offer.status === "completed_by_executor" && "Ожидает подтверждения"}
                            </span></td>
                            <td>{formatDate(offer.createdAt)}</td>
                            <td><button onClick={() => { if (confirm("Удалить этот отклик?")) deleteOffer.mutate(offer.id); }} className={styles.deleteBtn}>🗑️</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {offersData.pagination?.pages > 1 && (
                    <div className={styles.pagination}>
                      <button onClick={() => setOffersPage(p => Math.max(1, p - 1))} disabled={offersPage === 1}>← Назад</button>
                      <span>Страница {offersPage} из {offersData.pagination.pages}</span>
                      <button onClick={() => setOffersPage(p => Math.min(offersData.pagination.pages, p + 1))} disabled={offersPage === offersData.pagination.pages}>Вперед →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Поиск пользователя */}
          {activeTab === "search" && (
            <div className={styles.searchUserSection}>
              <div className={styles.searchUserCard}>
                <h3>Поиск пользователя</h3>
                <p className={styles.searchHint}>Введите номер телефона или ID пользователя</p>
                
                <div className={styles.searchUserForm}>
                  <input
                    type="text"
                    placeholder="Телефон: +79991234567 или ID: cm..."
                    value={searchUserId}
                    onChange={(e) => setSearchUserId(e.target.value)}
                    className={styles.searchUserInput}
                  />
                  <button onClick={handleSearchUser} disabled={searchUserLoading || !searchUserId.trim()} className={styles.searchUserBtn}>
                    {searchUserLoading ? "Поиск..." : "Найти"}
                  </button>
                </div>

                {searchUserError && <div className={styles.searchUserError}>{searchUserError}</div>}

                {searchUserResult && (
                  <div className={styles.searchUserResult}>
                    <div className={styles.resultHeader}>
                      <span>Результат поиска</span>
                      <button onClick={() => router.push(`/admin/users/${searchUserResult.id}`)} className={styles.openFullCardBtn}>📋 Открыть полную карточку</button>
                    </div>
                    <div className={styles.resultInfo}>
                      <div className={styles.resultAvatar}>
                        {searchUserResult.avatar ? <img src={searchUserResult.avatar} alt={searchUserResult.name} /> : <div className={styles.resultAvatarPlaceholder}>{searchUserResult.name.charAt(0).toUpperCase()}</div>}
                      </div>
                      <div className={styles.resultDetails}>
                        <p><strong>Имя:</strong> {searchUserResult.name}</p>
                        <p><strong>Телефон:</strong> {searchUserResult.phone}</p>
                        <p><strong>ID:</strong> <span className={styles.mono}>{searchUserResult.id}</span></p>
                        <p><strong>Город:</strong> {searchUserResult.cityName || "Не указан"}</p>
                        <p><strong>Роль:</strong> <span className={styles.roleBadge}>{searchUserResult.role}</span></p>
                        <p><strong>Статус:</strong> {searchUserResult.isBlocked ? <span className={styles.bannedBadge}>Заблокирован</span> : <span className={styles.activeBadge}>Активен</span>}</p>
                        <p><strong>Рейтинг:</strong> ⭐ {searchUserResult.rating?.toFixed(1) || "0"}</p>
                        <p><strong>Заявок:</strong> {searchUserResult._count?.requests || 0}</p>
                        <p><strong>Откликов:</strong> {searchUserResult._count?.offers || 0}</p>
                        <p><strong>Дата регистрации:</strong> {formatDate(searchUserResult.createdAt)}</p>
                      </div>
                    </div>
                    <div className={styles.resultActions}>
                      <button onClick={() => router.push(`/admin/users/${searchUserResult.id}`)} className={styles.fullCardBtn}>📋 Полная карточка</button>
                      {!searchUserResult.isBlocked ? (
                        <button onClick={() => setBanModal({ user: searchUserResult, show: true })} className={styles.banBtn}>🔨 Забанить</button>
                      ) : (
                        <button onClick={() => handleUnbanUser(searchUserResult.id)} className={styles.unbanBtn}>🔓 Разбанить</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Заявки на города */}
          {activeTab === "cities" && (
            <div className={styles.citiesSection}>
              {cityGroupsLoading ? (
                <div className={styles.loading}>Загрузка...</div>
              ) : cityGroups.length === 0 ? (
                <div className={styles.emptyCard}>Нет заявок на новые города</div>
              ) : (
                <div className={styles.citiesTable}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Город</th>
                        <th>Голосов</th>
                        <th>Кто голосовал</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cityGroups.map((city) => (
                        <tr key={city.cityName}>
                          <td className={styles.cityNameCell}>{city.cityName}</td>
                          <td className={styles.votesCell}>{city.votes}</td>
                          <td className={styles.usersCell}>
                            <div className={styles.usersList}>
                              {city.requests.map((req: any) => (
                                <div key={req.user.id} className={styles.userItem}>
                                  <span className={styles.userName}>{req.user.name}</span>
                                  <a href={`tel:${req.user.phone}`} className={styles.userPhone}>{req.user.phone}</a>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className={styles.actionsCell}>
                            <button onClick={() => approveCity(city.cityName)} className={styles.approveCityBtn}>✅ Одобрить</button>
                            <button onClick={() => rejectCity(city.cityName)} className={styles.rejectCityBtn}>❌ Отклонить</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Логи */}
          {activeTab === "logs" && isSuperAdmin && (
            <div className={styles.logsSection}>
              <div className={styles.searchBar}>
                <select value={logsAction} onChange={(e) => { setLogsAction(e.target.value); setLogsPage(1); }} className={styles.actionFilter}>
                  <option value="">Все действия</option>
                  <option value="ban_user">Блокировка пользователя</option>
                  <option value="unban_user">Разблокировка пользователя</option>
                  <option value="delete_request">Удаление заявки</option>
                  <option value="delete_offer">Удаление отклика</option>
                  <option value="resolve_complaint">Обработка жалобы</option>
                  <option value="dismiss_complaint">Отклонение жалобы</option>
                  <option value="delete_complaint_target">Удаление объекта жалобы</option>
                  <option value="change_role">Смена роли</option>
                </select>
              </div>

              {logsLoading ? (
                <div className={styles.loading}>Загрузка...</div>
              ) : !logsData?.logs?.length ? (
                <div className={styles.emptyCard}>Нет записей</div>
              ) : (
                <>
                  <div className={styles.logsTable}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Дата</th>
                          <th>Администратор</th>
                          <th>Действие</th>
                          <th>Объект</th>
                          <th>Детали</th>
                          <th>IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logsData.logs.map((log: any) => (
                          <tr key={log.id}>
                            <td className={styles.mono}>{formatDate(log.createdAt)}</td>
                            <td>{log.adminName} <span className={styles.roleBadge}>{log.adminRole}</span></td>
                            <td><span className={`${styles.actionBadge} ${log.action === "ban_user" ? styles.ban_user : log.action === "unban_user" ? styles.unban_user : log.action === "delete_request" ? styles.delete_request : log.action === "delete_offer" ? styles.delete_offer : log.action === "resolve_complaint" ? styles.resolve_complaint : log.action === "dismiss_complaint" ? styles.dismiss_complaint : log.action === "delete_complaint_target" ? styles.delete_complaint_target : styles.change_role}`}>
                              {log.action === "ban_user" && "🔨 Блокировка"}
                              {log.action === "unban_user" && "✅ Разблокировка"}
                              {log.action === "delete_request" && "🗑️ Удаление заявки"}
                              {log.action === "delete_offer" && "🗑️ Удаление отклика"}
                              {log.action === "resolve_complaint" && "✅ Рассмотрение жалобы"}
                              {log.action === "dismiss_complaint" && "❌ Отклонение жалобы"}
                              {log.action === "delete_complaint_target" && "🗑️ Удаление объекта"}
                              {log.action === "change_role" && "👑 Смена роли"}
                            </span></td>
                            <td><span className={styles.targetType}>{log.targetType}</span>{log.targetName && <span className={styles.targetName}>"{log.targetName?.slice(0, 50)}"</span>}</td>
                            <td className={styles.detailsCell}>{log.details || "—"}</td>
                            <td className={styles.mono}>{log.ipAddress || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {logsData.pagination?.pages > 1 && (
                    <div className={styles.pagination}>
                      <button onClick={() => setLogsPage(p => Math.max(1, p - 1))} disabled={logsPage === 1}>← Назад</button>
                      <span>Страница {logsPage} из {logsData.pagination.pages}</span>
                      <button onClick={() => setLogsPage(p => Math.min(logsData.pagination.pages, p + 1))} disabled={logsPage === logsData.pagination.pages}>Вперед →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно бана */}
      {banModal.show && banModal.user && (
        <div className={styles.modal} onClick={() => setBanModal({ user: null, show: false })}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Блокировка пользователя {banModal.user.name}</h3>
            <div className={styles.field}>
              <label>Причина блокировки</label>
              <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Нарушение правил, спам, мошенничество..." rows={3} className={styles.textarea} />
            </div>
            <div className={styles.field}>
              <label>Срок блокировки (дней)</label>
              <input type="number" value={banDays} onChange={(e) => setBanDays(e.target.value)} placeholder="Оставьте пустым для бессрочной" className={styles.input} />
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setBanModal({ user: null, show: false })} className={styles.cancelBtn}>Отмена</button>
              <button onClick={handleBanUser} className={styles.confirmBanBtn}>Заблокировать</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}