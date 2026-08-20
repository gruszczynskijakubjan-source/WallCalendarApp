import type { AppProps } from "next/app";
import type { Session } from "next-auth";
import Head from "next/head";
import { SessionProvider } from "next-auth/react";
import ThemeParticles from "@/components/ThemeParticles";
import SpringGrass from "@/components/SpringGrass";
import SummerSunGlare from "@/components/SummerSunGlare";
import NewYearFireworks from "@/components/NewYearFireworks";
import EasterBunnyRun from "@/components/EasterBunnyRun";
import ChristmasGarland from "@/components/ChristmasGarland";
import "@/app/globals.css";

export default function App({
  Component,
  pageProps,
}: AppProps<{ session?: Session }>) {
  return (
    <SessionProvider session={pageProps.session}>
      <Head>
        <title>Kalendarz domowy</title>
        <meta name="description" content="Wspólny kalendarz i lista zadań rodziny" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ThemeParticles />
      <SpringGrass themes="spring,easter,mayday" />
      <SummerSunGlare />
      <NewYearFireworks />
      <EasterBunnyRun />
      <ChristmasGarland />
      <Component {...pageProps} />
    </SessionProvider>
  );
}
