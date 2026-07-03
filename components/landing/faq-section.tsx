import { FAQS } from "@/lib/landing/faq-data";

export function FaqSection() {
  return (
    <section className="bg-brand-surface px-5 py-16 sm:px-8 sm:py-[88px]">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-9 max-w-[600px]">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-brand-text-muted">
            Preguntas frecuentes
          </p>
          <h2 className="text-[26px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
            Lo que quizá te estás preguntando.
          </h2>
        </div>

        <div className="flex flex-col">
          {FAQS.map((faq, index) => (
            <div
              key={faq.id}
              className={`py-5 ${
                index < FAQS.length - 1 ? "border-b border-brand-border" : ""
              }`}
            >
              <h3 className="mb-1.5 text-[15px] font-bold">{faq.question}</h3>
              <p className="max-w-[560px] text-[13.5px] leading-relaxed text-brand-text-secondary">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
