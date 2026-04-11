<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
    <main class="landing">

        <!-- Hero -->
        <section class="hero">
            <div class="hero__inner">

                <!-- Logo -->
                <div class="hero__logo">
                    <svg width="44" height="44" viewBox="0 0 112 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M56,4 Q28,0 4,4 L4,100 Q28,96 56,100 Z" fill="#35495e"/>
                        <path d="M56,4 Q84,0 108,4 L108,100 Q84,96 56,100 Z" fill="#2d3f51"/>
                        <line x1="56" y1="4" x2="56" y2="100" stroke="rgba(0,0,0,0.3)" stroke-width="2.5"/>
                        <line x1="12" y1="36" x2="50" y2="36" stroke="white" stroke-width="1.5" opacity="0.3"/>
                        <line x1="12" y1="52" x2="50" y2="52" stroke="white" stroke-width="1.5" opacity="0.3"/>
                        <line x1="12" y1="68" x2="50" y2="68" stroke="white" stroke-width="1.5" opacity="0.3"/>
                        <polyline points="62,58 74,58 82,28 92,84 100,58 110,58" fill="none" stroke="white" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="110" cy="58" r="6" fill="white"/>
                    </svg>
                    <span class="hero__logo-text">PagePulse</span>
                </div>

                <h1 class="hero__slogan">Reading Made Easy</h1>
                <p class="hero__sub">Discover, organise, and share your favourite books — all in one place.</p>
            </div>

            <!-- Wave transitioning to dark bg -->
            <div class="hero__wave">
                <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#1a1a1d"/>
                </svg>
            </div>
        </section>

        <!-- Feature Cards -->
        <section class="features">
            <div class="features__grid">

                <div class="feature-card" @click="router.push('/catalogue')">
                    <div class="feature-card__icon-wrap feature-card__icon-wrap--primary">
                        <i class="pi pi-search feature-card__icon"/>
                    </div>
                    <h2 class="feature-card__title">Browse Catalogue</h2>
                    <p class="feature-card__desc">Search millions of books by title, author, or genre. Powered by the Open Library.</p>
                    <span class="feature-card__link">Start browsing <i class="pi pi-arrow-right"/></span>
                </div>

                <div class="feature-card" @click="router.push('/login')">
                    <div class="feature-card__icon-wrap feature-card__icon-wrap--primary">
                        <i class="pi pi-user-plus feature-card__icon"/>
                    </div>
                    <h2 class="feature-card__title">Register an Account</h2>
                    <p class="feature-card__desc">Create a free account to save books to your shelf and join reading groups.</p>
                    <span class="feature-card__link">Sign up free <i class="pi pi-arrow-right"/></span>
                </div>

                <div class="feature-card feature-card--no-hover">
                    <div class="feature-card__icon-wrap feature-card__icon-wrap--muted">
                        <i class="pi pi-info-circle feature-card__icon"/>
                    </div>
                    <h2 class="feature-card__title">About Us</h2>
                    <p class="feature-card__desc">
                        PagePulse is built by <strong class="feature-card__strong">Poseidon Development Studios</strong>
                        — a team of five students at Ontario Tech University. Our mission is to make book discovery
                        simple, social, and enjoyable for every kind of reader.
                    </p>
                </div>

                <div class="feature-card feature-card--no-hover">
                    <div class="feature-card__icon-wrap feature-card__icon-wrap--muted">
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
            <svg width="14" height="14" viewBox="0 0 112 104" fill="none" style="display:inline;vertical-align:middle;margin-right:4px">
                <path d="M56,4 Q28,0 4,4 L4,100 Q28,96 56,100 Z" fill="#35495e"/>
                <path d="M56,4 Q84,0 108,4 L108,100 Q84,96 56,100 Z" fill="#42b883"/>
                <polyline points="62,58 74,58 82,28 92,84 100,58 110,58" fill="none" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            PagePulse &copy; 2026 Poseidon Development Studios
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
    color: #e2e8f0;
}

/* ── Hero ───────────────────────────────────────────────── */
.hero {
    position: relative;
    background: linear-gradient(135deg, #35495e 0%, #3d6b58 50%, #42b883 100%);
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
    gap: 0.7rem;
}

.hero__logo-text {
    font-size: 2.4rem;
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
    color: rgba(255, 255, 255, 0.82);
    margin: 0;
    max-width: 480px;
}

/* ── Wave ───────────────────────────────────────────────── */
.hero__wave {
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 60px;
}

.hero__wave svg {
    width: 100%;
    height: 100%;
}

/* ── Features ───────────────────────────────────────────── */
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
    background: #22272e;
    border: 1px solid #2d3748;
    border-radius: 1rem;
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    cursor: pointer;
    transition: all 0.18s ease;
}

.feature-card:hover {
    transform: translateY(-3px);
    border-color: #42b883;
    box-shadow: 0 8px 24px rgba(66, 184, 131, 0.12);
}

.feature-card--no-hover {
    cursor: default;
}

.feature-card--no-hover:hover {
    transform: none;
    border-color: #2d3748;
    box-shadow: none;
}

/* ── Icon wrap ──────────────────────────────────────────── */
.feature-card__icon-wrap {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.feature-card__icon-wrap--primary {
    background: rgba(66, 184, 131, 0.15);
}

.feature-card__icon-wrap--muted {
    background: rgba(255, 255, 255, 0.06);
}

.feature-card__icon-wrap--primary .feature-card__icon {
    color: #42b883;
    font-size: 1.35rem;
}

.feature-card__icon-wrap--muted .feature-card__icon {
    color: #94a3b8;
    font-size: 1.35rem;
}

/* ── Card text ──────────────────────────────────────────── */
.feature-card__title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #e2e8f0;
    margin: 0;
}

.feature-card__desc {
    font-size: 0.9rem;
    color: #94a3b8;
    line-height: 1.6;
    margin: 0;
}

.feature-card__strong {
    color: #42b883;
    font-weight: 600;
}

.feature-card__link {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.88rem;
    font-weight: 600;
    color: #42b883;
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
    color: #64748b;
    border-top: 1px solid #2d3748;
}
</style>
