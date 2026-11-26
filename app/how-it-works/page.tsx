"use client";

import Link from "next/link";
import styles from "./page.module.scss";

export default function HowItWorksPage() {
  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Как работает Local Help</h1>
          
          <div className={styles.section}>
            <h2>📌 Для заказчиков (нужна помощь)</h2>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3>Зарегистрируйтесь</h3>
                <p>Введите номер телефона, пароль и выберите город. Это займёт 1 минуту.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3>Создайте заявку</h3>
                <p>Опишите проблему, укажите район или ориентир, бюджет и срок. В ленте видны город и район. Дом и квартиру не пишите. Телефон откроется выбранному помощнику после одобрения — точный адрес обсудите с ним.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3>Дождитесь откликов</h3>
                <p>Соседи, готовые помочь, откликнутся. Вы получите уведомление.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h3>Выберите исполнителя</h3>
                <p>Посмотрите профиль, почитайте комментарий и нажмите «Одобрить».</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>5</div>
              <div className={styles.stepContent}>
                <h3>Свяжитесь и договоритесь</h3>
                <p>После одобрения вам станет доступен телефон исполнителя. Обсудите детали.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>6</div>
              <div className={styles.stepContent}>
                <h3>Подтвердите выполнение</h3>
                <p>Исполнитель отмечает «Я выполнил работу» — вам придёт уведомление. Подтвердите выполнение. После этого обе стороны могут оставить отзыв. Рейтинг считается по отзывам, не автоматически.</p>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>💼 Для исполнителей (могу помочь)</h2>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3>Заполните профиль</h3>
                <p>Добавьте фото, описание своих навыков — это повышает доверие.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3>Найдите заявку в ленте</h3>
                <p>Используйте поиск и фильтры, чтобы найти подходящую задачу.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3>Откликнитесь</h3>
                <p>Напишите комментарий: чем вы можете помочь, какой у вас опыт.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h3>Дождитесь одобрения</h3>
                <p>Если заказчик выберет вас — вы получите уведомление и контакты заказчика.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>5</div>
              <div className={styles.stepContent}>
                <h3>Выполните работу</h3>
                <p>Свяжитесь с заказчиком, обсудите детали и помогите.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>6</div>
              <div className={styles.stepContent}>
                <h3>Подтвердите выполнение</h3>
                <p>После завершения нажмите «Я выполнил работу», затем заказчик подтвердит — и заявка закроется.</p>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>🛡️ Безопасность</h2>
            <ul className={styles.securityList}>
              <li>✅ Телефон виден другой стороне только после одобрения отклика</li>
              <li>✅ В ленте — город и район, без дома и квартиры. Встречайтесь у подъезда или в людном месте. Пускать в квартиру не обязательно.</li>
              <li>✅ Оплата только на месте — платформа не берёт комиссию и не проводит платежи</li>
              <li>✅ Сервисом можно пользоваться с 18 лет. На нарушителя можно пожаловаться</li>
            </ul>
          </div>

          <div className={styles.cta}>
            <Link href="/feed" className={styles.btnPrimary}>Перейти к заявкам</Link>
          </div>
        </div>
      </main>
    </>
  );
}