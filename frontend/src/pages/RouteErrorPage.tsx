import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

export function RouteErrorPage() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : undefined;
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : "Something went wrong.";

  return (
    <div className="shell">
      <section className="panel narrow-panel status-card">
        <p className="eyebrow">{status ? `Route ${status}` : "Application error"}</p>
        <h1>{status === 404 ? "That page is not part of the shop." : "The shop hit a snag."}</h1>
        <p className="muted">{message}</p>
        <div className="button-row">
          <Link className="primary-button" to="/">Return to shop</Link>
          <Link className="secondary-button" to="/checkout">View cart</Link>
        </div>
      </section>
    </div>
  );
}
