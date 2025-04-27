<template>
    <ChatComponent :model="model" />
</template>

<script lang="ts" setup>
import { Model } from '../Model';
const model = new Model();
</script>