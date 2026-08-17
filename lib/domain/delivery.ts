/**
 * Delivery vocabulary — the parts of Epic 5 that are values rather than actions.
 *
 * This exists because of a hard rule rather than a design preference: a
 * `"use server"` module may only export async functions. Everything it exports
 * becomes a callable server endpoint, so a plain array cannot live there — Next
 * fails the build with "a 'use server' file can only export async functions,
 * found object", and it fails at page-data collection rather than in the type
 * checker, so `tsc --noEmit` is perfectly happy right up until the deploy dies.
 *
 * Types are fine to export from a server module because they are erased. Values
 * are not. When something in `app/actions/` turns out to be a value, it belongs
 * here.
 */

/** The only reasons a driver can raise, so the flag is scannable, not prose. */
export const PROBLEM_REASONS = [
  "Nobody answered",
  "Address is wrong",
  "Customer refused it",
  "I cannot get there",
] as const;

export type ProblemReason = (typeof PROBLEM_REASONS)[number];
