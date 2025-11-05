import type { GetServerSideProps } from "next";

export default function ZonesRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/app/districts",
      permanent: false,
    },
  };
};