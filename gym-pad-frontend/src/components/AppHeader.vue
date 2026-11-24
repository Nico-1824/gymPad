<template>
    <header class="app-header">
        <RouterLink to="/"><h1>GymPad</h1></RouterLink>
    </header>
</template>

<style scoped>
.app-header {
    position: absolute;
    top: 1%;
    left: 1%;
    border: 0.1rem solid var(--border);
    border-radius: 0.5rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    background: white;
}

.app-header a {
    color: inherit;
    text-decoration: none;
}

.app-header h1 {
    font-size: 5rem;
    margin: 1rem;
}
</style>
