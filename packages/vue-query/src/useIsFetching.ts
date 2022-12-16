import { computed, onScopeDispose, ref, watch } from 'vue-demi'
import type { Ref } from 'vue-demi'
import type { QueryFilters as QF } from '@tanstack/query-core'

import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type { MaybeRefDeep, WithQueryClientKey } from './types'

export type QueryFilters = MaybeRefDeep<WithQueryClientKey<QF>>

export function useIsFetching(arg1: QueryFilters = {}): Ref<number> {
  const filters = computed(() => parseFilterArgs(arg1))
  const queryClient =
    filters.value.queryClient ?? useQueryClient(filters.value.queryClientKey)

  const isFetching = ref(queryClient.isFetching(filters))

  const unsubscribe = queryClient.getQueryCache().subscribe(() => {
    isFetching.value = queryClient.isFetching(filters)
  })

  watch(
    filters,
    () => {
      isFetching.value = queryClient.isFetching(filters)
    },
    { deep: true },
  )

  onScopeDispose(() => {
    unsubscribe()
  })

  return isFetching
}

export function parseFilterArgs(
  filters: QueryFilters,
) {
  return cloneDeepUnref(filters) as WithQueryClientKey<QF>
}
