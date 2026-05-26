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
                <p>Опишите проблему, укажите адрес, бюджет и срок. Чем подробнее — тем быстрее найдётся помощник.</p>
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
                <p>Когда работа сделана, нажмите «Заявка выполнена». Исполнитель получит +1 к рейтингу.</p>
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
              <li>✅ Телефон и адрес видны только после одобрения отклика</li>
              <li>✅ Вы сами решаете, кому доверить задачу</li>
              <li>✅ Оплата только на месте — платформа не берёт комиссию</li>
              <li>✅ Вы можете пожаловаться на нарушителя</li>
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