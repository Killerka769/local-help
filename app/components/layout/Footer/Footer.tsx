import Link from 'next/link'
import styles from './Footer.module.scss'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Левая колонка - бренд */}
        <div className={styles.brand}>
          <div className={styles.logo}><Link href={"/"}>Local Help</Link></div>
          <p className={styles.description}>
            Платформа для быстрой помощи по дому от соседей. <br />
            Надёжно, просто и без комиссии.
          </p>
          <div className={styles.social}>
            <a href="https://t.me/KillerkaXD" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Telegram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.0843 4.65649L18.9081 20.0195C18.6734 21.0219 18.0047 21.3029 17.1331 20.8109L12.5156 17.3917L10.2975 19.5257C10.0434 19.7798 9.83185 19.9913 9.34524 19.9913L9.68212 15.288L18.3318 7.34525C18.713 7.00649 18.2499 6.81687 17.7434 7.15562L7.17997 14.1524L2.60843 12.5854C1.54746 12.2466 1.52812 11.5334 2.84246 11.0415L20.4931 4.23411C21.4065 3.89536 22.3199 4.3987 22.0843 4.65649Z" fill="currentColor"/>
              </svg>
            </a>
            <a href="mailto:support@localhelp.ru" className={styles.socialLink} aria-label="Email">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Средняя колонка - ссылки */}
        <div className={styles.links}>
          <div className={styles.linksColumn}>
            <h3 className={styles.linksTitle}>О сервисе</h3>
            <Link href="/" className={styles.link}>На главную</Link>
            <Link href="/how-it-works" className={styles.link}>Как это работает</Link>
            <Link href="/faq" className={styles.link}>FAQ</Link>
          </div>
          <div className={styles.linksColumn}>
            <h3 className={styles.linksTitle}>Правовая информация</h3>
            <Link href="/terms" className={styles.link}>Пользовательское соглашение</Link>
            <Link href="/privacy" className={styles.link}>Политика конфиденциальности</Link>
          </div>
          <div className={styles.linksColumn}>
            <h3 className={styles.linksTitle}>Контакты</h3>
            <Link href="https://t.me/KillerkaXD" target="_blank" rel="noopener noreferrer" className={styles.link}>Telegram</Link>
            <Link href="mailto:gaydar.666@mail.ru" className={styles.link}>gaydar.666@mail.ru</Link>
            {/* <Link href="/advertising" className={styles.link}>Реклама на сайте</Link> */}
          </div>
        </div>
      </div>

      {/* Нижняя полоса */}
      <div className={styles.bottom}>
        <div className={styles.bottomContainer}>
          <p className={styles.copyright}>© {currentYear} Local Help. Все права защищены.</p>
          {/* <p className={styles.disclaimer}>
            Local Help — информационная платформа. Мы не несём ответственность за качество предоставляемых услуг.
          </p> */}
        </div>
      </div>
    </footer>
  )
}