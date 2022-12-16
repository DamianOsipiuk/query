import { computed, onScopeDispose, ref, watch } from 'vue-demi'
import type { Ref } from 'vue-demi'
import type { MutationFilters as MF } from '@tanstack/query-core'

import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type { MaybeRefDeep, WithQueryClientKey } from './types'

export type MutationFilters = MaybeRefDeep<WithQueryClientKey<MF>>

export function useIsMutating(arg1: MutationFilters = {}): Ref<number> {
  const filters = computed(() => parseFilterArgs(arg1))
  const queryClient =
    filters.value.queryClient ?? useQueryClient(filters.value.queryClientKey)

  const isMutating = ref(queryClient.isMutating(filters))

  const unsubscribe = queryClient.getMutationCache().subscribe(() => {
    isMutating.value = queryClient.isMutating(filters)
  })

  watch(
    filters,
    () => {
      isMutating.value = queryClient.isMutating(filters)
    },
    { deep: true },
  )

  onScopeDispose(() => {
    unsubscribe()
  })

  return isMutating
}

export function parseFilterArgs(
  arg1:  MutationFilters,
) {
  return cloneDeepUnref(arg1) as WithQueryClientKey<MF>
}
