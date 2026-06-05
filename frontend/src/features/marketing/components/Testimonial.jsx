export default function Testimonial() {
  return (
    <section className="section !py-20">
      <div className="relative mx-auto max-w-4xl">
        <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-tr from-primary/10 via-secondary/10 to-transparent blur-3xl" />

        <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] p-10 backdrop-blur-xl sm:p-14">
          <svg
            viewBox="0 0 32 32"
            fill="currentColor"
            className="h-10 w-10 text-primary/70"
            aria-hidden
          >
            <path d="M10 8C5.6 8 2 11.6 2 16v8h8v-8H6c0-2.2 1.8-4 4-4V8zm14 0c-4.4 0-8 3.6-8 8v8h8v-8h-4c0-2.2 1.8-4 4-4V8z" />
          </svg>

          <blockquote className="mt-6 text-2xl font-medium leading-snug text-white sm:text-3xl">
            “FlowOps helped us reduce waiting confusion and improve customer
            experience{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              significantly
            </span>
            .”
          </blockquote>

          <div className="mt-8 flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
              SB
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Service Business Owner
              </p>
              <p className="text-xs text-slate-400">
                Multi-location operator · FlowOps customer
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
