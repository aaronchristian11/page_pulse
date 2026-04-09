<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()
</script>

<template>
    <main class="landing">

        <!-- Hero Section -->
        <section class="hero">
            <div class="hero__inner">

                <!-- Logo -->
                <div class="hero__logo">
                    <i class="pi pi-heart-fill hero__logo-icon"/>
                    <span class="hero__logo-text">PagePulse</span>
                </div>

                <!-- Slogan -->
                <h1 class="hero__slogan">Reading Made Easy</h1>
                <p class="hero__sub">Discover, organise, and share your favourite books — all in one place.</p>

            </div>

            <!-- Decorative wave -->
            <div class="hero__wave">
                <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="currentColor"/>
                </svg>
            </div>
        </section>

        <!-- Feature Cards -->
        <section class="features">
            <div class="features__grid">

                <div class="feature-card" @click="router.push('/catalogue')">
                    <div class="feature-card__icon-wrap feature-card__icon-wrap--blue">
                        <i class="pi pi-search feature-card__icon"/>
                    </div>
                    <h2 class="feature-card__title">Browse Catalogue</h2>
                    <p class="feature-card__desc">Search millions of books by title, author, or genre. Powered by the Open Library.</p>
                    <span class="feature-card__link">Start browsing <i class="pi pi-arrow-right"/></span>
                </div>

                <div class="feature-card" @click="router.push('/login')">
                    <div class="feature-card__icon-wrap feature-card__icon-wrap--green">
                        <i class="pi pi-user-plus feature-card__icon"/>
                    </div>
                    <h2 class="feature-card__title">Register an Account</h2>
                    <p class="feature-card__desc">Create a free account to save books to your shelf and join reading groups.</p>
                    <span class="feature-card__link">Sign up free <i class="pi pi-arrow-right"/></span>
                </div>

                <div class="feature-card feature-card--no-hover">
                    <div class="feature-card__icon-wrap feature-card__icon-wrap--purple">
                        <i class="pi pi-info-circle feature-card__icon"/>
                    </div>
                    <h2 class="feature-card__title">About Us</h2>
                    <p class="feature-card__desc">
                        PagePulse is built by <strong>Poseidon Development Studios</strong> — a team of five students at Ontario Tech University. Our mission is to make book discovery simple, social, and enjoyable for every kind of reader.
                    </p>
                </div>

                <div class="feature-card feature-card--no-hover">
                    <div class="feature-card__icon-wrap feature-card__icon-wrap--amber">
                        <i class="pi pi-envelope feature-card__icon"/>
                    </div>
                    <h2 class="feature-card__title">Contact Support</h2>
                    <p class="feature-card__desc">Having trouble? We're here to help. Reach out and we'll get back to you as soon as possible.</p>
                    <a class="feature-card__link" href="mailto:support@pagepulse.app">
                        support@pagepulse.app <i class="pi pi-external-link"/>
                    </a>
                </div>

            </div>
        </section>

        <!-- Footer -->
        <footer class="landing-footer">
            <span><i class="pi pi-heart-fill" style="color: var(--p-primary-500)"/> PagePulse &copy; 2026 Poseidon Development Studios</span>
        </footer>

    </main>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────── */
.landing {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #1a1a1d;
}

/* ── Hero ───────────────────────────────────────────────── */
.hero {
    position: relative;
    background: linear-gradient(135deg, var(--p-primary-700, #4338ca) 0%, var(--p-primary-500, #6366f1) 60%, var(--p-primary-400, #818cf8) 100%);
    padding: 5rem 1.5rem 6rem;
    text-align: center;
    overflow: hidden;
}

.hero__inner {
    position: relative;
    z-index: 1;
    max-width: 680px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
}

.hero__logo {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.hero__logo-icon {
    font-size: 2.5rem;
    color: #fca5a5;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.25));
}

.hero__logo-text {
    font-size: 2.5rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.5px;
}

.hero__slogan {
    font-size: 3rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.15;
    margin: 0;
    letter-spacing: -1px;
}

.hero__sub {
    font-size: 1.1rem;
    color: rgba(255,255,255,0.8);
    margin: 0;
    max-width: 480px;
}

.hero__actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 0.5rem;
}

/* ── CTA Buttons ────────────────────────────────────────── */
.cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.75rem;
    border-radius: 9999px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
    border: 2px solid transparent;
}

.cta-btn--primary {
    background: #ffffff;
    color: var(--p-primary-600, #4f46e5);
    border-color: #ffffff;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.cta-btn--primary:hover {
    background: var(--p-primary-50, #eef2ff);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
}

.cta-btn--outline {
    background: transparent;
    color: #ffffff;
    border-color: rgba(255,255,255,0.7);
}

.cta-btn--outline:hover {
    background: rgba(255,255,255,0.15);
    border-color: #ffffff;
    transform: translateY(-2px);
}

/* ── Wave ───────────────────────────────────────────────── */
.hero__wave {
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 60px;
    color: #1a1a1d;
}

.hero__wave svg {
    width: 100%;
    height: 100%;
}

/* ── Features Grid ──────────────────────────────────────── */
.features {
    flex: 1;
    padding: 3rem 1.5rem 2rem;
    background: #1a1a1d;
}

.features__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
    max-width: 900px;
    margin: 0 auto;
}

/* ── Feature Card ───────────────────────────────────────── */
.feature-card {
    background: var(--p-surface-0, #ffffff);
    border: 1px solid var(--p-surface-200, #e2e8f0);
    border-radius: 1rem;
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    cursor: pointer;
    transition: all 0.18s ease;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.feature-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    border-color: var(--p-primary-300, #a5b4fc);
}

.feature-card--no-hover {
    cursor: default;
}

.feature-card--no-hover:hover {
    transform: none;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    border-color: var(--p-surface-200, #e2e8f0);
}

.feature-card__icon-wrap {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.feature-card__icon-wrap--blue   { background: #dbeafe; }
.feature-card__icon-wrap--green  { background: #dcfce7; }
.feature-card__icon-wrap--purple { background: #ede9fe; }
.feature-card__icon-wrap--amber  { background: #fef3c7; }

.feature-card__icon {
    font-size: 1.35rem;
}

.feature-card__icon-wrap--blue   .feature-card__icon { color: #2563eb; }
.feature-card__icon-wrap--green  .feature-card__icon { color: #16a34a; }
.feature-card__icon-wrap--purple .feature-card__icon { color: #7c3aed; }
.feature-card__icon-wrap--amber  .feature-card__icon { color: #d97706; }

.feature-card__title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--p-surface-900, #0f172a);
    margin: 0;
}

.feature-card__desc {
    font-size: 0.9rem;
    color: var(--p-surface-500, #64748b);
    line-height: 1.55;
    margin: 0;
}

.feature-card__desc--muted {
    color: var(--p-surface-400, #94a3b8);
    font-size: 0.82rem;
}

.feature-card__link {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--p-primary-500, #6366f1);
    text-decoration: none;
    margin-top: auto;
}

.feature-card__link:hover {
    text-decoration: underline;
}

/* ── Footer ─────────────────────────────────────────────── */
.landing-footer {
    text-align: center;
    padding: 1.5rem;
    font-size: 0.82rem;
    color: var(--p-surface-400, #94a3b8);
    border-top: 1px solid var(--p-surface-200, #e2e8f0);
}

/* ── Dark mode ──────────────────────────────────────────── */
.dark .hero,
:root[class*="dark"] .hero {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #3730a3 100%);
}

.dark .hero__wave,
:root[class*="dark"] .hero__wave {
    color: var(--p-surface-900, #0f172a);
}

.dark .landing,
:root[class*="dark"] .landing {
    background: var(--p-surface-900, #0f172a);
}

.dark .feature-card,
:root[class*="dark"] .feature-card {
    background: var(--p-surface-800, #1e293b);
    border-color: var(--p-surface-700, #334155);
}

.dark .feature-card__title,
:root[class*="dark"] .feature-card__title {
    color: var(--p-surface-50, #f8fafc);
}

.dark .landing-footer,
:root[class*="dark"] .landing-footer {
    border-color: var(--p-surface-700, #334155);
    background: var(--p-surface-900, #0f172a);
}
</style>
