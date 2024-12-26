<template>
    <header class="login-header">
        <img class="logo" src="/src/assets/Logo UM.png" alt="Logo">
        <h1 class="header-title">IDS Web Application</h1>
    </header>
</template>
  
<style scoped>
  .login-header {
    display: flex;
    justify-content: left;
    align-items: center;
    padding: 0.5em; /* Adjust the padding */
    background-color: #000000; /* White with 80% opacity */
    color: #FFFFFF;
    font-size: 14px; /* Adjust the font size */
    font-weight: bold;
    border-top: 3px solid #000080;
    border-bottom: 1px solid #FFE140;
    margin-bottom: 0em;
    height: 60px; /* Adjust the height of the header */
}

.logo {
    width: 55px; /* Adjust the width of the logo */
    height: 55px; /* Adjust the height of the logo */
    margin-right: 10px; /* Add some margin between the logo and the text */
    opacity: 0;
    transform: translateX(-20px);
    animation: slideIn 0.8s forwards;
}
.logo:hover {
    transform: scale(1.1); /* Slight zoom */
}
.header-title {
  margin-left: 10px;
  margin-right: auto;
  font-size: 30px;
  opacity: 0;
  transform: translateX(-20px);
  animation: slideIn 0.8s forwards;
}

/* Animation for sliding in */
@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

</style>
  
