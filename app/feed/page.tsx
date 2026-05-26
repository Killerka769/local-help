"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFeed } from "@/hooks/useFeed";
import { useAuth } from "@/hooks/useAuth";
import { useCities } from "@/hooks/useCities";
import styles from "./page.module.scss";
import { useDebounce } from "@/hooks/useDebounce";
import FeedCard from "../components/FeedCard/FeedCard";

interface FilterState {
  deadline: "all" | "3" | "7" | "30";
  budgetMin: string;
  budgetMax: string;
  sortBy: "date" | "budget_asc" | "budget_desc";
  search: string;
  city: string;
}

export default function FeedPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { cities } = useCities();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    deadline: "all",
    budgetMin: "",
    budgetMax: "",
    sortBy: "date",
    search: "",
    city: user?.cityId || "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const debouncedSearch = useDebounce(filters.search, 500);
  
  const { requests, pagination, currentCityId, isLoading, error, refetch } = useFeed(
    page,
    12,
    { ...filters, search: debouncedSearch }
  );

  // Обновляем фильтр города при изменении пользователя
  useEffect(() => {
    if (user?.cityId && !filters.city) {
      setFilters(prev => ({ ...prev, city: user.cityId || "" }));
    }
  }, [user?.cityId, filters.city]);

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setPage(1);
  }, [filters.deadline, filters.budgetMin, filters.budgetMax, filters.sortBy, debouncedSearch, filters.city]);

  // Мемоизированные функции форматирования
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Только что";
    if (diffHours < 24) return `${diffHours} ч назад`;
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
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

  const getDeadlineClass = useCallback((deadline: number) => {
    if (deadline === 3) return styles.deadlineUrgent;
    if (deadline === 7) return styles.deadlineNormal;
    return styles.deadlineLong;
  }, []);

  // Мемоизированное название текущего города
  const currentCityName = useMemo(() => {
    return cities.find(c => c.id === (filters.city || currentCityId))?.name || "Все города";
  }, [cities, filters.city, currentCityId]);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      deadline: "all",
      budgetMin: "",
      budgetMax: "",
      sortBy: "date",
      search: "",
      city: user?.cityId || "",
    });
  }, [user?.cityId]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (error) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.errorCard}>
            <p className={styles.errorText}>Ошибка загрузки заявок</p>
            <button onClick={() => refetch()} className={styles.retryBtn}>
              Попробовать снова
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Лента заявок</h1>
            <p className={styles.subtitle}>
              {user ? `Заявки из города: ${currentCityName}` : "Войдите, чтобы видеть заявки из вашего города"}
            </p>
          </div>
          {user && (
            <button
              onClick={() => router.push("/profile/favorites")}
              className={styles.favoritesBtn}
            >
              Избранное
            </button>
          )}
        </div>

        {/* ПОИСК */}
        <div className={styles.searchSection}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Поиск по заявкам..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className={styles.searchInput}
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange("search", "")}
                className={styles.clearSearch}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Фильтры */}
        <div className={styles.filtersSection}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={styles.filterToggle}
          >
            {showFilters ? "▲ Скрыть фильтры" : "▼ Показать фильтры"}
          </button>

          {showFilters && (
            <div className={styles.filtersPanel}>
              <div className={styles.filterRow}>
                <div className={styles.filterGroup}>
                  <label>Город</label>
                  <select
                    value={filters.city}
                    onChange={(e) => handleFilterChange("city", e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="">По умолчанию</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label>Срок</label>
                  <select
                    value={filters.deadline}
                    onChange={(e) => handleFilterChange("deadline", e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">Любой</option>
                    <option value="3">До 3 дней</option>
                    <option value="7">До 7 дней</option>
                    <option value="30">До 30 дней</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label>Бюджет</label>
                  <div className={styles.budgetInputs}>
                    <input
                      min={1}
                      max={9999999}
                      type="number"
                      placeholder="от"
                      value={filters.budgetMin}
                      onChange={(e) => handleFilterChange("budgetMin", e.target.value)}
                      className={styles.budgetInput}/>
                    <span>—</span>
                    <input
                      min={1}
                      max={9999999}
                      type="number"
                      placeholder="до"
                      value={filters.budgetMax}
                      onChange={(e) => handleFilterChange("budgetMax", e.target.value)}
                      className={styles.budgetInput}/>
                  </div>
                </div>

                <div className={styles.filterGroup}>
                  <label>Сортировка</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="date">По дате (сначала новые)</option>
                    <option value="budget_asc">По бюджету (сначала дешевле)</option>
                    <option value="budget_desc">По бюджету (сначала дороже)</option>
                  </select>
                </div>

                <button onClick={resetFilters} className={styles.resetBtn}>
                  Сбросить
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Результаты */}
        {isLoading ? (
          <div className={styles.skeletonGrid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonLine}></div>
                <div className={styles.skeletonLine}></div>
                <div className={styles.skeletonFooter}></div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyText}>Ничего не найдено</p>
            <p className={styles.emptyHint}>Попробуйте изменить параметры поиска или город</p>
            <button onClick={resetFilters} className={styles.emptyBtn}>
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <>
            <div className={styles.resultsInfo}>
              Найдено: <strong>{pagination.total}</strong> заявок
              {filters.search && <span> по запросу «{filters.search}»</span>}
            </div>

            <div className={styles.grid}>
              {requests.map((request) => (
                <FeedCard
                  key={request.id}
                  request={request}
                  formatBudget={formatBudget}
                  formatDate={formatDate}
                  getDeadlineText={getDeadlineText}
                  getDeadlineClass={getDeadlineClass}
                />
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={styles.pageBtn}
                >
                  ← Назад
                </button>

                <div className={styles.pageNumbers}>
                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    let pageNum = page;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    if (pageNum > pagination.pages || pageNum < 1) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`${styles.pageNumber} ${pageNum === page ? styles.activePage : ""}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.pages}
                  className={styles.pageBtn}
                >
                  Вперед →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}