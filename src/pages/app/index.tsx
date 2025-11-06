import { GetServerSideProps } from "next";

export default function AppIndexRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/app/overview",
      permanent: false,
    },
  };
};