import { dual, identity, pipe } from "@effect/data/Function"
import * as Option from "@effect/data/Option"
import * as RA from "@effect/data/ReadonlyArray"

import { Monoid } from "@effect/data/typeclass/Monoid"
import * as applicative from "@effect/data/typeclass/Applicative"
import * as foldable from "@effect/data/typeclass/Foldable"
import * as equivalence from "@effect/data/typeclass/Equivalence"

import {Show} from './typeclasses';
import { Kind, TypeLambda } from "@effect/data/HKT";

/**
 * Multi-way RoseTrees (aka rose RoseTrees) and branchess, where a branches is
 *
 * ```ts
 * type Branches<A> = Array<RoseTree<A>>
 * ```
 *
 */


// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export type Branches<A> = Array<RoseTree<A>>

export interface RoseTree<A> {
  readonly value: A
  readonly branches: Branches<A>
}

export function make<A>(value: A, branches: Branches<A> = []): RoseTree<A> {
  return {
    value,
    branches
  }
}

export function getShow<A>(S: Show<A>): Show<RoseTree<A>> {
  const show = (t: RoseTree<A>): string => {
    return RA.isEmptyArray(t.branches)
      ? `make(${S.show(t.value)})`
      : `make(${S.show(t.value)}, [${t.branches.map(show).join(', ')}])`
  }
  return {
    show
  }
}

const draw = (indentation: string, branches: Branches<string>): string => {
  let r = ''
  const len = branches.length
  let RoseTree: RoseTree<string>
  for (let i = 0; i < len; i++) {
    RoseTree = branches[i]
    const isLast = i === len - 1
    r += indentation + (isLast ? '└' : '├') + '─ ' + RoseTree.value
    r += draw(indentation + (len > 1 && !isLast ? '│  ' : '   '), RoseTree.branches)
  }
  return r
}

/**
 * Neat 2-dimensional drawing of a branches
 *
 * @since 2.0.0
 */
export function drawBranches(branches: Branches<string>): string {
  return draw('\n', branches)
}

/**
 * Neat 2-dimensional drawing of a RoseTree
 *
 * @example
 * import { make, drawRoseTree } from 'fp-ts/RoseTree'
 *
 * const fa = make('a', [
 *   make('b'),
 *   make('c'),
 *   make('d', [make('e'), make('f')])
 * ])
 *
 * assert.strictEqual(drawRoseTree(fa), `a
 * ├─ b
 * ├─ c
 * └─ d
 *    ├─ e
 *    └─ f`)
 *
 *
 * @since 2.0.0
 */
export function drawRoseTree(RoseTree: RoseTree<string>): string {
  return RoseTree.value + drawBranches(RoseTree.branches)
}

export function unfoldRoseTree<A, B>(b: B, f: (b: B) => [A, Array<B>]): RoseTree<A> {
  const [a, bs] = f(b)
  return { value: a, branches: unfoldBranches(bs, f) }
}

export function unfoldBranches<A, B>(bs: Array<B>, f: (b: B) => [A, Array<B>]): Branches<A> {
  return bs.map((b) => unfoldRoseTree(b, f))
}


export function fold<A, B>(f: (a: A, bs: Array<B>) => B): (fa: RoseTree<A>) => B {
  const go = (fa: RoseTree<A>): B => f(fa.value, fa.branches.map(go))
  return go
}

const _map = <A,B>(fa: RoseTree<A>, f:(a:A) => B) => pipe(fa, map(f))

const _ap = <A,B>(fab: RoseTree<(a: A) => B>, fa: RoseTree<A>) =>
  pipe(
    fab,
    chain((f) => pipe(fa, map(f)))
  )

const _chain = <A, B>(ma: RoseTree<A>, f: (a: A) => RoseTree<B>): RoseTree<B> => pipe(ma, chain(f))

const _reduce = <A, B>(fa: RoseTree<A>, b: B, f: (b: B, a: A) => B): B => pipe(fa, reduce(b, f))

const _foldMap = <M>(M: Monoid<M>) => {
  const foldMapM = foldMap(M)
  return <A>(fa: RoseTree<A>, f:(a:A) => M) => pipe(fa, foldMapM(f))
}
const _reduceRight = <A, B>(fa: RoseTree<A>, b: B, f: (a: A, b: B) => B): B => pipe(fa, reduceRight(b, f))

const _extend = <A,B>(wa:RoseTree<A>, f: (wa: RoseTree<A>) => B) => pipe(wa, extend(f))

// const _traverse = <F extends TypeLambda>(F: applicative.Applicative<F>): (<A, B>(ta: RoseTree<A>, f: (a: A) => HKT<F, B>) => HKT<F, RoseTree<B>>) => {
//   const traverseF = traverse(F)
//   return (ta, f) => pipe(ta, traverseF(f))
// }

export const ap: <A>(fa: RoseTree<A>) => <B>(fab: RoseTree<(a: A) => B>) => RoseTree<B> = (fa) => (fab) => _ap(fab, fa)

export const chain =
  <A, B>(f: (a: A) => RoseTree<B>) =>
  (ma: RoseTree<A>): RoseTree<B> => {
    const { value, branches } = f(ma.value)
    const combine = RA.getMonoid<RoseTree<B>>().combine
    return {
      value,
      branches: combine(branches, ma.branches.map(chain(f))) as Branches<B>
    }
  }

export const extend: <A, B>(f: (wa: RoseTree<A>) => B) => (wa: RoseTree<A>) => RoseTree<B> = (f) => (wa) => ({
  value: f(wa),
  branches: wa.branches.map(extend(f))
})

export const duplicate: <A>(wa: RoseTree<A>) => RoseTree<RoseTree<A>> = extend(identity)

export const flatten: <A>(mma: RoseTree<RoseTree<A>>) => RoseTree<A> = chain(identity)

/**
 * `map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
 * use the type constructor `F` to represent some computational context.
 *
 * @category mapping
 * @since 2.0.0
 */
export const map: <A, B>(f: (a: A) => B) => (fa: RoseTree<A>) => RoseTree<B> = (f) => (fa) => ({
  value: f(fa.value),
  branches: fa.branches.map(map(f))
})

/**
 * @category folding
 * @since 2.0.0
 */
export const reduce =
  <A, B>(b: B, f: (b: B, a: A) => B) =>
  (fa: RoseTree<A>): B => {
    let r: B = f(b, fa.value)
    const len = fa.branches.length
    for (let i = 0; i < len; i++) {
      r = pipe(fa.branches[i], reduce(r, f))
    }
    return r
  }

/**
 * @category folding
 * @since 2.0.0
 */
export const foldMap: <M>(M: Monoid<M>) => <A>(f: (a: A) => M) => (fa: RoseTree<A>) => M = (M) => (f) =>
  reduce(M.empty, (acc, a) => M.combine(acc, f(a)))

/**
 * @category folding
 * @since 2.0.0
 */
export const reduceRight =
  <A, B>(b: B, f: (a: A, b: B) => B) =>
  (fa: RoseTree<A>): B => {
    let r: B = b
    const len = fa.branches.length
    for (let i = len - 1; i >= 0; i--) {
      r = pipe(fa.branches[i], reduceRight(r, f))
    }
    return f(fa.value, r)
  }

export const extract: <A>(wa: RoseTree<A>) => A = (wa) => wa.value

// export const traverse = <F extends TypeLambda>(
//   F: applicative.Applicative<F>
// ): (<A, B>(f: (a: A) => HKT<F, B>) => (ta: RoseTree<A>) => HKT<F, RoseTree<B>>) => {
//   const traverseF = A.traverse(F)
//   const out =
//     <A, B>(f: (a: A) => HKT<F, B>) =>
//     (ta: RoseTree<A>): HKT<F, RoseTree<B>> =>
//       F.ap(
//         F.map(f(ta.value), (value: B) => (branches: Branches<B>) => ({
//           value,
//           branches
//         })),
//         pipe(ta.branches, traverseF(out(f)))
//       )
//   return out
// }


// export const sequence: Traversable1<URI>['sequence'] = <F>(
//   F: ApplicativeHKT<F>
// ): (<A>(ta: RoseTree<HKT<F, A>>) => HKT<F, RoseTree<A>>) => traverse(F)(identity)


export const of: <A>(a: A) => RoseTree<A> = (a) => make(a)


// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

// export function elem<A>(E: Eq<A>): (a: A, fa: RoseTree<A>) => boolean {
//   const go = (a: A, fa: RoseTree<A>): boolean => E.equals(a, fa.value) || fa.branches.some((RoseTree) => go(a, RoseTree))
//   return go
// }

// export const has = dual<
//   <A>(a: A) => <A>(self: RoseTree<A>) => boolean,
//   <A>(self: RoseTree<A>, a: A) => boolean
// >(2, (self, a) => Option.isSome(findFirst(self, a)))


// export const exists =
//   <A>(predicate: Predicate<A>) =>
//   (ma: RoseTree<A>): boolean =>
//     predicate(ma.value) || ma.branches.some(exists(predicate))


export const getEquivalence = <A>(E: equivalence.Equivalence<A>): equivalence.Equivalence<RoseTree<A>> =>
  equivalence.make((x,y) => E(x.value, y.value))

export const getBranchEquivalence = <A>(E: equivalence.Equivalence<A>): equivalence.Equivalence<RoseTree<A>> =>
  equivalence.make((x,y) => E(x.value, y.value) && pipe(
    x.branches.map(extract),
    RA.zipWith(y.branches.map(extract), E),
    RA.every(identity)
  )
)

/**
 * Like `reduce` with the combining function applied to the 
 */
export const reshape =
  <A, B>(b: B, f: (b: B, fa: RoseTree<A>) => B) =>
  (ma: RoseTree<A>): B => {
    let r: B = f(b, ma)
    const len = ma.branches.length
    for (let i = 0; i < len; i++) {
      r = pipe(ma.branches[i], reshape(r, f))
    }
    return r
  }

/**
 * Takes a RoseTree and returns an array of pairs for every parent-child relationship.
 * 
 * For example:
 * 
 */
export const toPairs = <A>(fa:RoseTree<A>) => pipe(
  fa,
  reshape([] as [RoseTree<A>, RoseTree<A>][], 
    (b, fa) => ([
      ...b, 
      ...fa.branches.map(branch => ([of(fa.value), of(branch.value)] as [RoseTree<A>, RoseTree<A>]))
    ])
  )
)

export const toPaths = <A>(fa:RoseTree<A>) => pipe(
  fa,
  fold<A, A[][]>((a, bs) => (bs.length > 0) ? RA.flatMap(bs, (bbs) => bbs.map(bbbs => [a, ...bbbs])) : [[a]])
)
