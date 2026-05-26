"use client";
import Link from "next/link";
import styles from "./page.module.scss";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [cityName, setCityName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleCityRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?from=/");
      return;
    }

    if (!cityName.trim()) {
      setError("Введите название города");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/city-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityName: cityName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка отправки");
      }

      setSuccess(true);
      setCityName("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main>
        {/* Герой */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.title}>
              Local Help<br />
              <span>— помощь, которая всегда рядом</span>
            </h1>
            <p className={styles.subtitle}>
              Бытовые проблемы решаются быстрее и дешевле, когда помощь живёт в
              соседнем подъезде. Никаких долгих поисков и завышенных счетов.
            </p>
            <div className={styles.buttons}>
              {user ? (
                <>
                  <Link href="/requests" className={styles.btnPrimary}>
                    Мои заявки
                  </Link>
                  <Link href="/feed" className={styles.btnSecondary}>
                    Лента заявок
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className={styles.btnPrimary}>
                    Нужна помощь
                  </Link>
                  <Link href="/login" className={styles.btnSecondary}>
                    Могу помочь
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ГЕО: Уже здесь */}
        <section className={styles.citySection}>
          <div className={styles.container}>
            <div className={styles.cityCard}>
              <span className={styles.cityIcon}>📍</span>
              <h2>Работает в Дагестане</h2>
              <p>
                Local Help помогает жителям Махачкалы, Каспийска, Хасавюрта, Дербента и других городов 
                Дагестана находить помощь рядом с домом.
              </p>
              <div className={styles.cityList}>
                <span>Махачкала</span>
                <span>Каспийск</span>
                <span>Хасавюрт</span>
                <span>Дербент</span>
                <span>Буйнакск</span>
                <span>Избербаш</span>
                <span>Кизляр</span>
                <span>Дагестанские Огни</span>
                <span>Южно-Сухокумск</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.cityRequestSection}>
          <div className={styles.container}>
            <div className={styles.cityRequestCard}>
              <h2>Нет вашего города?</h2>
              <p>
                {user 
                  ? "Оставьте заявку, и мы запустим Local Help в вашем городе одним из первых"
                  : "Войдите в аккаунт, чтобы оставить заявку на запуск в вашем городе"
                }
              </p>

              {!user ? (
                <button
                  onClick={() => router.push("/login")}
                  className={styles.cityRequestLoginBtn}
                >
                  Войти, чтобы оставить заявку
                </button>
              ) : (
                <form onSubmit={handleCityRequest} className={styles.cityRequestForm}>
                  <input
                    type="text"
                    placeholder="Название города"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    required
                    className={styles.cityRequestInput}
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !cityName.trim()}
                    className={styles.cityRequestBtn}
                  >
                    {isSubmitting ? "Отправка..." : "Хочу в своём городе"}
                  </button>
                </form>
              )}

              {error && <p className={styles.cityRequestError}>{error}</p>}
              {success && <p className={styles.cityRequestSuccess}>✅ Спасибо! Мы сообщим, когда запустимся.</p>}
            </div>
          </div>
        </section>

        {/* Для заказчика */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.grid2}>
              <div className={styles.content}>
                <span className={styles.badge}>Заказчикам</span>
                <h2 className={styles.sectionTitle}>
                  Найдите мастера за 10 минут без переплат
                </h2>
                <p className={styles.sectionText}>
                  Хватит тратить часы на поиски. Просто создайте заявку — и
                  люди из вашего дома или района откликнутся.
                </p>
                <ul className={styles.list}>
                  <li>🛠️ Ремонт, сантехника, электрика</li>
                  <li>📦 Переезд и помощь с тяжестями</li>
                  <li>🐾 Присмотр за питомцем или ребёнком</li>
                  <li>📚 Помощь с уроками и обучение</li>
                </ul>
              </div>
              <div className={styles.imagePlaceholder}>
                <div className={styles.iconBox}>🛠️</div>
              </div>
            </div>
          </div>
        </section>

        {/* Для исполнителя */}
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <div className={styles.grid2}>
              <div className={styles.imagePlaceholder}>
                <div className={styles.iconBox}>💼</div>
              </div>
              <div className={styles.content}>
                <span className={styles.badge}>Исполнителям</span>
                <h2 className={styles.sectionTitle}>
                  Зарабатывайте на том, что уже умеете
                </h2>
                <p className={styles.sectionText}>
                  Не нужно открывать ИП или платить за рекламу. Просто помогайте
                  соседям и получайте деньги на месте.
                </p>
                <ul className={styles.list}>
                  <li>💰 Полная оплата сразу после работы</li>
                  <li>🗓️ Вы сами выбираете удобное время</li>
                  <li>🏠 Помогаете рядом с домом — без трат на дорогу</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Реальные примеры */}
        <section className={styles.examples}>
          <div className={styles.container}>
            <h2 className={styles.examplesTitle}>
              Реальные ситуации, где Local Help выручил
            </h2>
            <div className={styles.examplesGrid}>
              <div className={styles.exampleCard}>
                <div className={styles.exampleIcon}>🔧</div>
                <h3>Сломалась стиралка</h3>
                <p>
                  Мастер просил 3000₽ и ждать 2 дня. Сосед починил
                  за 1000₽ через 3 часа после заявки.
                </p>
              </div>
              <div className={styles.exampleCard}>
                <div className={styles.exampleIcon}>📦</div>
                <h3>Переезд без грузчиков</h3>
                <p>
                  Двое соседей помогли поднять диван на 5 этаж за 1000₽. Грузчики
                  просили 4000₽.
                </p>
              </div>
              <div className={styles.exampleCard}>
                <div className={styles.exampleIcon}>🐕</div>
                <h3>Срочно уехать на 2 часа</h3>
                <p>
                  Не с кем оставить собаку. Соседка выгуляла и покормила за
                  1000₽.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3 шага */}
        <section className={styles.steps}>
          <div className={styles.container}>
            <h2 className={styles.stepsTitle}>Как всё устроено?</h2>
            <div className={styles.grid3}>
              <div className={styles.card}>
                <div className={styles.cardNumber}>1</div>
                <h3 className={styles.cardTitle}>Создайте заявку</h3>
                <p className={styles.cardText}>
                  Опишите, какая помощь нужна, и предложите свою цену.
                </p>
              </div>
              <div className={styles.card}>
                <div className={styles.cardNumber}>2</div>
                <h3 className={styles.cardTitle}>Получите отклики</h3>
                <p className={styles.cardText}>
                  Исполнители рядом с вами отреагируют в течение часа.
                </p>
              </div>
              <div className={styles.card}>
                <div className={styles.cardNumber}>3</div>
                <h3 className={styles.cardTitle}>Договоритесь и решите</h3>
                <p className={styles.cardText}>
                  Обсудите детали, встретьтесь и закройте вопрос. Оплата на
                  месте.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Безопасность */}
        <section className={styles.sectionSecurity}>
          <div className={styles.container}>
            <h2 className={styles.securityTitle}>Мы заботимся о вашем доверии</h2>
            <div className={styles.securityGrid}>
              <div className={styles.securityCard}>
                <div className={styles.securityIcon}>📱</div>
                <h3>Верификация по телефону</h3>
                <p>Только реальные люди — мы проверяем номера при регистрации</p>
              </div>
              <div className={styles.securityCard}>
                <div className={styles.securityIcon}>⭐</div>
                <h3>Рейтинг и отзывы</h3>
                <p>История исполнителя всегда открыта</p>
              </div>
              <div className={styles.securityCard}>
                <div className={styles.securityIcon}>🔒</div>
                <h3>Контакты после выбора</h3>
                <p>Телефон и адрес получает только выбранный исполнитель</p>
              </div>
              <div className={styles.securityCard}>
                <div className={styles.securityIcon}>🤝</div>
                <h3>Оплата на месте</h3>
                <p>Деньги только за результат после выполнения работы</p>
              </div>
            </div>
          </div>
        </section>

        {/* Преимущества */}
        <section className={styles.sectionBenefits}>
          <div className={styles.container}>
            <h2 className={styles.benefitsTitle}>
              Чем Local Help отличается?
            </h2>
            <div className={styles.benefitsGrid}>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>💰</div>
                <h3>Никакой комиссии</h3>
                <p>100% оплаты идёт исполнителю — мы не берём комиссию</p>
              </div>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>🏠</div>
                <h3>Живут рядом</h3>
                <p>Мастер из соседнего двора приедет быстрее мастера из центра</p>
              </div>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>⚡</div>
                <h3>Просто и быстро</h3>
                <p>Без регистрации ИП, договоров и скрытых комиссий</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaContainer}>
            <h2>Попробуйте Local Help уже сегодня</h2>
            <p>
              Создайте первую заявку или предложите помощь — это бесплатно и
              займёт одну минуту.
            </p>
            <div className={styles.ctaButtons}>
              {user ? (
                <>
                  <Link href="/requests/new" className={styles.btnPrimary}>
                    Создать заявку
                  </Link>
                  <Link href="/feed" className={styles.btnSecondary}>
                    Смотреть заявки
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className={styles.btnPrimary}>
                    Начать
                  </Link>
                  <Link href="/how-it-works" className={styles.btnSecondary}>
                    Как это работает
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}