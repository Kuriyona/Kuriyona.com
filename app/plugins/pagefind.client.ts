export default defineNuxtPlugin(async () => {
  await import('@pagefind/component-ui')
  await import('@pagefind/component-ui/css')
})
