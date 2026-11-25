<template>
    <header class="app-header">
        <RouterLink to="/"><h1>GymPad</h1></RouterLink>
    </header>
</template>

<style scoped>
/* Phones/tablets: a normal block at the top, so it never covers the cards */
.app-header {
    align-self: flex-start;
    margin-bottom: 1.25rem;
    border: 0.1rem solid var(--border);
    border-radius: 0.5rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    background: white;
}

.app-header a {
    display: block;
    color: inherit;
    text-decoration: none;
}

.app-header h1 {
    margin: 0.4rem 0.9rem;
    font-size: 2rem;
    line-height: 1.2;
}

/* Wide screens: the big floating logo in the corner */
@media (min-width: 1200px) {
    .app-header {
        position: absolute;
        top: 1%;
        left: 1%;
        margin: 0;
    }

    .app-header h1 {
        margin: 1rem;
        font-size: 5rem;
    }
}
</style>
