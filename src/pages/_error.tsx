/* src/pages/_error.tsx */
import { NextPageContext } from "next";
import DefaultErrorComponent from "next/error";

type Props = { statusCode?: number };

function ErrorPage({ statusCode }: Props) {
  // Lightweight guard and console for visibility in dev
  if (process.env.NODE_ENV !== "production") {
    // Don't throw; just log
    // eslint-disable-next-line no-console
    console.error("[_error] rendering with status:", statusCode);
  }
  return <DefaultErrorComponent statusCode={statusCode ?? 500} />;
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default ErrorPage;
