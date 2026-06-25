<script setup lang="ts">
const props = withDefaults(defineProps<{
  direction?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  modelValue?: boolean
}>(), {
  direction: 'bottom',
  align: 'start',
  modelValue: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const menu = ref<HTMLElement | null>(null)
const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

onClickOutside(menu, () => {
  isOpen.value = false
})

const positionClass = computed(() => {
  const d = props.direction
  const a = props.align
  if (d === 'bottom') {
    if (a === 'start') return 'top-full left-0 mt-2'
    if (a === 'center') return 'top-full left-1/2 -translate-x-1/2 mt-2'
    if (a === 'end') return 'top-full right-0 mt-2'
  }
  if (d === 'top') {
    if (a === 'start') return 'bottom-full left-0 mb-2'
    if (a === 'center') return 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    if (a === 'end') return 'bottom-full right-0 mb-2'
  }
  if (d === 'left') {
    if (a === 'start') return 'right-full top-0 mr-2'
    if (a === 'center') return 'right-full top-1/2 -translate-y-1/2 mr-2'
    if (a === 'end') return 'right-full bottom-0 mr-2'
  }
  if (d === 'right') {
    if (a === 'start') return 'left-full top-0 ml-2'
    if (a === 'center') return 'left-full top-1/2 -translate-y-1/2 ml-2'
    if (a === 'end') return 'left-full bottom-0 ml-2'
  }
  return ''
})
</script>

<template>
  <div ref="menu" class="relative inline-block">
    <div @click="isOpen = !isOpen">
      <slot name="trigger" />
    </div>
    <div
      v-if="isOpen"
      class="absolute z-50 bg-black border border-white/5 rounded-lg p-2"
      :class="positionClass"
      @click.stop
    >
      <slot />
    </div>
  </div>
</template>
