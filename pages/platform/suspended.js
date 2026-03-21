// pages/platform/suspended.js
import Head from "next/head";
import SuspendedScreen from "../../src/components/dashboard/SuspendedScreen";

export default function SuspendedPage() {
  return (
    <>
      <Head>
        <title>Account Suspended | BlueWise AI</title>
      </Head>
      <SuspendedScreen />
    </>
  );
}
