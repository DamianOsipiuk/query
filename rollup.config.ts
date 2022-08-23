import { RollupOptions } from 'rollup'
import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-size'
import visualizer from 'rollup-plugin-visualizer'
import replace from '@rollup/plugin-replace'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonJS from '@rollup/plugin-commonjs'
import path from 'path'
import svelte from 'rollup-plugin-svelte'

type Options = {
  input: string
  packageDir: string
  external: RollupOptions['external']
  banner: string
  jsName: string
  outputFile: string
  globals: Record<string, string>
}

const umdDevPlugin = (type: 'development' | 'production') =>
  replace({
    'process.env.NODE_ENV': `"${type}"`,
    delimiters: ['', ''],
    preventAssignment: true,
  })

const babelPlugin = babel({
  babelHelpers: 'bundled',
  exclude: /node_modules/,
  extensions: ['.ts', '.tsx'],
})

export default function rollup(options: RollupOptions): RollupOptions[] {
  return [
    ...buildConfigs({
      name: 'query-core',
      packageDir: 'packages/query-core',
      jsName: 'QueryCore',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {},
    }),
    ...buildConfigs({
      name: 'query-async-storage-persister',
      packageDir: 'packages/query-async-storage-persister',
      jsName: 'QueryAsyncStoragePersister',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {
        '@tanstack/react-query-persist-client': 'ReactQueryPersistClient',
      },
    }),
    ...buildConfigs({
      name: 'query-broadcast-client-experimental',
      packageDir: 'packages/query-broadcast-client-experimental',
      jsName: 'QueryBroadcastClient',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {
        '@tanstack/query-core': 'QueryCore',
        'broadcast-channel': 'BroadcastChannel',
      },
    }),
    ...buildConfigs({
      name: 'query-sync-storage-persister',
      packageDir: 'packages/query-sync-storage-persister',
      jsName: 'QuerySyncStoragePersister',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {
        '@tanstack/react-query-persist-client': 'ReactQueryPersistClient',
      },
    }),
    ...buildConfigs({
      name: 'react-query',
      packageDir: 'packages/react-query',
      jsName: 'ReactQuery',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        '@tanstack/query-core': 'QueryCore',
        'use-sync-external-store/shim/index.js': 'UseSyncExternalStore',
      },
      bundleUMDGlobals: [
        '@tanstack/query-core',
        'use-sync-external-store/shim/index.js',
      ],
    }),
    ...buildConfigs({
      name: 'react-query-devtools',
      packageDir: 'packages/react-query-devtools',
      jsName: 'ReactQueryDevtools',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        '@tanstack/react-query': 'ReactQuery',
        '@tanstack/match-sorter-utils': 'MatchSorterUtils',
        'use-sync-external-store/shim/index.js': 'UseSyncExternalStore',
      },
      bundleUMDGlobals: [
        '@tanstack/match-sorter-utils',
        'use-sync-external-store/shim/index.js',
      ],
    }),
    ...buildConfigs({
      name: 'react-query-devtools-noop',
      packageDir: 'packages/react-query-devtools',
      jsName: 'ReactQueryDevtools',
      outputFile: 'noop',
      entryFile: 'src/noop.ts',
      globals: {
        react: 'React',
        '@tanstack/react-query': 'ReactQuery',
      },
    }),
    ...buildConfigs({
      name: 'react-query-persist-client',
      packageDir: 'packages/react-query-persist-client',
      jsName: 'ReactQueryPersistClient',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {
        react: 'React',
        '@tanstack/query-core': 'QueryCore',
        '@tanstack/react-query': 'ReactQuery',
      },
    }),
  ]
}

function buildConfigs(opts: {
  packageDir: string
  name: string
  jsName: string
  outputFile: string
  entryFile: string
  globals: Record<string, string>
  // This option allows to bundle specified dependencies for umd build
  bundleUMDGlobals?: string[]
}): RollupOptions[] {
  const input = path.resolve(opts.packageDir, opts.entryFile)
  const externalDeps = Object.keys(opts.globals)

  const bundleUMDGlobals = opts.bundleUMDGlobals || []
  const umdExternal = externalDeps.filter(
    (external) => !bundleUMDGlobals.includes(external),
  )

  const external = (moduleName) => externalDeps.includes(moduleName)
  const banner = createBanner(opts.name)

  const options: Options = {
    input,
    jsName: opts.jsName,
    outputFile: opts.outputFile,
    packageDir: opts.packageDir,
    external,
    banner,
    globals: opts.globals,
  }

  return [
    esm(options),
    cjs(options),
    umdDev({ ...options, external: umdExternal }),
    umdProd({ ...options, external: umdExternal }),
  ]
}

function esm({ input, packageDir, external, banner }: Options): RollupOptions {
  return {
    // ESM
    external,
    input,
    output: {
      format: 'esm',
      entryFileNames: '[name].mjs',
      sourcemap: true,
      dir: `${packageDir}/build/lib`,
      banner,
    },
    plugins: [
      svelte(),
      babelPlugin,
      commonJS(),
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
    ],
  }
}

function cjs({ input, external, packageDir, banner }: Options): RollupOptions {
  return {
    // CJS
    external,
    input,
    output: {
      format: 'cjs',
      sourcemap: true,
      dir: `${packageDir}/build/lib`,
      exports: 'named',
      banner,
    },
    plugins: [
      svelte(),
      babelPlugin,
      commonJS(),
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
    ],
  }
}

function umdDev({
  input,
  external,
  packageDir,
  outputFile,
  globals,
  banner,
  jsName,
}: Options): RollupOptions {
  return {
    // UMD (Dev)
    external,
    input,
    output: {
      format: 'umd',
      sourcemap: true,
      file: `${packageDir}/build/umd/${outputFile}.development.js`,
      name: jsName,
      globals,
      banner,
    },
    plugins: [
      svelte(),
      babelPlugin,
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
      commonJS(),
      umdDevPlugin('development'),
    ],
  }
}

function umdProd({
  input,
  external,
  packageDir,
  outputFile,
  globals,
  banner,
  jsName,
}: Options): RollupOptions {
  return {
    // UMD (Prod)
    external,
    input,
    output: {
      format: 'umd',
      sourcemap: true,
      file: `${packageDir}/build/umd/${outputFile}.production.js`,
      name: jsName,
      globals,
      banner,
    },
    plugins: [
      svelte(),
      babelPlugin,
      commonJS(),
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
      umdDevPlugin('production'),
      terser({
        mangle: true,
        compress: true,
      }),
      size({}),
      visualizer({
        filename: `${packageDir}/build/stats-html.html`,
        gzipSize: true,
      }),
      visualizer({
        filename: `${packageDir}/build/stats.json`,
        json: true,
        gzipSize: true,
      }),
    ],
  }
}

function createBanner(libraryName: string) {
  return `/**
 * ${libraryName}
 *
 * Copyright (c) TanStack
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */`
}
