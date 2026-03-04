<template>
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>📖 Book Details</h2>
    <p>You are looking at the details for: <strong>{{ $route.params.title }}</strong></p>

    <br>
    <router-link to="/">🔙 Go Back Home</router-link>
  </div>
</template>