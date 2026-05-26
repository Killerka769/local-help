"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import styles from "./Header.module.scss";
import NotificationBell from "./NotificationBell/NotificationBell";
import Image from "next/image";

export default function Header() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <span className={styles.logoIconText}>LH</span>
          </div>
          <span className={styles.logoText}>Local Help</span>
        </Link>

        {/* Десктопное меню */}
        <nav className={styles.desktopNav}>
          {isLoading ? (
            <span className={styles.loading}>...</span>
          ) : isAuthenticated && user ? (
            <>
              <Link href="/feed" className={styles.navLink}>
                Лента
              </Link>
              <Link href="/profile/offers" className={styles.navLink}>
                Мои отклики
              </Link>
              <Link href="/requests" className={styles.navLink}>
                Мои заявки
              </Link>
              <NotificationBell />
              
              {isAdmin && (
                <Link href="/admin" className={styles.adminLink}>
                  Админ-панель
                </Link>
              )}
              
              <div className={styles.userMenu}>
                <Link href="/profile" className={styles.userName}>
                  {user.name}
                </Link>
                <Link href="/profile" className={styles.userAvatar}>
                  {user.avatar && !avatarError ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className={styles.avatar}
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {getInitials(user.name)}
                    </div>
                  )}
                </Link>
              </div>
            </>
          ) : (
            <Link href="/login" className={styles.loginBtn}>
              Войти
            </Link>
          )}
        </nav>

        {/* Мобильное меню (бургер) */}
        <button
          className={styles.burger}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Меню"
        >
          <span className={`${styles.burgerLine} ${isMenuOpen ? styles.open : ""}`} />
          <span className={`${styles.burgerLine} ${isMenuOpen ? styles.open : ""}`} />
          <span className={`${styles.burgerLine} ${isMenuOpen ? styles.open : ""}`} />
        </button>

        {isMenuOpen && (
          <div className={styles.mobileMenu}>
            {isLoading ? (
              <span className={styles.loading}>...</span>
            ) : isAuthenticated && user ? (
              <>
              <div className={styles.mobileUserInfo}>
                <Link href="/profile" className={styles.mobileUserAvatar}>
                  {user.avatar && !avatarError ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className={styles.mobileAvatar}
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className={styles.mobileAvatarPlaceholder}>
                      {getInitials(user.name)}
                    </div>
                  )}
                </Link>
                <div className={styles.mobileUserDetails}>
                  <Link href="/profile" className={styles.mobileUserName}>
                    {user.name}
                  </Link>
                  <button 
                    onClick={() => {
                      logout.mutateAsync();
                      setIsMenuOpen(false);
                    }}
                    className={styles.mobileLogoutBtn}
                  >
                    Выйти
                  </button>
                </div>
              </div>
                <NotificationBell />
                <Link
                  href="/feed"
                  className={styles.mobileLink}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Лента
                </Link>
                <Link
                  href="/profile/offers"
                  className={styles.mobileLink}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Мои отклики
                </Link>
                <Link
                  href="/requests"
                  className={styles.mobileLink}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Мои заявки
                </Link>
                
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={styles.mobileLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Админ-панель
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={styles.mobileLink}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className={styles.mobileRegisterBtn}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}