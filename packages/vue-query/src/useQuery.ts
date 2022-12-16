import type { ToRefs } from 'vue-demi'
import { QueryObserver } from '@tanstack/query-core'
import type {
  QueryKey,
  QueryObserverResult,
  DefinedQueryObserverResult,
} from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type { UseQueryReturnType as UQRT } from './useBaseQuery'
import type {
  WithQueryClientKey,
  VueQueryObserverOptions,
  DistributiveOmit,
} from './types'

export type UseQueryReturnType<TData, TError> = DistributiveOmit<
  UQRT<TData, TError>,
  'refetch' | 'remove'
> & {
  refetch: QueryObserverResult<TData, TError>['refetch']
  remove: QueryObserverResult<TData, TError>['remove']
}

export type UseQueryDefinedReturnType<TData, TError> = DistributiveOmit<
  ToRefs<Readonly<DefinedQueryObserverResult<TData, TError>>>,
  'refetch' | 'remove'
> & {
  suspense: () => Promise<QueryObserverResult<TData, TError>>
  refetch: QueryObserverResult<TData, TError>['refetch']
  remove: QueryObserverResult<TData, TError>['remove']
}

export type UseQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = WithQueryClientKey<
  VueQueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>
>

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'initialData'
  > & { initialData?: () => undefined },
): UseQueryReturnType<TData, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'initialData'
  > & { initialData: TQueryFnData | (() => TQueryFnData) },
): UseQueryDefinedReturnType<TData, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryReturnType<TData, TError>

export function useQuery<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  arg1: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
):
  | UseQueryReturnType<TData, TError>
  | UseQueryDefinedReturnType<TData, TError> {
  const result = useBaseQuery(QueryObserver, arg1)

  return {
    ...result,
    refetch: result.refetch.value,
    remove: result.remove.value,
  }
}
