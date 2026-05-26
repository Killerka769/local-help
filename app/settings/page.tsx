"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.scss";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [logoutAllError, setLogoutAllError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  
  // Состояния для email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [isSending, setIsSending] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailVerifiedInfo, setEmailVerifiedInfo] = useState<"success" | "error" | null>(null);

  // Проверка параметров URL после подтверждения email
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("emailVerified") === "true") {
      setEmailVerifiedInfo("success");
      setTimeout(() => setEmailVerifiedInfo(null), 5000);
    }
    if (params.get("emailError")) {
      setEmailVerifiedInfo("error");
      setTimeout(() => setEmailVerifiedInfo(null), 5000);
    }
  }, []);

  // Функция отправки подтверждения email
  const handleSendVerification = async () => {
    if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setEmailError("Введите корректный email");
      return;
    }

    setIsSending(true);
    setEmailError("");
    setEmailSuccess(false);

    try {
      const res = await fetch("/api/user/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка отправки");
      }

      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 5000);
    } catch (err: any) {
      setEmailError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Функция удаления аккаунта
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Введите пароль");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка удаления");
      }

      await logout.mutateAsync();
      router.push("/");
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeletePassword("");
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/user/export");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка экспорта");
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `localhelp-data-${new Date().toISOString().slice(0, 19)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm("Выйти со всех устройств? Все сессии будут завершены.")) return;
    
    setIsLoggingOutAll(true);
    setLogoutAllError("");
    
    try {
      const res = await fetch("/api/auth/logout-all", { method: "POST" });
      if (res.ok) {
        await logout.mutateAsync();
        router.push("/login");
      } else {
        const data = await res.json();
        setLogoutAllError(data.error || "Ошибка при выходе");
      }
    } catch (error) {
      setLogoutAllError("Ошибка соединения");
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("Новый пароль должен быть минимум 6 символов");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("Новый пароль должен отличаться от текущего");
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка смены пароля");
      }

      setPasswordSuccess("Пароль успешно изменён!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.loading}>Загрузка...</div>
        </div>
      </main>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Настройки</h1>
        <p className={styles.subtitle}>Управление безопасностью и конфиденциальностью</p>

        {/* Уведомления о подтверждении email */}
        {emailVerifiedInfo === "success" && (
          <div className={styles.globalSuccess}>✅ Email успешно подтверждён!</div>
        )}
        {emailVerifiedInfo === "error" && (
          <div className={styles.globalError}>❌ Ссылка подтверждения недействительна или истекла.</div>
        )}

        <div className={styles.settingsGrid}>
          {/* Карточка email */}
          <div className={styles.card}>
            <div className={styles.cardIcon}>📧</div>
            <div className={styles.cardContent}>
              <h2>Email для восстановления</h2>
              <p>
                {user?.emailVerified ? (
                  <span className={styles.verifiedText}>✓ Подтверждён: {user.email}</span>
                ) : user?.email ? (
                  <span className={styles.unverifiedText}>✗ Не подтверждён: {user.email}</span>
                ) : (
                  <span className={styles.noEmailText}>Не указан</span>
                )}
              </p>
              <p className={styles.emailHint}>
                {user?.emailVerified 
                  ? "Email подтверждён. Вы сможете восстановить пароль." 
                  : "Укажите email для восстановления пароля и получения уведомлений"}
              </p>
            </div>
            <button onClick={() => setShowEmailModal(true)} className={styles.cardBtn}>
              {user?.email ? "Изменить" : "Добавить"}
            </button>
          </div>
          
          {/* Карточка смены пароля */}
          <div className={styles.card}>
            <div className={styles.cardIcon}>🔒</div>
            <div className={styles.cardContent}>
              <h2>Смена пароля</h2>
              <p>Измените текущий пароль на новый</p>
            </div>
            <button onClick={() => setShowPasswordModal(true)} className={styles.cardBtn}>
              Изменить
            </button>
          </div>

          {/* Карточка выхода со всех устройств */}
          <div className={styles.card}>
            <div className={styles.cardIcon}>🚪</div>
            <div className={styles.cardContent}>
              <h2>Выход со всех устройств</h2>
              <p>Завершить все активные сессии</p>
            </div>
            <button onClick={handleLogoutAll} disabled={isLoggingOutAll} className={styles.cardBtnDanger}>
              {isLoggingOutAll ? "Выход..." : "Выйти везде"}
            </button>
            {logoutAllError && <div className={styles.errorMsg}>{logoutAllError}</div>}
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>📥</div>
            <div className={styles.cardContent}>
              <h2>Экспорт данных</h2>
              <p>Скачать все ваши данные в формате JSON</p>
            </div>
            <button onClick={handleExportData} disabled={isExporting} className={styles.cardBtn}>
              {isExporting ? "Экспорт..." : "Скачать"}
            </button>
          </div>

          <div className={`${styles.card} ${styles.dangerCard}`}>
            <div className={styles.cardIcon}>🗑️</div>
            <div className={styles.cardContent}>
              <h2>Удалить аккаунт</h2>
              <p>Все данные будут удалены безвозвратно</p>
            </div>
            <button onClick={() => setShowDeleteModal(true)} className={styles.cardBtnDanger}>
              Удалить
            </button>
          </div>

          {/* Место для будущих настроек */}
          <div className={`${styles.card} ${styles.disabled}`}>
            <div className={styles.cardIcon}>🌙</div>
            <div className={styles.cardContent}>
              <h2>Тёмная тема</h2>
              <p>Скоро появится</p>
            </div>
            <button className={styles.cardBtnDisabled} disabled>
              Скоро
            </button>
          </div>

          <div className={`${styles.card} ${styles.disabled}`}>
            <div className={styles.cardIcon}>🔔</div>
            <div className={styles.cardContent}>
              <h2>Уведомления</h2>
              <p>Настройка уведомлений (скоро)</p>
            </div>
            <button className={styles.cardBtnDisabled} disabled>
              Скоро
            </button>
          </div>
        </div>

        {/* Модальное окно смены пароля */}
        {showPasswordModal && (
          <div className={styles.modal} onClick={() => setShowPasswordModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Смена пароля</h3>
                <button onClick={() => setShowPasswordModal(false)} className={styles.closeBtn}>✕</button>
              </div>

              <form onSubmit={handleChangePassword}>
                <div className={styles.field}>
                  <label>Текущий пароль</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label>Новый пароль</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    required
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label>Подтвердите новый пароль</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={styles.input}
                  />
                </div>

                {passwordError && <div className={styles.error}>{passwordError}</div>}
                {passwordSuccess && <div className={styles.success}>{passwordSuccess}</div>}

                <div className={styles.modalActions}>
                  <button type="button" onClick={() => setShowPasswordModal(false)} className={styles.cancelBtn}>
                    Отмена
                  </button>
                  <button type="submit" disabled={isChangingPassword} className={styles.submitBtn}>
                    {isChangingPassword ? "Сохранение..." : "Изменить пароль"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Модальное окно удаления аккаунта */}
        {showDeleteModal && (
          <div className={styles.modal} onClick={() => setShowDeleteModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Удаление аккаунта</h3>
                <button onClick={() => setShowDeleteModal(false)} className={styles.closeBtn}>✕</button>
              </div>

              <div className={styles.warningBox}>
                <p>⚠️ Это действие необратимо!</p>
                <p>Все ваши заявки, отклики, отзывы и избранное будут удалены.</p>
              </div>

              <div className={styles.field}>
                <label>Введите пароль для подтверждения</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••"
                  className={styles.input}
                  autoFocus
                />
              </div>

              {deleteError && <div className={styles.errorMessage}>{deleteError}</div>}

              <div className={styles.modalActions}>
                <button onClick={() => setShowDeleteModal(false)} className={styles.cancelBtn}>
                  Отмена
                </button>
                <button onClick={handleDeleteAccount} disabled={isDeleting} className={styles.deleteBtn}>
                  {isDeleting ? "Удаление..." : "Удалить навсегда"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно добавления/изменения email */}
        {showEmailModal && (
          <div className={styles.modal} onClick={() => setShowEmailModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>{user?.email ? "Изменить email" : "Добавить email"}</h3>
                <button onClick={() => setShowEmailModal(false)} className={styles.closeBtn}>✕</button>
              </div>

              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="example@mail.ru"
                  className={styles.input}
                  autoFocus
                />
                <p className={styles.emailHint}>
                  На этот email придёт ссылка для подтверждения
                </p>
              </div>

              {emailError && <div className={styles.errorMessage}>{emailError}</div>}
              {emailSuccess && <div className={styles.successMessage}>✅ Письмо отправлено! Проверьте почту.</div>}

              <div className={styles.modalActions}>
                <button onClick={() => setShowEmailModal(false)} className={styles.cancelBtn}>
                  Отмена
                </button>
                <button onClick={handleSendVerification} disabled={isSending} className={styles.submitBtn}>
                  {isSending ? "Отправка..." : "Отправить подтверждение"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}