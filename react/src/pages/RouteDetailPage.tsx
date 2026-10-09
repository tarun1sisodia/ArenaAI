import React from "react";
import { type Route } from "../data/catalogue";
import { RouteTemplate } from "../templates/RouteTemplate";

export interface RouteDetailPageProps {
  language?: "en" | "hi";
  route: Route;
}

export function RouteDetailPage({ language = "en", route }: RouteDetailPageProps) {
  return <RouteTemplate language={language} route={route} />;
}

export default RouteDetailPage;
